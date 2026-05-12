---
read_when:
    - Überprüfen von Uploads auf Missbrauch oder Richtlinienverstöße
    - Moderationsdokumentation oder Runbooks für Prüfende verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marktplatzrichtlinie: was ClawHub erlaubt und was dort nicht gehostet wird.'
x-i18n:
    generated_at: "2026-05-12T08:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten für ClawHub in Ordnung sind und welche Missbrauchs-Workflows nicht gehostet werden.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um End-to-End-Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dafür gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die für uns ausdrücklich in Ordnung sind

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, zugängliche Zustände und getestete User-Flows verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliasse und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare beibehält, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen reviewbar hält.
- Defensive Security-Reviews, Moderationswerkzeuge und Prompts zur Missbrauchserkennung, die Nachweise zeigen und Grenzen für menschliche Freigabe klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche oder Team-Konten mit expliziten Zugangsdaten, transparenter Einrichtung und Probelauf- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software beschränkt sind, die sie unterstützen.

## Nicht in Ordnung

- Workflows zur Umgehung von Sicherheit oder für unbefugten Zugriff.
  - Beispiele: Umgehung von Authentifizierung, Kontoübernahme, CAPTCHA-Umgehung, Cloudflare- oder Anti-Bot-Umgehung, Umgehung von Rate-Limits, verdecktes Scraping zum Aushebeln von Schutzmaßnahmen, Übernahme laufender Anrufe oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatische Genehmigung von Pairing-Flows für nicht genehmigte Benutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: verdeckte Konten nach Sperren, Account-Warming/-Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenposting, Spam-Bots, Marketplace- oder Social-Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.

- Betrug, Scams und täuschende finanzielle Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschter Social Proof, Werkzeuge, die Ausgaben oder Abbuchungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows für synthetische Identitäten, die zum Erstellen von Konten für Betrug gebaut sind.

- Scraping, Anreicherung oder Überwachung, die in die Privatsphäre eingreift.
  - Beispiele: Scraping von Kontaktdaten in großem Maßstab für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unerbetener Ansprache, verdeckte Überwachung, Gesichtssuche oder biometrisches Matching ohne klare Einwilligung, oder das Kaufen, Veröffentlichen, Herunterladen oder Operationalisieren geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Imitation oder täuschende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Werkzeuge zur Identitätsmanipulation, die zum Imitieren oder Irreführen verwendet werden.

- Explizite sexuelle Inhalte und Adult-Generierung mit deaktivierten Sicherheitsmaßnahmen.
  - Beispiele: NSFW-Bild-/Video-/Inhaltsgenerierung, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Verborgene, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Geheimnisanforderungen, nicht deklarierte Nutzung privater Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Reviewbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zum Ausführen benötigt.

## Aktuelle Muster, die für uns ausdrücklich nicht in Ordnung sind

- „Erstellen Sie verdeckte Verkäuferkonten nach Marketplace-Sperren.“
- „Ändern Sie Telegram-Pairing so, dass nicht genehmigte Benutzer automatisch Pairing-Codes erhalten.“
- „Bauen Sie Reddit-/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generieren Sie professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generieren Sie NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrapen Sie Leads, reichern Sie Kontakte an und starten Sie Cold Outreach in großem Maßstab.“
- „Kaufen, veröffentlichen oder laden Sie geleakte Daten oder Breach-Dumps herunter.“
- „Erstellen Sie E-Mail- oder Social-Konten massenhaft mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Reviewer

- Kontext ist wichtig. Dasselbe Thema kann in einem eng gefassten defensiven oder einwilligungsbasierten Rahmen legitim und als Missbrauchs-Workflow verpackt unzulässig sein.
- Wir sollten eher handeln, wenn ein Skill klar für Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe dafür, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können verletzende Skills ausblenden, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte per Soft-Delete entfernen und Wiederholungstäter oder schwerwiegende Täter sperren.
- Bei offensichtlichem Missbrauch garantieren wir keine Durchsetzung erst nach vorheriger Warnung.
