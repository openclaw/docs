---
read_when:
    - Überprüfung von Uploads auf Missbrauch oder Richtlinienverstöße
    - Moderationsdokumentation oder Runbooks für Prüfende verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marketplace-Richtlinie: Was ClawHub erlaubt und was es nicht hostet.'
x-i18n:
    generated_at: "2026-05-12T04:09:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten für ClawHub akzeptabel sind und welche Missbrauchs-Workflows dort nicht gehostet werden.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um End-to-End-Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dafür gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die ausdrücklich akzeptabel sind

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete Nutzerabläufe verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliase und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare beibehält, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen prüfbar hält.
- Defensive Sicherheitsprüfung, Moderationstools und Prompts zur Missbrauchserkennung, die Nachweise zeigen und Grenzen menschlicher Freigabe klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche Konten oder Teamkonten mit ausdrücklichen Anmeldedaten, transparenter Einrichtung und Dry-Run- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software beschränkt sind, die sie unterstützen.

## Nicht akzeptabel

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Authentifizierungsumgehung, Kontoübernahme, CAPTCHA-Umgehung, Umgehung von Cloudflare oder Anti-Bot-Schutz, Umgehung von Ratenbegrenzungen, verdecktes Scraping, das darauf ausgelegt ist, Schutzmaßnahmen auszuhebeln, Übernahme von Live-Anrufen oder Agents, wiederverwendbarer Sitzungsdiebstahl, automatische Genehmigung von Kopplungsabläufen für nicht genehmigte Nutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: verdeckte Konten nach Sperren, Konto-Warming oder -Farming, vorgetäuschte Interaktion, Aufbau von Karma oder Followern, Multi-Konto-Automatisierung, Massenposting, Spam-Bots, Marketplace- oder Social-Automatisierung, die zur Umgehung von Erkennung gebaut ist.

- Betrug, Scams und täuschende Finanz-Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, täuschende Zahlungsabläufe, Scam-Ansprache, gefälschter Social Proof, Tools, die Ausgaben oder Abbuchungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows mit synthetischen Identitäten, die zur Erstellung von Konten für Betrug gebaut sind.

- Privatsphäreverletzendes Scraping, Anreicherung oder Überwachung.
  - Beispiele: massenhaftes Scraping von Kontaktdaten für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Ansprache, verdeckte Überwachung, Gesichtssuche oder biometrischer Abgleich ohne klare Einwilligung oder Kauf, Veröffentlichung, Download oder Operationalisierung geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Nachahmung oder täuschende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Tools zur Identitätsmanipulation, die zur Nachahmung oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und sicherheitsdeaktivierte Erwachsenengenerierung.
  - Beispiele: NSFW-Bild-, Video- oder Inhaltsgenerierung, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Versteckte, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Geheimnisanforderungen, nicht deklarierte Nutzung privater Schlüssel, entfernte Ausführung von `npx @latest` ohne klare Prüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zur Ausführung benötigt.

## Aktuelle Muster, die ausdrücklich nicht akzeptabel sind

- „Erstellen Sie verdeckte Verkäuferkonten nach Marketplace-Sperren.“
- „Ändern Sie die Telegram-Kopplung so, dass nicht genehmigte Nutzer automatisch Kopplungscodes erhalten.“
- „Bauen Sie Reddit-/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generieren Sie professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generieren Sie NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrapen Sie Leads, reichern Sie Kontakte an und starten Sie Kaltakquise in großem Maßstab.“
- „Kaufen, veröffentlichen oder laden Sie geleakte Daten oder Breach-Dumps herunter.“
- „Erstellen Sie massenhaft E-Mail- oder Social-Konten mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Reviewer

- Kontext ist wichtig. Dasselbe Thema kann in einem eng gefassten defensiven oder einwilligungsbasierten Rahmen legitim und als paketierter Missbrauchs-Workflow inakzeptabel sein.
- Wir sollten zum Handeln tendieren, wenn ein Skill eindeutig auf Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können verletzende Skills ausblenden, entfernen oder dauerhaft löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte per Soft Delete löschen und Wiederholungstäter oder schwere Verstöße sperren.
- Wir garantieren bei offensichtlichem Missbrauch keine vorherige Warnung.
