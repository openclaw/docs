---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden soll
summary: 'Marketplace-Richtlinie: was ClawHub zulässt und was ClawHub nicht hostet.'
x-i18n:
    generated_at: "2026-05-10T19:25:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt die Arten von Skills und Inhalten, die auf ClawHub zulässig sind, sowie die Missbrauchsabläufe, die ClawHub nicht hostet.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um durchgängige Missbrauchsabläufe, nicht nur um isolierte Schlagwörter. Wenn ein Skill darauf ausgelegt ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete Benutzerabläufe verwendet.
- shadcn/ui-Kompositionen, die installierte Quellkomponenten, Projekt-Aliase und dokumentierte Varianten statt einmaligem Markup verwenden.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare beibehält, konkrete UI5-Typen verwendet und generierte Control-Interfaces überprüfbar hält.
- Defensive Sicherheitsprüfung, Moderationstools und Prompts zur Missbrauchserkennung, die Belege zeigen und Grenzen für menschliche Freigaben klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche oder Team-Konten mit expliziten Zugangsdaten, transparenter Einrichtung und Trockenlauf- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die unterstützte Software begrenzt sind.

## Nicht akzeptabel

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Authentifizierungsumgehung, Kontoübernahme, CAPTCHA-Umgehung, Cloudflare- oder Anti-Bot-Umgehung, Rate-Limit-Umgehung, heimliches Scraping zur gezielten Aushebelung von Schutzmaßnahmen, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatische Freigabe von Pairing-Abläufen für nicht genehmigte Benutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: heimliche Konten nach Sperren, Account-Warming oder Account-Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenveröffentlichung, Spam-Bots, Marktplatz- oder Social-Media-Automatisierung zur Vermeidung von Erkennung.

- Betrug, Scams und täuschende finanzielle Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschter Social Proof, Tools, die Ausgaben oder Abbuchungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows mit synthetischen Identitäten zur Erstellung von Konten für Betrug.

- Datenschutzverletzendes Scraping, Anreicherung oder Überwachung.
  - Beispiele: Scraping von Kontaktdaten in großem Umfang für Spam, Doxxing, Stalking, Lead-Extraktion in Kombination mit unaufgefordertem Outreach, verdeckte Überwachung, Gesichtssuche oder biometrischer Abgleich ohne klare Einwilligung, oder der Kauf, die Veröffentlichung, das Herunterladen oder die operative Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.

- Nicht einvernehmliche Imitation oder täuschende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Tools zur Identitätsmanipulation, die zur Imitation oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und Adult-Generierung mit deaktivierten Sicherheitsmaßnahmen.
  - Beispiele: Generierung von NSFW-Bildern, -Videos oder -Inhalten, Adult-Content-Wrapper um APIs von Drittanbietern oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Verborgene, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Secret-Anforderungen, nicht deklarierte Nutzung privater Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Überprüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zum Ausführen benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Erstelle heimliche Verkäuferkonten nach Marktplatzsperren.“
- „Ändere das Telegram-Pairing so, dass nicht genehmigte Benutzer automatisch Pairing-Codes erhalten.“
- „Baue Reddit/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generiere professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generiere NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrape Leads, reichere Kontakte an und starte Cold Outreach in großem Umfang.“
- „Kaufe, veröffentliche oder lade geleakte Daten oder Daten aus Sicherheitsverletzungen herunter.“
- „Erstelle massenhaft E-Mail- oder Social-Media-Konten mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Prüfer

- Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng defensiven oder einwilligungsbasierten Umfeld legitim und als Missbrauchsworkflow verpackt inakzeptabel sein.
- Wir sollten zum Handeln tendieren, wenn ein Skill eindeutig für Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können verletzende Skills ausblenden, entfernen oder dauerhaft löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte per Soft Delete löschen und wiederholte oder schwere Verstöße sperren.
- Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung erst nach vorheriger Warnung.
