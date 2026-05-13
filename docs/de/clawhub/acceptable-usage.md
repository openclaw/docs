---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marketplace-Richtlinie: Was ClawHub zulässt und was es nicht hostet.'
x-i18n:
    generated_at: "2026-05-13T04:18:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt die Arten von Skills und Inhalten, die ClawHub akzeptiert, sowie die Missbrauchs-Workflows, die ClawHub nicht hostet.

Diese Regeln sind bewusst praxisnah. Uns geht es vor allem um End-to-End-Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dafür gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Design-System-Arbeit, die echte Komponenten, semantische Tokens, barrierefreie Zustände und getestete User-Flows verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliasse und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-Konvertierung von JavaScript zu TypeScript, die Kommentare erhält, konkrete UI5-Typen verwendet und generierte Control-Interfaces reviewbar hält.
- Defensive Sicherheitsreviews, Moderations-Tools und Prompts zur Missbrauchserkennung, die Belege zeigen und Grenzen für menschliche Freigaben klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche oder Team-Konten mit expliziten Zugangsdaten, transparenter Einrichtung und Dry-Run- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures, die auf die Software begrenzt sind, die sie unterstützen.

## Nicht zulässig

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unautorisierten Zugriff.
  - Beispiele: Authentifizierungsumgehung, Kontoübernahme, CAPTCHA-Umgehung, Cloudflare- oder Anti-Bot-Umgehung, Rate-Limit-Umgehung, Stealth-Scraping zur gezielten Überwindung von Schutzmaßnahmen, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatisches Genehmigen von Pairing-Flows für nicht genehmigte Benutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: Stealth-Konten nach Sperren, Account-Warming oder -Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenveröffentlichung, Spam-Bots, Marketplace- oder Social-Automatisierung, die zur Erkennungvermeidung gebaut ist.

- Betrug, Scams und täuschende Finanz-Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, täuschende Zahlungsabläufe, Scam-Kontaktaufnahme, gefälschter Social Proof, Tools, die Ausgaben oder Abbuchungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Synthetic-Identity-Workflows, die zur Erstellung von Konten für Betrug gebaut sind.

- In die Privatsphäre eingreifendes Scraping, Anreichern oder Überwachen.
  - Beispiele: Scraping von Kontaktdaten im großen Maßstab für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unerwünschter Kontaktaufnahme, verdeckte Überwachung, Gesichtssuche oder biometrischer Abgleich ohne klare Einwilligung oder Kauf, Veröffentlichung, Download oder Operationalisierung geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Imitation oder täuschende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder andere Tools zur Identitätsmanipulation, die zum Imitieren oder Irreführen verwendet werden.

- Explizite sexuelle Inhalte und Adult-Generierung mit deaktivierten Sicherheitsfunktionen.
  - Beispiele: Generierung von NSFW-Bildern, -Videos oder -Inhalten, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Versteckte, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Secret-Anforderungen, nicht deklarierte Verwendung privater Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Reviewbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zur Ausführung benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Stealth-Verkäuferkonten nach Marketplace-Sperren erstellen.“
- „Telegram-Pairing so ändern, dass nicht genehmigte Benutzer automatisch Pairing-Codes erhalten.“
- „Reddit-/Twitter-Konten mit nicht erkennbarer Automatisierung aufbauen.“
- „Professionelle Zertifikate oder Rechnungen für beliebige Zwecke generieren.“
- „NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen generieren.“
- „Leads scrapen, Kontakte anreichern und Cold Outreach im großen Maßstab starten.“
- „Geleakte Daten oder Breach-Dumps kaufen, veröffentlichen oder herunterladen.“
- „E-Mail- oder Social-Konten mit synthetischen Identitäten oder CAPTCHA-Lösung massenhaft erstellen.“

## Hinweise für Reviewer

- Kontext ist entscheidend. Dasselbe Thema kann in einem eng gefassten defensiven oder einwilligungsbasierten Rahmen legitim und als verpackter Missbrauchs-Workflow inakzeptabel sein.
- Wir sollten zum Handeln tendieren, wenn ein Skill eindeutig für Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können regelverletzende Skills ausblenden, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte soft-löschen und Wiederholungstäter oder schwere Verstöße sperren.
- Bei offensichtlichem Missbrauch garantieren wir keine Durchsetzung erst nach vorheriger Warnung.
