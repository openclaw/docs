---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub zulässt und was dort nicht gehostet wird.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-01T07:56:52Z"
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

Diese Regeln gelten dafür, was ein Listing tut, welche Ausführung es von Nutzern verlangt, wie es
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Moderationsstatus und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Erlaubte Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                        | Erlaubt, wenn                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Das Listing Nutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                      |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang klar ist, erforderliche Zugangsdaten explizit genannt sind und riskante Aktionen Review-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfung eingeordnet ist, Beweise erhält und menschliche Genehmigungsgrenzen klar hält.                                 |
| Persönliche oder Team-Workflows                  | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen verwendet.                                         |
| Gepflegte Kataloge                               | Jedes Listing eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                            |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und unzulässig, wenn es als Missbrauchsworkflow
verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                   | Nicht erlaubt                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung             | Auth-Bypass, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Calls oder Agenten, wiederverwendbarer Session-Diebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                                                      |
| Plattformmissbrauch und Umgehung von Sperren                 | Tarnkonten nach Sperren, Aufwärmen oder Farming von Konten, gefälschtes Engagement, Multi-Account-Automatisierung, Massenposting, Spam-Bots oder Automatisierung, die zur Vermeidung von Erkennung gebaut wurde.                                                                                                      |
| Betrug, Scams und täuschende Finanzworkflows                 | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Outreach, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                                      |
| Datenschutzverletzende Anreicherung oder Überwachung         | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgefordertem Outreach, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Breach-Dumps.                                                                                       |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation  | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                       |
| Explizit sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenen-Generierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um APIs von Drittanbietern; oder Listings, deren Hauptzweck explizit sexuelle Inhalte sind.                                                                                                                                                         |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Überprüfbarkeit ausgeführt werden, nicht deklarierte Secret- oder Private-Key-Anforderungen, Remote-Ausführung von `npx @latest` ohne klare Überprüfbarkeit oder Metadaten, die verbergen, was das Listing wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material   | Wiederveröffentlichung von Skills, Plugins, Docs, Marken-Assets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                                 |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit der Nutzer
zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Zahlen von Listings mit geringem Aufwand, duplikativen Inhalten, Platzhaltern oder
  maschinell generierten Listings, die keinen echten Nutzerwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten von Listings mit wenig oder keiner Nutzung, Wartung, Quellklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Review zu umgehen
- Irreführung von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen in hohem Umfang sind nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Listings sinnvoll unterschiedlich, korrekt beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, duplikativen, irreführenden, ungepflegten oder
künstlich beworbenen Listings einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, das Listing ist auch unsicher,
bösartig oder irreführend.

## Review und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiter-Review verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist Missbrauch nicht für sich genommen; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Listings verbergen, zurückhalten, entfernen, soft-deleten oder, wo für den Ressourcentyp unterstützt,
  hard-deleten
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte soft-deleten
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwerwiegende Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
verborgene Listings, Sperren und Kontostand.
