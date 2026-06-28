---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße überprüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-06-28T07:41:32Z"
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

Diese Regeln gelten dafür, was ein Eintrag tut, was er Benutzer ausführen lässt, wie er
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub verwenden. Zu Moderationsstatus und Kontostand siehe
[Moderation und Kontosicherheit](/de/clawhub/moderation). Zu Urheberrechtsansprüchen oder anderen Rechteansprüchen
siehe [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem
Glauben veröffentlicht werden.

| Kategorie                                         | Zulässig, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Der Eintrag Benutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungs-Workflows               | Der Umfang klar ist, erforderliche Zugangsdaten explizit sind und riskante Aktionen Review-, Probelauf-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfung ausgelegt ist, Beweise bewahrt und Grenzen für menschliche Freigaben klar hält.                          |
| Persönliche oder Team-Workflows                       | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen verwendet.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag eindeutig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng gefassten defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und unzulässig, wenn es als Missbrauchs-Workflow verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung                      | Authentifizierungsumgehung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatisch genehmigende Pairing-Abläufe für nicht genehmigte Benutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Tarnkonten nach Sperren, Account Warming oder Farming, gefälschtes Engagement, Multi-Konto-Automatisierung, Massenveröffentlichungen, Spam-Bots oder Automatisierung, die zur Erkennungsvermeidung gebaut ist.                                                                                                                                          |
| Betrug, Scams und täuschende Finanz-Workflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschte soziale Nachweise, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgefordertem Outreach, verdeckte Überwachung, nicht einvernehmliches biometrisches Matching oder Verwendung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                                                                                  |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation       | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zum Imitieren oder Irreführen verwendet werden.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zum Ausführen benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material           | Erneutes Veröffentlichen von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code anderer Personen ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitieren des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub überprüft auch, wie Publisher den Marketplace verwenden. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit von Benutzern
zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Zahlen von aufwandsarmen, duplizierenden, Platzhalter- oder
  maschinengenerierten Einträgen, die keinen echten Benutzerwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten von Einträgen mit geringer oder keiner Nutzung, Pflege, Quellenklarheit
  oder aussagekräftigen Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahltes Engagement oder anderes nicht-organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Review zu umgehen
- Irreführen von Benutzern über Eigentum, Quelle, Fähigkeiten, Sicherheitsstatus,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichen in hohem Volumen ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sich sinnvoll unterscheiden, korrekt beschrieben, gepflegt
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, duplizierenden, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen kombiniert wird.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Review und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Mitarbeiter-Reviews verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was Review benötigt.

Wir können:

- verletzende Einträge verbergen, zurückhalten, entfernen, soft-delete ausführen oder, sofern für den Ressourcentyp unterstützt,
  hard-delete ausführen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte per soft-delete entfernen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Täter sperren

Wir garantieren keine Durchsetzung mit vorheriger Warnung bei offensichtlichem Missbrauch. Siehe
[Moderation und Kontosicherheit](/de/clawhub/moderation) für Meldungen, Moderationssperren,
verborgene Einträge, Sperren und Kontostand.
