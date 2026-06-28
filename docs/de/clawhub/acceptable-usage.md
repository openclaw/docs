---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob eine Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-06-28T05:07:00Z"
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
Vertrauensoberflächen von ClawHub verwenden. Informationen zu Moderationszuständen und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/de/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem
Glauben veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag Benutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.     |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang klar ist, erforderliche Zugangsdaten explizit genannt werden und riskante Aktionen Prüf-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen ausgerichtet ist, Beweise bewahrt und Grenzen für menschliche Freigaben klar hält.             |
| Persönliche oder Team-Workflows                  | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen verwendet.                         |
| Gepflegte Kataloge                               | Jeder Eintrag unterscheidbar, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                          |

Der Kontext ist wichtig. Dasselbe Thema kann in einem eng defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und unzulässig, wenn es als Missbrauchsworkflow verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Umgehung von Sicherheitsmechanismen | Umgehung der Authentifizierung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Übernahme von Live-Aufrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Freigabe von Pairing-Flows für nicht genehmigte Benutzer.                                                               |
| Plattformmissbrauch und Umgehung von Sperren                | Verdeckte Konten nach Sperren, Account Warming oder Farming, gefälschtes Engagement, Multi-Account-Automatisierung, Massenveröffentlichung, Spam-Bots oder Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.                                                                              |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Freigabe.                                                                           |
| Datenschutzverletzende Anreicherung oder Überwachung        | Scraping von Kontakten für Spam, Doxxing, Stalking, Lead-Extraktion in Kombination mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Datendumps aus Sicherheitsverletzungen.                                    |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                             |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltserzeugung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                     |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zum Ausführen benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material  | Erneute Veröffentlichung von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace verwenden. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder Benutzeraufmerksamkeit
zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- Massenveröffentlichung großer Mengen von aufwandsarmen, doppelten, Platzhalter- oder
  maschinell erzeugten Einträgen, die keinen echten Benutzernutzen erkennen lassen
- Überfluten von Such- oder Kategorieoberflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichung hunderter Einträge mit geringer oder keiner Nutzung, Pflege, Quellenklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Prüfung zu umgehen
- Irreführung von Benutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitsstatus,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichung in hohem Umfang ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sich sinnvoll unterscheiden, korrekt beschrieben, gepflegt
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Mitarbeiterprüfung verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge ausblenden, zurückhalten, entfernen, soft-delete ausführen oder, sofern für den Ressourcentyp unterstützt,
  hard-delete ausführen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte per Soft-Delete löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/de/clawhub/moderation) für Meldungen, Moderations-Holds,
ausgeblendete Einträge, Sperren und Kontostatus.
