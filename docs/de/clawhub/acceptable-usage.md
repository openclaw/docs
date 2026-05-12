---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße überprüfen
    - Verfassen von Moderationsdokumentation oder Prüfer-Runbooks
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marketplace-Richtlinie: Was ClawHub zulässt und was es nicht hostet.'
x-i18n:
    generated_at: "2026-05-12T23:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten für ClawHub akzeptabel sind und welche Missbrauchs-Workflows dort nicht gehostet werden.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um durchgängige Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dafür gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, zugängliche Zustände und getestete Benutzerabläufe verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliasse und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare beibehält, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen überprüfbar hält.
- Defensive Sicherheitsprüfung, Moderationstooling und Prompts zur Missbrauchserkennung, die Belege zeigen und Grenzen für menschliche Freigabe klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche Konten oder Teamkonten mit expliziten Zugangsdaten, transparenter Einrichtung und Probelauf- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software beschränkt sind, die sie unterstützen.

## Nicht akzeptabel

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Auth-Bypass, Kontoübernahme, CAPTCHA-Bypass, Umgehung von Cloudflare oder Anti-Bot-Systemen, Umgehung von Rate-Limits, verdecktes Scraping zur gezielten Aushebelung von Schutzmechanismen, Übernahme laufender Anrufe oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatische Freigabe von Pairing-Flows für nicht genehmigte Benutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: verdeckte Konten nach Sperren, Account Warming/Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenveröffentlichungen, Spam-Bots, Marketplace- oder Social-Automatisierung, die zur Vermeidung von Erkennung gebaut ist.

- Betrug, Scams und irreführende Finanz-Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, irreführende Zahlungsabläufe, Scam-Kontaktaufnahme, gefälschte Social Proofs, Tools, die Ausgaben oder Belastungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows mit synthetischen Identitäten, die zur Erstellung von Konten für Betrug gebaut sind.

- Privatsphäre verletzendes Scraping, Anreichern oder Überwachen.
  - Beispiele: Scraping von Kontaktdaten in großem Umfang für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, Gesichtssuche oder biometrischer Abgleich ohne klare Einwilligung oder Kauf, Veröffentlichung, Download oder operative Nutzung geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Identitätsnachahmung oder irreführende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Identitätsmanipulations-Tools, die zur Nachahmung oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und Erwachsenen-Generierung mit deaktivierten Sicherheitsmechanismen.
  - Beispiele: NSFW-Bild-/Video-/Inhaltsgenerierung, Wrapper für Erwachsenen-Inhalte um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Versteckte, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Secret-Anforderungen, nicht deklarierte Nutzung privater Schlüssel, entfernte Ausführung von `npx @latest` ohne klare Überprüfbarkeit, irreführende Metadaten, die verbergen, was der Skill tatsächlich für die Ausführung benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Erstelle verdeckte Verkäuferkonten nach Marketplace-Sperren.“
- „Ändere das Telegram-Pairing so, dass nicht genehmigte Benutzer automatisch Pairing-Codes erhalten.“
- „Baue Reddit/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generiere professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generiere NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrape Leads, reichern Sie Kontakte an und starten Sie Cold Outreach in großem Umfang.“
- „Kaufe, veröffentliche oder lade geleakte Daten oder Breach-Dumps herunter.“
- „Erstelle E-Mail- oder Social-Konten massenhaft mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Prüfer

- Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder einwilligungsbasierten Rahmen legitim und als verpackter Missbrauchs-Workflow inakzeptabel sein.
- Wir sollten zum Handeln tendieren, wenn ein Skill eindeutig auf Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können verletzende Skills ausblenden, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte per Soft Delete löschen und Wiederholungstäter oder schwere Verstöße sperren.
- Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung.
