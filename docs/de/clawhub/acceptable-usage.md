---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Review-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden soll
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-06-27T17:14:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marktplatz-Metadaten für OpenClaw.
Nutzen Sie diese Seite, um zu entscheiden, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer ausführen lässt, wie er
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/de/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Erlaubte Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben veröffentlicht
werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Entwicklerproduktivität                          | Der Eintrag Nutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.          |
| UI-, Daten- und Automatisierungs-Workflows       | Der Umfang klar ist, erforderliche Zugangsdaten ausdrücklich genannt werden und riskante Aktionen Prüf-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen ausgerichtet ist, Beweise bewahrt und Grenzen für menschliche Freigaben klar hält.              |
| Persönliche oder Team-Workflows                  | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                        |
| Gepflegte Kataloge                              | Jeder Eintrag eigenständig, nützlich, genau beschrieben und angemessen gepflegt ist.                                                  |

Der Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und inakzeptabel, wenn es als
Missbrauchs-Workflow verpackt wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Sicherheitsumgehung                 | Umgehung von Authentifizierung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Übernahme von Live-Aufrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Kopplungsabläufen für nicht genehmigte Nutzer.                                                               |
| Plattformmissbrauch und Umgehung von Sperren                | Tarnkonten nach Sperren, Account-Warming oder -Farming, gefälschtes Engagement, Multi-Account-Automatisierung, Massenveröffentlichungen, Spam-Bots oder Automatisierung, die zur Vermeidung von Erkennung gebaut wurde.                                                                                         |
| Betrug, Scams und täuschende finanzielle Workflows          | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsabläufe, Scam-Kontaktaufnahme, gefälschter sozialer Nachweis, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Freigabe.                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung        | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unerwünschter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Datenpannen-Dumps.                                                                        |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                  |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Wrapper für Erwachseneninhalte um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                              |
| Versteckte, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verschleiern, was der Eintrag wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtswidriges Material      | Wiederveröffentlichung der Skills, Plugins, Dokumentation, Markenassets oder proprietären Codes einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                 |

## Unzulässiges Marktplatzverhalten

ClawHub prüft auch, wie Publisher den Marktplatz nutzen. Verwenden Sie ClawHub nicht,
um Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit
von Nutzern zu manipulieren.

Unzulässiges Marktplatzverhalten umfasst:

- Massenveröffentlichung großer Mengen von Einträgen mit geringem Aufwand, Duplikaten, Platzhaltern oder
  maschinell erzeugten Einträgen, die keinen echten Nutzerwert erkennen lassen
- Überflutung von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichung hunderter Einträge mit wenig oder keiner Nutzung, Pflege, Quellklarheit
  oder aussagekräftigen Unterschieden
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marktplatzprüfungen zu umgehen
- Irreführung von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitsstatus,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen mit hohem Volumen sind nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sich sinnvoll unterscheiden, genau beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, duplizierten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen verbunden ist.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marktplatzmeldungen
nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist außerdem unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Prüfungen durch Mitarbeitende verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge verbergen, zurückhalten, entfernen, per Soft Delete löschen oder, sofern für den Ressourcentyp unterstützt,
  endgültig löschen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte per Soft Delete löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren keine Durchsetzung erst nach vorheriger Warnung bei offensichtlichem Missbrauch. Siehe
[Moderation und Kontosicherheit](/de/clawhub/moderation) für Meldungen, Moderations-Holds,
verborgene Einträge, Sperren und Kontostatus.
