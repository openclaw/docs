---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob eine Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was dort nicht gehostet wird.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-01T05:32:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marketplace-Metadaten für OpenClaw.
Verwenden Sie diese Seite, um zu entscheiden, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, wozu er Benutzer auffordert, wie er
sich darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Moderationsstatus und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Urheberrechts- oder andere Rechtsansprüche
finden Sie unter [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich und verständlich sind und in gutem
Glauben veröffentlicht werden.

| Kategorie                                         | Zulässig, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Der Eintrag Benutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungs-Workflows               | Der Umfang klar ist, erforderliche Anmeldedaten ausdrücklich genannt werden und riskante Aktionen Prüf-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen dargestellt wird, Beweise erhält und Grenzen menschlicher Genehmigung klar hält.                          |
| Persönliche oder Team-Workflows                       | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                |

Der Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und unzulässig, wenn es als Missbrauchs-Workflow verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung                      | Auth-Umgehung, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Aufrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatisches Genehmigen von Pairing-Flows für nicht genehmigte Benutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Tarnkonten nach Sperren, Kontoaufwärmung oder -farming, gefälschtes Engagement, Multi-Konto-Automatisierung, Massenpostings, Spam-Bots oder Automatisierung, die zur Vermeidung von Erkennung gebaut wurde.                                                                                                                                          |
| Betrug, Scams und täuschende Finanz-Workflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflüsse, Scam-Outreach, gefälschte soziale Bestätigung, Workflows für synthetische Identitäten zum Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                                                                                  |
| Nicht einvernehmliche Nachahmung oder Identitätsmanipulation       | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Nachahmung oder Irreführung verwendet werden.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenen-Generierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Wrapper für Erwachsenen-Inhalte um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Versteckte, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material           | Wiederveröffentlichung von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code anderer Personen ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Nachahmung des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit von Benutzern
zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Einträgen mit geringem Aufwand, duplizierenden Platzhaltern oder
  maschinell generierten Einträgen, die keinen echten Benutzerwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen Hunderter Einträge mit wenig oder keiner Nutzung, Pflege, Quellenklarheit
  oder aussagekräftiger Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Prüfung zu umgehen
- Irreführen von Benutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichen in hohem Umfang ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge deutlich unterschiedlich, korrekt beschrieben, gepflegt
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, duplizierenden, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie keine normalen Marketplace-
Meldungen für Urheberrechts- oder Rechtsansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzerberichte und
Prüfung durch Mitarbeitende verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu erkennen. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge ausblenden, zurückhalten, entfernen, soft-deleten oder, sofern für den Ressourcentyp unterstützt,
  hard-deleten
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte soft-deleten
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren keine Durchsetzung erst nach vorheriger Warnung bei offensichtlichem Missbrauch. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderations-Holds,
ausgeblendete Einträge, Sperren und Kontostand.
