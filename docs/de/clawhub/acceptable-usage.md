---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: welche Inhalte ClawHub zulässt und welche es nicht hostet.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-03T09:29:04Z"
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

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer ausführen lässt, wie er
sich selbst darstellt und wie Publisher die Such-, Installations- und
Vertrauensoberflächen von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich und verständlich sind und in gutem Glauben
veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag hilft Nutzern, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.      |
| UI-, Daten- und Automatisierungs-Workflows       | Der Umfang ist klar, erforderliche Zugangsdaten sind explizit genannt und riskante Aktionen enthalten Prüf-, Testlauf-, Vorschau- oder Bestätigungspfade. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfungen gedacht, bewahrt Beweise auf und hält Grenzen für menschliche Zustimmung klar.             |
| Persönliche oder Team-Workflows                  | Der Workflow verwendet zustimmungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen.                         |
| Gepflegte Kataloge                               | Jeder Eintrag ist eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt.                                             |

Der Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und unzulässig werden, wenn es als
Missbrauchs-Workflow verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung             | Authentifizierungsumgehung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Übernahme laufender Anrufe oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Kopplungsabläufen für nicht genehmigte Nutzer.                                                              |
| Plattformmissbrauch und Umgehung von Sperren                 | Verdeckte Konten nach Sperren, Kontoaufbau oder -farming, vorgetäuschte Interaktion, Multi-Account-Automatisierung, Massenveröffentlichung, Spam-Bots oder Automatisierung, die zur Umgehung von Erkennung gebaut wurde.                                                                                   |
| Betrug, Scams und täuschende finanzielle Workflows           | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsabläufe, Scam-Kontaktaufnahme, vorgetäuschter sozialer Nachweis, synthetische Identitäts-Workflows für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Zustimmung.                                                                |
| Datenschutzverletzende Anreicherung oder Überwachung         | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unerwünschter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                    |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation  | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                              |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | Generierung nicht jugendfreier Bilder, Videos oder Inhalte; Wrapper für Erwachseneninhalte um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                           |
| Versteckte, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verschleiern, was der Eintrag tatsächlich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder Rechte verletzendes Material  | Erneutes Veröffentlichen von Skills, Plugin, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Auffindbarkeit, Metriken, Vertrauenssignale, Moderationssysteme oder
Nutzeraufmerksamkeit zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- Massenveröffentlichung großer Mengen von wenig sorgfältigen, doppelten, Platzhalter- oder
  maschinell generierten Einträgen, die keinen echten Nutzwert erkennen lassen
- Überfluten von Such- oder Kategorieoberflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen Hunderter Einträge mit wenig oder keiner Nutzung, Pflege, Quellenklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Interaktionsmetriken
  durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahlte Interaktion oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Prüfungen zu umgehen
- Irreführung von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitsstatus,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichung in hohem Umfang ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sich sinnvoll unterscheiden, korrekt beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiterprüfungen verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist Missbrauch nicht für sich genommen; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge ausblenden, zurückhalten, entfernen, vorläufig löschen oder, sofern für den Ressourcentyp unterstützt,
  endgültig löschen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte vorläufig löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine vorherige Warnung vor Durchsetzungsmaßnahmen. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
ausgeblendete Einträge, Sperren und Kontostatus.
