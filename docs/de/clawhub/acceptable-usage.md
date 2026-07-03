---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was dort nicht gehostet wird.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-03T23:29:34Z"
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
sich selbst darstellt und wie Publisher ClawHubs Oberflächen für Discovery, Installation und
Vertrauen nutzen. Moderationsstatus und Kontostand finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Copyright- oder andere Rechteansprüche
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben veröffentlicht
werden.

| Kategorie                                         | Zulässig, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Der Eintrag Benutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungsworkflows               | Der Umfang klar ist, erforderliche Zugangsdaten explizit genannt werden und riskante Aktionen Review-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfung ausgelegt ist, Beweise bewahrt und Grenzen für menschliche Genehmigung klar hält.                          |
| Persönliche oder Team-Workflows                       | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen verwendet.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag eindeutig, nützlich, zutreffend beschrieben und angemessen gepflegt ist.                                                |

Der Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Umfeld akzeptabel und inakzeptabel sein, wenn es als Missbrauchsworkflow
verpackt wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung                      | Authentifizierungsumgehung, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Benutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Tarnkonten nach Sperren, Kontoaufwärmung oder -farming, künstliches Engagement, Multi-Account-Automatisierung, Massenveröffentlichungen, Spam-Bots oder Automatisierung, die dazu gebaut ist, Erkennung zu vermeiden.                                                                                                                                          |
| Betrug, Scams und täuschende Finanzworkflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflüsse, Scam-Outreach, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Tools zum Ausgeben/Belasten ohne klare menschliche Genehmigung.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                                                                                  |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation       | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Werkzeuge, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                                                 |
| Explizit sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | Generierung von NSFW-Bildern, -Videos oder -Inhalten; Wrapper für Erwachsenen Inhalte um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizit sexuelle Inhalte sind.                                                                                                                                                       |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag tatsächlich zur Ausführung benötigt. |
| Copyright-verletzendes oder rechtsverletzendes Material           | Erneute Veröffentlichung von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder Benutzeraufmerksamkeit
zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Einträgen mit geringem Aufwand, Duplikaten, Platzhaltern oder
  maschinell erzeugten Einträgen, die keinen echten Benutzerwert zu haben scheinen
- Überfluten von Such- oder Kategorieoberflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten von Einträgen mit wenig oder keiner Nutzung, Pflege, Quellklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Prüfungen zu umgehen
- Irreführung von Benutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichen in hohem Volumen ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sinnvoll unterschiedlich, zutreffend beschrieben, gepflegt
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, duplikativen, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen verbunden ist.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Copyright oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Copyright- oder Rechteansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Mitarbeiterprüfung verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu erkennen. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge ausblenden, zurückhalten, entfernen, vorläufig löschen oder, sofern für den Ressourcentyp unterstützt,
  endgültig löschen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte vorläufig löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren keine Durchsetzung mit vorheriger Warnung bei offensichtlichem Missbrauch. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
ausgeblendete Einträge, Sperren und Kontostand.
