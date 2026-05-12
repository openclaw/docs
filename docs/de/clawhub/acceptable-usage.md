---
read_when:
    - Überprüfung von Uploads auf Missbrauch oder Richtlinienverstöße
    - Moderationsdokumentation oder Reviewer-Runbooks verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marktplatz-Richtlinie: Was ClawHub erlaubt und was es nicht hostet.'
x-i18n:
    generated_at: "2026-05-12T15:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten auf ClawHub akzeptiert werden und welche Missbrauchs-Workflows dort nicht gehostet werden.

Diese Regeln sind bewusst praxisorientiert. Uns geht es vor allem um durchgängige Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dazu gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, Privatsphäre zu verletzen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Designsystem-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete Nutzerabläufe verwendet.
- shadcn/ui-Kompositionen, die installierte Quellkomponenten, Projekt-Aliasse und dokumentierte Varianten statt einmaligem Markup verwenden.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare beibehält, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen überprüfbar hält.
- Defensive Sicherheitsprüfung, Moderationswerkzeuge und Prompts zur Missbrauchserkennung, die Nachweise zeigen und Grenzen für menschliche Freigaben klar halten.
- Zustimmungsbasierte Workflow-Automatisierung für persönliche Konten oder Teamkonten mit ausdrücklichen Zugangsdaten, transparenter Einrichtung und Probelauf- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software beschränkt sind, die sie unterstützen.

## Nicht akzeptiert

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unbefugten Zugriff.
  - Beispiele: Authentifizierungsumgehung, Kontoübernahme, CAPTCHA-Umgehung, Umgehung von Cloudflare oder Anti-Bot-Maßnahmen, Umgehung von Rate Limits, verdecktes Scraping zur gezielten Aushebelung von Schutzmaßnahmen, Übernahme laufender Anrufe oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatische Genehmigung von Kopplungsabläufen für nicht genehmigte Nutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: verdeckte Konten nach Sperren, Konto-Warming oder Konto-Farming, vorgetäuschte Interaktionen, Aufbau von Karma oder Followern, Automatisierung mehrerer Konten, Massenveröffentlichungen, Spam-Bots, Marketplace- oder Social-Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.

- Betrug, Scams und täuschende finanzielle Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, täuschende Zahlungsabläufe, Scam-Kontaktaufnahme, gefälschte soziale Nachweise, Werkzeuge, die Ausgaben oder Abbuchungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows für synthetische Identitäten, die darauf ausgelegt sind, Konten für Betrug zu erstellen.

- Scraping, Anreicherung oder Überwachung, die in die Privatsphäre eingreift.
  - Beispiele: massenhaftes Scraping von Kontaktdaten für Spam, Doxxing, Stalking, Lead-Extraktion in Kombination mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, Gesichtssuche oder biometrischer Abgleich ohne klare Zustimmung oder der Kauf, die Veröffentlichung, das Herunterladen oder die operative Nutzung geleakter Daten oder Datensammlungen aus Sicherheitsverletzungen.

- Nicht einvernehmliche Imitation oder täuschende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Werkzeuge zur Identitätsmanipulation, die zur Imitation oder Irreführung verwendet werden.

- Explizite sexuelle Inhalte und Adult-Generierung mit deaktivierten Sicherheitsfunktionen.
  - Beispiele: Generierung von NSFW-Bildern, -Videos oder -Inhalten, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Verborgene, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Secret-Anforderungen, nicht deklarierte Nutzung privater Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Überprüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zur Ausführung benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Erstellen Sie verdeckte Verkäuferkonten nach Sperren auf Marktplätzen.“
- „Ändern Sie die Telegram-Kopplung so, dass nicht genehmigte Nutzer automatisch Kopplungscodes erhalten.“
- „Bauen Sie Reddit-/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generieren Sie professionelle Zertifikate oder Rechnungen für beliebige Zwecke.“
- „Generieren Sie NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrapen Sie Leads, reichern Sie Kontakte an und starten Sie unaufgeforderte Kontaktaufnahme im großen Maßstab.“
- „Kaufen, veröffentlichen oder laden Sie geleakte Daten oder Datensammlungen aus Sicherheitsverletzungen herunter.“
- „Erstellen Sie massenhaft E-Mail- oder Social-Media-Konten mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Prüfer

- Kontext ist entscheidend. Dasselbe Thema kann in einem eng gefassten defensiven oder zustimmungsbasierten Rahmen legitim und inakzeptabel sein, wenn es als Missbrauchs-Workflow verpackt ist.
- Wir sollten zum Handeln tendieren, wenn ein Skill eindeutig für Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe dafür, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können regelverletzende Skills ausblenden, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte weich löschen und wiederholte oder schwerwiegende Verstöße sperren.
- Bei offensichtlichem Missbrauch garantieren wir keine Durchsetzung erst nach vorheriger Warnung.
