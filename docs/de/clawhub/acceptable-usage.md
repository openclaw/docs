---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-02T08:09:57Z"
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

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer ausführen lässt, wie er
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechtsansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Erlaubte Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in guter
Absicht veröffentlicht werden.

| Kategorie                                         | Erlaubt, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Der Eintrag hilft Nutzern dabei, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungs-Workflows               | Der Umfang ist klar, erforderliche Zugangsdaten sind explizit, und riskante Aktionen enthalten Review-, Dry-Run-, Vorschau- oder Bestätigungspfade. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfungen ausgelegt, bewahrt Beweise und hält Grenzen für menschliche Freigaben klar.                          |
| Persönliche oder Team-Workflows                       | Der Workflow verwendet einwilligungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag ist eindeutig, nützlich, korrekt beschrieben und angemessen gepflegt.                                                |

Der Kontext ist wichtig. Dasselbe Thema kann in einem eng defensiven oder
einwilligungsbasierten Umfeld akzeptabel sein und inakzeptabel, wenn es als Missbrauchs-Workflow paketiert ist.

## Verbotene Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                    | Nicht erlaubt                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung                      | Umgehung der Authentifizierung, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Aufrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Tarnkonten nach Sperren, Account-Warming oder -Farming, vorgetäuschtes Engagement, Multi-Account-Automatisierung, Massenveröffentlichungen, Spam-Bots oder Automatisierung, die zur Umgehung von Erkennung gebaut wurde.                                                                                                                                          |
| Betrug, Scams und täuschende Finanz-Workflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflüsse, Scam-Outreach, gefälschter sozialer Nachweis, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Freigabe.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgefordertem Outreach, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Datenpannen-Dumps.                                                                                                                  |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation       | Face-Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Versteckte, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Prüfbarkeit oder Metadaten, die verschleiern, was der Eintrag wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material           | Erneutes Veröffentlichen von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Verbotenes Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder
Nutzeraufmerksamkeit zu manipulieren.

Verbotenes Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen minderwertiger, duplizierender, Platzhalter- oder
  maschinell generierter Einträge, die keinen echten Nutzwert zu haben scheinen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen Hunderter Einträge mit wenig oder keiner Nutzung, Pflege, Quellklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Reviews zu umgehen
- Irreführen von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen in hohem Umfang sind nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sinnvoll unterschiedlich, korrekt beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, duplizierenden, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechtsansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Review und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiter-Reviews verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- Einträge, die gegen Regeln verstoßen, ausblenden, zurückhalten, entfernen, soft-deleten oder, sofern für den Ressourcentyp unterstützt,
  hard-deleten
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte soft-deleten
- Veröffentlichungszugriff einschränken
- wiederholte oder schwere Verstöße mit Sperren ahnden

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
ausgeblendete Einträge, Sperren und Kontostatus.
