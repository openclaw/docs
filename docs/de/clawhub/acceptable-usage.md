---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Review-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-06-30T13:56:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Akzeptable Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marketplace-Metadaten für OpenClaw.
Nutzen Sie diese Seite, um zu entscheiden, ob Inhalte oder Veröffentlichungsverhalten
auf ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, wozu er Nutzer auffordert, wie er
sich darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Informationen zu Moderationsstatus und
Kontostand finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
Informationen zu Urheberrechts- oder anderen Rechteansprüchen finden Sie unter
[Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                         | Zulässig, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Der Eintrag Nutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungsworkflows               | Der Umfang klar ist, erforderliche Anmeldedaten explizit angegeben sind und riskante Aktionen Prüf-, Probelauf-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen ausgelegt ist, Beweise erhält und Grenzen für menschliche Genehmigung klar hält.                          |
| Persönliche oder Team-Workflows                       | Der Workflow einwilligungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen verwendet.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng gefassten
defensiven oder einwilligungsbasierten Rahmen akzeptabel sein und inakzeptabel
werden, wenn es als Missbrauchsworkflow verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Sicherheitsumgehung                      | Auth-Umgehung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Live-Anruf- oder Agent-Übernahme, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Kopplungsflows für nicht genehmigte Nutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Tarnkonten nach Sperren, Kontoaufwärmung oder -farming, gefälschtes Engagement, Multi-Konto-Automatisierung, Massenposting, Spam-Bots oder Automatisierung, die zur Erkennungsvermeidung gebaut wurde.                                                                                                                                          |
| Betrug, Scams und täuschende Finanzworkflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Kontaktaufnahme, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Breach-Dumps.                                                                                                                  |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation       | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                                                 |
| Explizit sexuelle Inhalte oder sicherheitsdeaktivierte Adult-Generierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um APIs Dritter; oder Einträge, deren primärer Zweck explizit sexuelle Inhalte sind.                                                                                                                                                       |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material           | Erneute Veröffentlichung der Skills, Plugins, Dokumentation, Markenassets oder proprietären Codes einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub
nicht, um Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die
Aufmerksamkeit von Nutzern zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von aufwandsarmen, duplikativen,
  Platzhalter- oder maschinell generierten Einträgen, die keinen echten
  Nutzerwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen Hunderter Einträge mit geringer oder keiner Nutzung, Pflege,
  Quellklarheit oder sinnvollen Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen
  Engagement-Metriken durch Automatisierung, Selbstinstallationsschleifen,
  gefälschte Konten, koordinierte Aktivitäten, bezahltes Engagement oder anderes
  nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits
  oder Marketplace-Prüfungen zu umgehen
- Irreführen von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten,
  Sicherheitslage, Installationsanforderungen oder Zugehörigkeit zu einem
  anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder
  blockiert wurden, ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen in hohem Umfang sind nicht automatisch Missbrauch. Große
Kataloge sind akzeptabel, wenn die Einträge sich sinnvoll unterscheiden, korrekt
beschrieben, gepflegt und von echten Nutzern verwendet werden. Große Kataloge
werden zu einem Vertrauens- und Sicherheitsproblem, wenn Umfang mit dünnen,
duplikativen, irreführenden, ungepflegten oder künstlich beworbenen Einträgen
einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte
verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale
Marketplace-Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn,
der Eintrag ist auch unsicher, bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale,
Nutzermeldungen und Mitarbeiterprüfungen verwenden, um unsichere Inhalte oder
missbräuchliches Veröffentlichungsverhalten zu erkennen. Ein Signal beweist für
sich allein keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft
werden muss.

Wir können:

- verletzende Einträge verbergen, zurückhalten, entfernen, per Soft-Delete
  löschen oder, sofern für den Ressourcentyp unterstützt, per Hard-Delete löschen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte per Soft-Delete löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwerwiegende Täter sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung erst nach
Warnung. Informationen zu Meldungen, Moderationssperren, verborgenen Einträgen,
Sperren und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation).
