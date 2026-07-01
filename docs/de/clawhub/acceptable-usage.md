---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-01T18:10:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marktplatz-Metadaten für OpenClaw.
Verwenden Sie diese Seite, um zu entscheiden, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer ausführen lässt, wie er
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Moderationsstatus und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Urheberrechts- oder andere Rechteansprüche
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                         | Zulässig, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Der Eintrag Nutzern hilft, Software zu entwickeln, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungs-Workflows               | Der Umfang klar ist, erforderliche Zugangsdaten ausdrücklich genannt werden und riskante Aktionen Prüf-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen dargestellt wird, Beweise bewahrt und Grenzen menschlicher Zustimmung klar hält.                          |
| Persönliche oder Team-Workflows                       | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                |

Der Kontext zählt. Dasselbe Thema kann in einem eng gefassten defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und unzulässig, wenn es als Missbrauchs-Workflow verpackt wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Sicherheitsumgehung                      | Authentifizierungsumgehung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Live-Anruf- oder Agentenübernahme, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Tarnkonten nach Sperren, Kontoaufwärmung oder -farming, unechte Interaktion, Multi-Konto-Automatisierung, Massenposting, Spam-Bots oder Automatisierung, die zur Vermeidung von Erkennung gebaut wurde.                                                                                                                                          |
| Betrug, Scams und täuschende Finanz-Workflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflüsse, Scam-Kontaktaufnahme, unechte soziale Bestätigung, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Zustimmung.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                                                                                  |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation       | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder erwachsene Generierung mit deaktivierter Sicherheit | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zum Ausführen benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material           | Erneutes Veröffentlichen der Skills, Plugins, Dokumentation, Markenassets oder proprietären Codes anderer ohne Erlaubnis; Verstoß gegen Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Unzulässiges Marktplatzverhalten

ClawHub prüft auch, wie Publisher den Marktplatz nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit von Nutzern
zu manipulieren.

Unzulässiges Marktplatzverhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Einträgen mit geringem Aufwand, doppelten, Platzhalter- oder
  maschinell generierten Einträgen, die keinen echten Nutzwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten von Einträgen mit wenig oder keiner Nutzung, Wartung, Quellenklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten zur Umgehung von Moderation, Sperren, Publisher-Grenzen oder
  Marktplatzprüfung
- Irreführen von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitsstatus,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichung in hohem Umfang ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge deutlich unterschiedlich, korrekt beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen verbunden ist.

## Inhaltsrechte

Wenn Sie der Ansicht sind, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marktplatz-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiterprüfung verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu erkennen. Ein Signal
beweist für sich allein keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge verbergen, zurückhalten, entfernen, soft-delete anwenden oder, sofern für den Ressourcentyp unterstützt,
  hard-delete anwenden
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte per soft-delete löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren keine Durchsetzung mit vorheriger Warnung bei offensichtlichem Missbrauch. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
verborgene Einträge, Sperren und Kontostand.
