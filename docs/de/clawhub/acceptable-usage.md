---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Verfassen von Moderationsdokumentation oder Reviewer-Runbooks
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub zulässt und was es nicht hosten wird.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-01T12:52:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marketplace-Metadaten für OpenClaw.
Nutzen Sie diese Seite, um zu entscheiden, ob Inhalte oder Veröffentlichungsverhalten
auf ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, welche Ausführung er von Nutzern
verlangt, wie er sich darstellt und wie Publisher die Discovery-, Installations-
und Vertrauensflächen von ClawHub nutzen. Informationen zu Moderationsstatus und
Kontostatus finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
Informationen zu Urheberrechts- oder anderen Rechteansprüchen finden Sie unter
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag hilft Nutzern dabei, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben. |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang ist klar, erforderliche Zugangsdaten sind ausdrücklich benannt, und riskante Aktionen enthalten Prüf-, Dry-Run-, Vorschau- oder Bestätigungspfade. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfungen dargestellt, bewahrt Belege und hält Grenzen für menschliche Genehmigung klar.                          |
| Persönliche oder Team-Workflows                  | Der Workflow nutzt zustimmungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen.                          |
| Gepflegte Kataloge                               | Jeder Eintrag ist eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt.                                             |

Der Kontext ist wichtig. Dasselbe Thema kann in einem eng begrenzten defensiven
oder zustimmungsbasierten Rahmen zulässig sein und unzulässig werden, wenn es als
Missbrauchsworkflow verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unautorisierter Zugriff oder Sicherheitsumgehung             | Authentifizierungsumgehung, Kontoübernahme, Rate-Limit-Missbrauch, Übernahme von Live-Calls oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                               |
| Plattformmissbrauch und Umgehung von Sperren                | Getarnte Konten nach Sperren, Konto-Warming oder -Farming, gefälschtes Engagement, Multi-Konto-Automatisierung, Massenveröffentlichung, Spam-Bots oder Automatisierung, die zur Umgehung von Erkennung entwickelt wurde.                                                                                  |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Outreach, gefälschter sozialer Nachweis, Workflows für synthetische Identitäten zum Betrug oder Tools zum Ausgeben/Belasten ohne klare menschliche Genehmigung.                                                                   |
| Datenschutzverletzende Anreicherung oder Überwachung         | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Ansprache, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                     |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                             |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                   |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material   | Wiederveröffentlichung von Skills, Plugin, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                              |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub
nicht, um Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder
Nutzeraufmerksamkeit zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Einträgen mit geringem Aufwand,
  Duplikaten, Platzhaltern oder maschinell generierten Einträgen, die keinen
  echten Nutzwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen Hunderter Einträge mit wenig oder keiner Nutzung, Pflege,
  Quellenklarheit oder sinnvollen Differenzierung
- künstliches Aufblasen von Installationen, Downloads, Sternen oder anderen
  Engagement-Metriken durch Automatisierung, Selbstinstallationsschleifen,
  gefälschte Konten, koordinierte Aktivitäten, bezahltes Engagement oder anderes
  nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits
  oder Marketplace-Prüfungen zu umgehen
- Irreführung von Nutzern über Eigentum, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder
  blockiert wurden, ohne das zugrunde liegende Problem zu beheben

Veröffentlichung in hohem Umfang ist nicht automatisch Missbrauch. Große Kataloge
sind zulässig, wenn die Einträge sich sinnvoll unterscheiden, korrekt beschrieben,
gepflegt und von echten Nutzern verwendet werden. Große Kataloge werden zu einem
Vertrauens- und Sicherheitsproblem, wenn Umfang mit dünnen, duplizierten,
irreführenden, ungepflegten oder künstlich beworbenen Einträgen verbunden ist.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte
verletzen, verwenden Sie [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).
Verwenden Sie normale Marketplace-Meldungen nicht für Urheberrechts- oder
Rechteansprüche, es sei denn, der Eintrag ist außerdem unsicher, bösartig oder
irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale,
Nutzermeldungen und Mitarbeiterprüfung verwenden, um unsichere Inhalte oder
missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal beweist
für sich allein keinen Missbrauch; es hilft ClawHub dabei zu entscheiden, was
geprüft werden muss.

Wir können:

- verletzende Einträge verbergen, zurückhalten, entfernen, soft-delete ausführen
  oder, wo für den Ressourcentyp unterstützt, hard-delete ausführen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte per soft-delete entfernen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung erst nach
Warnung. Informationen zu Meldungen, Moderationssperren, verborgenen Einträgen,
Sperren und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation).
