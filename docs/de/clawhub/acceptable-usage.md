---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-04T10:35:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marktplatz-Metadaten für OpenClaw.
Verwenden Sie diese Seite, um zu entscheiden, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer ausführen lässt, wie er
sich darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechtsansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag Nutzern hilft, Software zu bauen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.           |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang klar ist, erforderliche Zugangsdaten ausdrücklich genannt werden und riskante Aktionen Review-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfung dargestellt wird, Beweise erhält und Grenzen für menschliche Genehmigung klar hält.             |
| Persönliche oder Team-Workflows                  | Der Workflow einwilligungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                    |
| Gepflegte Kataloge                               | Jeder Eintrag eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                             |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem engen defensiven oder
einwilligungsbasierten Umfeld akzeptabel sein und unzulässig, wenn es als Missbrauchsworkflow paketiert wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung              | Auth-Bypass, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Calls oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                                              |
| Plattformmissbrauch und Umgehung von Sperren                  | Tarnkonten nach Sperren, Konto-Warming oder -Farming, gefälschtes Engagement, Mehrkonten-Automatisierung, Massenpostings, Spam-Bots oder Automatisierung, die zur Umgehung von Erkennung gebaut wurde.                                                                                                       |
| Betrug, Scams und täuschende Finanzworkflows                  | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschter Social Proof, Synthetic-Identity-Workflows für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                                      |
| Datenschutzverletzende Anreicherung oder Überwachung          | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Breach-Dumps.                                                                        |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation   | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um APIs von Drittanbietern; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                 |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material    | Wiederveröffentlichung von Skills, Plugins, Docs, Markenassets oder proprietärem Code anderer Personen ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                             |

## Unzulässiges Marktplatzverhalten

ClawHub überprüft auch, wie Publisher den Marktplatz nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder Nutzeraufmerksamkeit
zu manipulieren.

Unzulässiges Marktplatzverhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen geringwertiger, duplizierter, Platzhalter- oder
  maschinell generierter Einträge, die keinen echten Nutzwert erkennen lassen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten von Einträgen mit geringer oder keiner Nutzung, Pflege, Quellklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten zur Umgehung von Moderation, Sperren, Publisher-Limits oder
  Marktplatzprüfung
- Irreführung von Nutzern über Eigentum, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichen in hohem Volumen ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sinnvoll unterschiedlich, korrekt beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, duplizierten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marktplatzmeldungen
nicht für Urheberrechts- oder Rechtsansprüche, es sei denn, der Eintrag ist zusätzlich unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiterprüfungen verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- rechtsverletzende Einträge ausblenden, zurückhalten, entfernen, soft-delete ausführen oder, sofern für den Ressourcentyp unterstützt,
  hard-delete ausführen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte per soft-delete entfernen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung erst nach vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) zu Meldungen, Moderations-Holds,
ausgeblendeten Einträgen, Sperren und Kontostatus.
