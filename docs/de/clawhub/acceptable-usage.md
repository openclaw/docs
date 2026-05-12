---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marktplatzrichtlinie: welche Inhalte ClawHub zulässt und welche es nicht hosten wird.'
x-i18n:
    generated_at: "2026-05-12T12:53:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Akzeptable Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten für ClawHub in Ordnung sind und welche Missbrauchs-Workflows dort nicht gehostet werden.

Diese Regeln sind bewusst praktisch gehalten. Uns geht es vor allem um durchgängige Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill darauf ausgelegt ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die für uns ausdrücklich in Ordnung sind

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete Nutzerabläufe verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliasse und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-JavaScript-zu-TypeScript-Konvertierung, die Kommentare beibehält, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen überprüfbar hält.
- Defensive Sicherheitsprüfung, Moderationswerkzeuge und Prompts zur Missbrauchserkennung, die Nachweise zeigen und Grenzen für menschliche Freigaben klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche oder Team-Konten mit expliziten Zugangsdaten, transparenter Einrichtung und Probelauf- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software begrenzt sind, die sie unterstützen.

## Nicht in Ordnung

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Umgehung von Authentifizierung, Kontoübernahme, CAPTCHA-Umgehung, Umgehung von Cloudflare oder Anti-Bot-Maßnahmen, Umgehung von Ratenbegrenzungen, Stealth-Scraping zur gezielten Aushebelung von Schutzmaßnahmen, Übernahme von Live-Anrufen oder Agents, wiederverwendbarer Sitzungsdiebstahl, automatische Freigabe von Kopplungsabläufen für nicht genehmigte Nutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: Stealth-Konten nach Sperren, Account-Warming/-Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenposting, Spam-Bots, Marketplace- oder Social-Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.

- Betrug, Scams und irreführende Finanz-Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, irreführende Zahlungsabläufe, Scam-Outreach, gefälschte Social Proofs, Werkzeuge, die Ausgaben oder Abbuchungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows mit synthetischen Identitäten, die darauf ausgelegt sind, Konten für Betrug zu erstellen.

- Scraping, Anreicherung oder Überwachung, die in die Privatsphäre eingreift.
  - Beispiele: massenhaftes Scraping von Kontaktdaten für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgefordertem Outreach, verdeckte Überwachung, Gesichtssuche oder biometrisches Matching ohne klare Einwilligung, oder Kaufen, Veröffentlichen, Herunterladen oder operatives Nutzen geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Imitation oder irreführende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Werkzeuge zur Identitätsmanipulation, die zur Imitation oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und sicherheitsdeaktivierte Generierung von Erwachseneninhalt.
  - Beispiele: Generierung von NSFW-Bildern/-Videos/-Inhalten, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Verborgene, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Geheimnisanforderungen, nicht deklarierte Nutzung privater Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Überprüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zum Ausführen benötigt.

## Aktuelle Muster, die für uns ausdrücklich nicht in Ordnung sind

- „Erstellen Sie Stealth-Verkäuferkonten nach Marketplace-Sperren.“
- „Ändern Sie die Telegram-Kopplung so, dass nicht genehmigte Nutzer automatisch Kopplungscodes erhalten.“
- „Bauen Sie Reddit-/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generieren Sie professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generieren Sie NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrapen Sie Leads, reichern Sie Kontakte an und starten Sie Cold Outreach im großen Maßstab.“
- „Kaufen, veröffentlichen oder laden Sie geleakte Daten oder Breach-Dumps herunter.“
- „Erstellen Sie massenhaft E-Mail- oder Social-Konten mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Reviewer

- Kontext ist wichtig. Dasselbe Thema kann in einem eng gefassten defensiven oder einwilligungsbasierten Umfeld legitim sein und inakzeptabel werden, wenn es als Missbrauchs-Workflow paketiert ist.
- Wir sollten zum Handeln neigen, wenn ein Skill klar auf Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe dafür, Inhalte zu verbergen und das Konto zu sperren.

## Durchsetzung

- Wir können Skills, die gegen die Regeln verstoßen, verbergen, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte soft-deleten und wiederholte oder schwere Verstöße mit Kontosperren ahnden.
- Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung erst nach vorheriger Warnung.
