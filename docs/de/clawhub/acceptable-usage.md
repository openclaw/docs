---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Verfassen von Moderationsdokumentation oder Prüfer-Leitfäden
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marketplace-Richtlinie: was ClawHub zulässt und was dort nicht gehostet wird.'
x-i18n:
    generated_at: "2026-05-13T05:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten für ClawHub akzeptabel sind und welche Missbrauchs-Workflows dort nicht gehostet werden.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um Missbrauchs-Workflows von Anfang bis Ende, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dazu entwickelt wurde, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete Benutzerflüsse verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliasse und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare beibehält, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen überprüfbar hält.
- Defensive Sicherheitsprüfung, Moderationswerkzeuge und Prompts zur Missbrauchserkennung, die Belege zeigen und Grenzen für menschliche Freigabe klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche oder Team-Konten mit expliziten Zugangsdaten, transparenter Einrichtung und Dry-Run- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software begrenzt sind, die sie unterstützen.

## Nicht akzeptabel

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Authentifizierungsumgehung, Kontoübernahme, CAPTCHA-Umgehung, Cloudflare- oder Anti-Bot-Umgehung, Umgehung von Ratenbegrenzungen, verdecktes Scraping zur Aushebelung von Schutzmaßnahmen, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatische Genehmigung von Pairing-Abläufen für nicht genehmigte Benutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: verdeckte Konten nach Sperren, Account-Warming oder -Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Automatisierung mehrerer Konten, Massenveröffentlichungen, Spam-Bots, Marktplatz- oder Social-Automatisierung, die zur Erkennungvermeidung gebaut ist.

- Betrug, Scams und täuschende Finanz-Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschte soziale Bestätigung, Werkzeuge, die Ausgaben oder Abbuchungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows mit synthetischen Identitäten, die zur Erstellung von Konten für Betrug gebaut sind.

- Datenschutzverletzendes Scraping, Anreicherung oder Überwachung.
  - Beispiele: Scraping von Kontaktdaten in großem Umfang für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Ansprache, verdeckte Überwachung, Gesichtssuche oder biometrischer Abgleich ohne klare Einwilligung oder das Kaufen, Veröffentlichen, Herunterladen oder Operationalisieren geleakter Daten oder Datenpannen-Dumps.

- Nicht einvernehmliche Imitation oder täuschende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Werkzeuge zur Identitätsmanipulation, die zur Imitation oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und Adult-Generierung mit deaktivierten Schutzmaßnahmen.
  - Beispiele: NSFW-Bild-/Video-/Inhaltsgenerierung, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Verborgene, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Secret-Anforderungen, nicht deklarierte Nutzung privater Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Überprüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zum Ausführen benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Erstelle verdeckte Verkäuferkonten nach Marktplatzsperren.“
- „Ändere Telegram-Pairing so, dass nicht genehmigte Benutzer automatisch Pairing-Codes erhalten.“
- „Baue Reddit/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generiere professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generiere NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrape Leads, reichere Kontakte an und starte Kaltakquise in großem Umfang.“
- „Kaufe, veröffentliche oder lade geleakte Daten oder Datenpannen-Dumps herunter.“
- „Erstelle massenhaft E-Mail- oder Social-Konten mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Prüfer

- Kontext ist entscheidend. Dasselbe Thema kann in einem engen defensiven oder einwilligungsbasierten Rahmen legitim und als verpackter Missbrauchs-Workflow unzulässig sein.
- Wir sollten zum Handeln tendieren, wenn ein Skill eindeutig auf Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können verletzende Skills ausblenden, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte soft-löschen und Wiederholungstäter oder schwerwiegende Täter sperren.
- Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung erst nach Warnung.
