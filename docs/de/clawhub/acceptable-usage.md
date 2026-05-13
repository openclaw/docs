---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Runbooks für Reviewende schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden soll
summary: 'Marktplatzrichtlinie: was ClawHub zulässt und was es nicht hostet.'
x-i18n:
    generated_at: "2026-05-13T02:51:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten für ClawHub akzeptabel sind und welche Missbrauchs-Workflows nicht gehostet werden.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um durchgängige Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dafür gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete Benutzerabläufe verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliase und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-JavaScript-zu-TypeScript-Konvertierung, die Kommentare beibehält, konkrete UI5-Typen verwendet und generierte Control-Interfaces überprüfbar hält.
- Defensive Sicherheitsüberprüfung, Moderationswerkzeuge und Missbrauchserkennungs-Prompts, die Nachweise zeigen und Grenzen für menschliche Freigabe klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche Konten oder Teamkonten mit ausdrücklichen Zugangsdaten, transparenter Einrichtung und Probelauf- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software beschränkt sind, die sie unterstützen.

## Nicht akzeptabel

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Umgehung von Authentifizierung, Kontoübernahme, CAPTCHA-Umgehung, Umgehung von Cloudflare oder Anti-Bot-Maßnahmen, Umgehung von Ratenbegrenzungen, verdecktes Scraping zum Aushebeln von Schutzmaßnahmen, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatische Genehmigung von Pairing-Flows für nicht genehmigte Benutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: verdeckte Konten nach Sperren, Account-Warming/Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenposting, Spam-Bots, Marktplatz- oder Social-Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.

- Betrug, Scams und irreführende Finanz-Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, irreführende Zahlungsabläufe, Scam-Outreach, gefälschte soziale Belege, Werkzeuge, die Ausgaben oder Belastungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows für synthetische Identitäten, die darauf ausgelegt sind, Konten für Betrug zu erstellen.

- In die Privatsphäre eingreifendes Scraping, Anreichern oder Überwachen.
  - Beispiele: Scraping von Kontaktdaten in großem Maßstab für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgeforderter Ansprache, verdeckte Überwachung, Gesichtssuche oder biometrisches Matching ohne klare Einwilligung oder der Kauf, die Veröffentlichung, das Herunterladen oder die Operationalisierung geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Nachahmung oder irreführende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Werkzeuge zur Identitätsmanipulation, die zur Nachahmung oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und Erwachsenen-Generierung mit deaktivierten Sicherheitsmaßnahmen.
  - Beispiele: NSFW-Bild-/Video-/Inhaltsgenerierung, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Verborgene, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Geheimnisanforderungen, nicht deklarierte Nutzung privater Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Überprüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zur Ausführung benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Erstellen Sie verdeckte Verkäuferkonten nach Marktplatz-Sperren.“
- „Ändern Sie Telegram-Pairing so, dass nicht genehmigte Benutzer automatisch Pairing-Codes erhalten.“
- „Bauen Sie Reddit-/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generieren Sie professionelle Zertifikate oder Rechnungen für beliebige Nutzung.“
- „Generieren Sie NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrapen Sie Leads, reichern Sie Kontakte an und starten Sie Cold Outreach in großem Maßstab.“
- „Kaufen, veröffentlichen oder laden Sie geleakte Daten oder Breach-Dumps herunter.“
- „Erstellen Sie E-Mail- oder Social-Konten massenhaft mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Prüfer

- Kontext ist wichtig. Dasselbe Thema kann in einem eng begrenzten defensiven oder einwilligungsbasierten Umfeld legitim und inakzeptabel sein, wenn es als Missbrauchs-Workflow verpackt ist.
- Wir sollten zum Handeln tendieren, wenn ein Skill klar auf Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können regelverletzende Skills ausblenden, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte per Soft Delete löschen und Wiederholungstäter oder schwerwiegende Verstöße sperren.
- Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung.
