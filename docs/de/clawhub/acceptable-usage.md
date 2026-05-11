---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marketplace-Richtlinie: was ClawHub zulässt und was es nicht hostet.'
x-i18n:
    generated_at: "2026-05-11T20:22:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt die Arten von Skills und Inhalten, die ClawHub akzeptiert, sowie die Missbrauchs-Workflows, die es nicht hostet.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um durchgängige Missbrauchs-Workflows, nicht nur um einzelne Schlüsselwörter. Wenn ein Skill dafür gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete Nutzerflüsse verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliase und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare erhält, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen überprüfbar hält.
- Defensive Sicherheitsprüfung, Moderationswerkzeuge und Prompts zur Missbrauchserkennung, die Nachweise zeigen und Grenzen für menschliche Freigaben klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche Konten oder Teamkonten mit ausdrücklichen Zugangsdaten, transparenter Einrichtung und Dry-Run- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software beschränkt sind, die sie unterstützen.

## Nicht akzeptabel

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Authentifizierungsumgehung, Kontoübernahme, CAPTCHA-Umgehung, Cloudflare- oder Anti-Bot-Umgehung, Umgehung von Rate-Limits, Stealth-Scraping, das darauf ausgelegt ist, Schutzmaßnahmen zu überwinden, Übernahme von Live-Anrufen oder Agents, wiederverwendbarer Sitzungsdiebstahl, automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: Stealth-Konten nach Sperren, Account-Warming/Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenveröffentlichungen, Spam-Bots, Marktplatz- oder Social-Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.

- Betrug, Scams und irreführende Finanz-Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, irreführende Zahlungsabläufe, Scam-Outreach, gefälschte soziale Belege, Werkzeuge, die Ausgaben oder Abbuchungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows für synthetische Identitäten, die darauf ausgelegt sind, Konten für Betrug zu erstellen.

- Privatsphäre verletzendes Scraping, Anreichern oder Überwachen.
  - Beispiele: Scraping von Kontaktdaten in großem Umfang für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgefordertem Outreach, verdeckte Überwachung, Gesichtssuche oder biometrischer Abgleich ohne klare Einwilligung, oder Kauf, Veröffentlichung, Herunterladen oder operative Nutzung geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Imitation oder irreführende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Werkzeuge zur Identitätsmanipulation, die zur Imitation oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und Adult-Generierung mit deaktivierten Sicherheitsfunktionen.
  - Beispiele: Generierung von NSFW-Bildern, -Videos oder -Inhalten, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Versteckte, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Secret-Anforderungen, nicht deklarierte Nutzung privater Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Überprüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zum Ausführen benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Erstellen Sie Stealth-Verkäuferkonten nach Marktplatz-Sperren.“
- „Ändern Sie das Telegram-Pairing so, dass nicht genehmigte Nutzer automatisch Pairing-Codes erhalten.“
- „Bauen Sie Reddit/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generieren Sie professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generieren Sie NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrapen Sie Leads, reichern Sie Kontakte an und starten Sie Cold Outreach in großem Umfang.“
- „Kaufen, veröffentlichen oder laden Sie geleakte Daten oder Breach-Dumps herunter.“
- „Erstellen Sie E-Mail- oder Social-Konten massenhaft mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Reviewer

- Kontext ist entscheidend. Dasselbe Thema kann in einem engen defensiven oder einwilligungsbasierten Rahmen legitim sein und inakzeptabel, wenn es als Missbrauchs-Workflow verpackt ist.
- Wir sollten zum Handeln tendieren, wenn ein Skill eindeutig auf Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe dafür, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können gegen Regeln verstoßende Skills ausblenden, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte per Soft-Delete löschen und wiederholte oder schwerwiegende Verstöße sperren.
- Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung.
