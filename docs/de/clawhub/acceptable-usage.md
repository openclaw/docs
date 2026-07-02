---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob eine Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-02T17:33:59Z"
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

Diese Regeln gelten dafür, was ein Listing tut, was es Nutzer auszuführen auffordert, wie es
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Das Listing hilft Nutzern, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.        |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang ist klar, erforderliche Zugangsdaten sind explizit angegeben, und riskante Aktionen enthalten Review-, Dry-Run-, Vorschau- oder Bestätigungspfade. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfungen konzipiert, bewahrt Beweise und hält Grenzen für menschliche Genehmigungen klar.           |
| Persönliche oder Team-Workflows                  | Der Workflow verwendet einwilligungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen.                        |
| Gepflegte Kataloge                               | Jedes Listing ist eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt.                                             |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng gefassten defensiven oder
einwilligungsbasierten Rahmen zulässig und unzulässig sein, wenn es als Missbrauchsworkflow
verpackt wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung            | Umgehung von Authentifizierung, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                        |
| Plattformmissbrauch und Umgehung von Sperren                | Tarnkonten nach Sperren, Account-Warming oder -Farming, vorgetäuschtes Engagement, Multi-Account-Automatisierung, Massenpostings, Spam-Bots oder Automatisierung, die zur Vermeidung von Erkennung gebaut wurde.                                                                                              |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Outreach, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                              |
| Datenschutzverletzende Anreicherung oder Überwachung        | Scraping von Kontakten für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgefordertem Outreach, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                         |
| Nicht einvernehmliche Nachahmung oder Identitätsmanipulation | Face Swap, digitale Zwillinge, geklonte Influencer, Fake-Personas oder andere Tools, die zur Nachahmung oder Irreführung verwendet werden.                                                                                                                                                                     |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Generierung für Erwachsene | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um APIs von Drittanbietern; oder Listings, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                 |
| Versteckte, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Geheimnisse oder private Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was das Listing wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material  | Erneutes Veröffentlichen von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code anderer ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Nachahmung des ursprünglichen Autors oder Publishers.                                                                                          |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit von Nutzern
zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Listings mit geringem Aufwand, duplizierten, Platzhalter- oder
  maschinengenerierten Listings, die keinen echten Nutzwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen hunderter Listings mit geringer oder keiner Nutzung, Wartung, Quellenklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, Fake-Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Review zu umgehen
- Irreführen von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen in hohem Umfang sind nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Listings sich sinnvoll unterscheiden, korrekt beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, duplizierten, irreführenden, ungepflegten oder
künstlich beworbenen Listings einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, das Listing ist zusätzlich unsicher,
bösartig oder irreführend.

## Review und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzerberichte und
Mitarbeiter-Reviews verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Listings verbergen, zurückhalten, entfernen, soft-deleten oder, sofern für den Ressourcentyp unterstützt,
  hard-deleten
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte soft-deleten
- Veröffentlichungszugriff einschränken
- wiederholte oder schwerwiegende Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderations-Holds,
verborgene Listings, Sperren und Kontostand.
