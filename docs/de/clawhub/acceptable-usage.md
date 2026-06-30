---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Review-Runbooks schreiben
    - Entscheiden, ob ein Skill verborgen oder ein Benutzer gesperrt werden soll
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-06-30T22:10:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Akzeptable Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marketplace-Metadaten für OpenClaw.
Verwenden Sie diese Seite, um zu entscheiden, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, welche Ausführung er von Benutzern verlangt, wie er
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Erlaubte Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                        | Erlaubt, wenn                                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag Benutzern hilft, Software zu bauen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.          |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang klar ist, erforderliche Anmeldedaten ausdrücklich genannt sind und riskante Aktionen Review-, Probelauf-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfung ausgerichtet ist, Beweise bewahrt und Grenzen menschlicher Genehmigung klar hält.                |
| Persönliche oder Team-Workflows                  | Der Workflow auf einwilligungsbasierten Konten, transparenter Einrichtung und ausdrücklichen Berechtigungen basiert.               |
| Gepflegte Kataloge                               | Jeder Eintrag eigenständig, nützlich, zutreffend beschrieben und angemessen gepflegt ist.                                          |

Der Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder
einwilligungsbasierten Rahmen akzeptabel und inakzeptabel sein, wenn es als Missbrauchsworkflow
verpackt ist.

## Nicht erlaubte Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                   | Nicht erlaubt                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung            | Auth-Umgehung, Kontoübernahme, Rate-Limit-Missbrauch, Live-Anruf- oder Agent-Übernahme, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Abläufen für nicht genehmigte Benutzer.                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                | Tarnkonten nach Sperren, Konto-Warming oder -Farming, gefälschtes Engagement, Mehrkonten-Automatisierung, Massenposting, Spam-Bots oder Automatisierung, die zur Vermeidung von Erkennung gebaut wurde.                                                                                                          |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschter Social Proof, synthetische Identitätsworkflows für Betrug oder Ausgabe-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                                       |
| Datenschutzverletzende Anreicherung oder Überwachung        | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgefordertem Outreach, verdeckte Überwachung, nicht einvernehmliches biometrisches Matching oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                                  |
| Nicht einvernehmliche Nachahmung oder Identitätsmanipulation | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Werkzeuge, die zum Nachahmen oder Irreführen verwendet werden.                                                                                                                                                               |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Verdeckte, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Überprüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Überprüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material  | Erneutes Veröffentlichen der Skills, Plugins, Dokumentation, Markenassets oder proprietären Codes einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Nachahmung des ursprünglichen Autors oder Publishers.                                                                                |

## Nicht erlaubtes Marketplace-Verhalten

ClawHub überprüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder Benutzeraufmerksamkeit
zu manipulieren.

Nicht erlaubtes Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Einträgen mit geringem Aufwand, doppelten, Platzhalter- oder
  maschinell generierten Einträgen, die keinen echten Benutzernutzen zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen hunderter Einträge mit wenig oder keiner Nutzung, Wartung, Quellenklarheit
  oder aussagekräftiger Unterscheidung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Review zu umgehen
- Irreführen von Benutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichen mit hohem Volumen ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sinnvoll unterschiedlich, zutreffend beschrieben, gepflegt
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist zugleich unsicher,
bösartig oder irreführend.

## Review und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzerberichte und
Mitarbeiter-Review nutzen, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich allein keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge verbergen, halten, entfernen, soft-löschen oder, sofern für den Ressourcentyp unterstützt,
  hard-löschen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte soft-löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderations-Holds,
verborgene Einträge, Sperren und Kontostand.
