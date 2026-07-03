---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Review-Runbooks schreiben
    - Entscheiden, ob ein Skill verborgen oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hosten wird.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-03T02:46:20Z"
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

Diese Regeln gelten dafür, was ein Listing tut, was es Nutzer auffordert auszuführen, wie es
sich darstellt und wie Publisher ClawHubs Discovery-, Installations- und
Vertrauensflächen nutzen. Informationen zu Moderationsstatus und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Erlaubte Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                         | Erlaubt, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Das Listing Nutzern hilft, Software zu bauen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungsworkflows               | Der Umfang klar ist, erforderliche Zugangsdaten ausdrücklich genannt werden und riskante Aktionen Review-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfung konzipiert ist, Beweise erhält und Grenzen für menschliche Genehmigung klar hält.                          |
| Persönliche oder Team-Workflows                       | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                                            |
| Gepflegte Kataloge                              | Jedes Listing eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                |

Der Kontext zählt. Dasselbe Thema kann in einem eng gefassten defensiven oder
zustimmungsbasierten Kontext akzeptabel sein und inakzeptabel, wenn es als Missbrauchsworkflow
verpackt ist.

## Nicht erlaubte Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                    | Nicht erlaubt                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung                      | Auth-Bypass, Kontoübernahme, Missbrauch von Rate Limits, Übernahme laufender Calls oder Agents, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Tarnkonten nach Sperren, Account-Warming oder -Farming, gefälschtes Engagement, Multi-Account-Automatisierung, Massenposting, Spam-Bots oder Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.                                                                                                                                          |
| Betrug, Scams und täuschende finanzielle Workflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Outreach, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Tools zum Ausgeben/Belasten ohne klare menschliche Genehmigung.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgefordertem Outreach, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Breach-Dumps.                                                                                                                  |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation       | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Werkzeuge, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Listings, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Versteckte, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Secret- oder Private-Key-Anforderungen, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was das Listing tatsächlich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material           | Erneutes Veröffentlichen von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code anderer Personen ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Nicht erlaubtes Marktplatzverhalten

ClawHub prüft auch, wie Publisher den Marktplatz nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder Nutzeraufmerksamkeit
zu manipulieren.

Nicht erlaubtes Marktplatzverhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Listings mit geringem Aufwand, duplizierenden, Platzhalter- oder
  maschinengenerierten Listings, die keinen echten Nutzerwert zu haben scheinen
- Fluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen Hunderter Listings mit wenig oder keiner Nutzung, Pflege, Quellenklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Self-Install-Schleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marktplatzprüfung zu umgehen
- Irreführung von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Hochvolumiges Veröffentlichen ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Listings sinnvoll unterschiedlich, korrekt beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, duplizierenden, irreführenden, ungepflegten oder
künstlich beworbenen Listings einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marktplatz-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, das Listing ist auch unsicher,
bösartig oder irreführend.

## Review und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiter-Reviews verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was überprüft werden muss.

Wir können:

- verletzende Listings ausblenden, zurückhalten, entfernen, soft-delete oder, soweit für den Ressourcentyp unterstützt,
  hard-delete
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte soft-delete
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderations-Holds,
ausgeblendete Listings, Sperren und Kontostand.
