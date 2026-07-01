---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill verborgen oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-01T15:21:52Z"
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

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer zur Ausführung auffordert, wie er
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag hilft Nutzern, Software zu entwickeln, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.      |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang ist klar, erforderliche Zugangsdaten sind explizit, und riskante Aktionen enthalten Review-, Probelauf-, Vorschau- oder Bestätigungspfade. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfungen ausgerichtet, bewahrt Nachweise und hält Grenzen für menschliche Genehmigungen klar.     |
| Persönliche oder Team-Workflows                  | Der Workflow verwendet zustimmungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen.                         |
| Gepflegte Kataloge                               | Jeder Eintrag ist eindeutig, nützlich, genau beschrieben und angemessen gepflegt.                                                  |

Der Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Umfeld zulässig und unzulässig sein, wenn es als Missbrauchsworkflow
verpackt wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung            | Auth-Umgehung, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                                         |
| Plattformmissbrauch und Umgehung von Sperren                | Tarnkonten nach Sperren, Account-Warming oder -Farming, vorgetäuschte Interaktion, Multi-Account-Automatisierung, Massenpostings, Spam-Bots oder Automatisierung, die zur Umgehung von Erkennung gebaut wurde.                                                                                                |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Kontaktaufnahme, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Tools zum Ausgeben/Belasten ohne klare menschliche Genehmigung.                                                                      |
| Datenschutzverletzende Anreicherung oder Überwachung        | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Verwendung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                |
| Nicht einvernehmliche Nachahmung oder Identitätsmanipulation | Face-Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zum Nachahmen oder Irreführen verwendet werden.                                                                                                                                                                  |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltserzeugung; Adult-Content-Wrapper um APIs Dritter; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                             |
| Versteckte, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zum Ausführen benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material  | Erneutes Veröffentlichen der Skills, Plugins, Dokumentation, Markenassets oder proprietären Codes einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Nachahmung des ursprünglichen Autors oder Publishers.                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit von Nutzern
zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Einträgen mit geringem Aufwand, doppelten, Platzhalter- oder
  maschinell generierten Einträgen, die keinen echten Nutzerwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten von Einträgen mit geringer oder keiner Nutzung, Pflege, Quellenklarheit
  oder sinnvollen Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Prüfungen zu umgehen
- Irreführen von Nutzern über Eigentum, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichung in hohem Umfang ist nicht automatisch Missbrauch. Große Kataloge sind zulässig,
wenn die Einträge sinnvoll unterschiedlich, genau beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen verbunden ist.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiterprüfungen verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge ausblenden, zurückhalten, entfernen, soft-delete durchführen oder, sofern für den Ressourcentyp unterstützt,
  hard-delete durchführen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte per soft-delete entfernen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren keine Durchsetzung mit vorheriger Warnung bei offensichtlichem Missbrauch. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
ausgeblendete Einträge, Sperren und Kontostand.
