---
read_when:
    - Überprüfung von Uploads auf Missbrauch oder Richtlinienverstöße
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marketplace-Richtlinie: was ClawHub zulässt und was es nicht hostet.'
x-i18n:
    generated_at: "2026-05-12T00:56:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten ClawHub akzeptiert und welche Missbrauchs-Workflows dort nicht gehostet werden.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um vollständige Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dafür gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, Privatsphäre zu verletzen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete Benutzerabläufe verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliasse und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare bewahrt, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen prüfbar hält.
- Defensive Sicherheitsprüfung, Moderationstools und Prompts zur Missbrauchserkennung, die Belege zeigen und Grenzen für menschliche Genehmigung klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche Konten oder Teamkonten mit ausdrücklichen Zugangsdaten, transparenter Einrichtung und Probelauf- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software beschränkt sind, die sie unterstützen.

## Nicht akzeptiert

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Authentifizierungsumgehung, Kontoübernahme, CAPTCHA-Umgehung, Umgehung von Cloudflare oder Anti-Bot-Systemen, Umgehung von Rate-Limits, verdecktes Scraping, das darauf ausgelegt ist, Schutzmaßnahmen zu überwinden, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatisches Genehmigen von Pairing-Abläufen für nicht genehmigte Benutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: verdeckte Konten nach Sperren, Account-Warming oder Account-Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenveröffentlichungen, Spam-Bots, Marketplace- oder Social-Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.

- Betrug, Scams und irreführende finanzielle Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, irreführende Zahlungsabläufe, Scam-Outreach, gefälschte Social Proofs, Tools, die Ausgaben oder Abbuchungen ohne klare menschliche Genehmigung und transparente Kontrollen ermöglichen, oder Workflows mit synthetischen Identitäten, die zum Erstellen von Konten für Betrug gebaut sind.

- Privatsphäreverletzendes Scraping, Anreichern oder Überwachen.
  - Beispiele: massenhaftes Scraping von Kontaktdaten für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unerbetenem Outreach, verdeckte Überwachung, Gesichtssuche oder biometrischer Abgleich ohne klare Einwilligung oder der Kauf, die Veröffentlichung, der Download oder die Operationalisierung geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Imitation oder irreführende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Tools zur Identitätsmanipulation, die zur Imitation oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und sicherheitsdeaktivierte Erwachsenen-Generierung.
  - Beispiele: Generierung von NSFW-Bildern, -Videos oder -Inhalten, Wrapper für Erwachsenen-Inhalte um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Versteckte, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Secret-Anforderungen, nicht deklarierte Nutzung privater Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zum Ausführen benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Erstellen Sie verdeckte Verkäuferkonten nach Marketplace-Sperren.“
- „Ändern Sie das Telegram-Pairing so, dass nicht genehmigte Benutzer automatisch Pairing-Codes erhalten.“
- „Bauen Sie Reddit-/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generieren Sie professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generieren Sie NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrapen Sie Leads, reichern Sie Kontakte an und starten Sie Cold Outreach im großen Maßstab.“
- „Kaufen, veröffentlichen oder laden Sie geleakte Daten oder Breach-Dumps herunter.“
- „Erstellen Sie massenhaft E-Mail- oder Social-Konten mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Prüfer

- Kontext ist wichtig. Dasselbe Thema kann in einem eng begrenzten defensiven oder einwilligungsbasierten Rahmen legitim und inakzeptabel sein, wenn es als Missbrauchs-Workflow verpackt ist.
- Wir sollten zum Handeln tendieren, wenn ein Skill klar auf Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe dafür, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können regelverletzende Skills ausblenden, entfernen oder dauerhaft löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte soft-löschen und Wiederholungstäter oder schwerwiegende Verstöße sperren.
- Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung.
