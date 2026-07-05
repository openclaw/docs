---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Review-Runbooks schreiben
    - Entscheiden, ob eine Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-05T05:40:25Z"
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

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer ausführen lässt, wie er
sich darstellt und wie Publisher die Discovery-, Installations- und Vertrauensflächen
von ClawHub nutzen. Für Moderationszustände und Kontostatus siehe
[Moderation und Kontosicherheit](/clawhub/moderation). Für Urheberrechts- oder andere Rechteansprüche
siehe [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Erlaubte Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben
veröffentlicht werden.

| Kategorie                                         | Erlaubt, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Der Eintrag hilft Nutzern, Software zu bauen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungsworkflows               | Der Umfang ist klar, erforderliche Zugangsdaten sind ausdrücklich benannt, und riskante Aktionen enthalten Review-, Dry-Run-, Vorschau- oder Bestätigungspfade. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfungen gerahmt, bewahrt Beweise und hält Grenzen für menschliche Genehmigung klar.                          |
| Persönliche oder Team-Workflows                       | Der Workflow verwendet zustimmungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag ist eigenständig, nützlich, zutreffend beschrieben und angemessen gepflegt.                                                |

Der Kontext ist wichtig. Dasselbe Thema kann in einem eng gefassten defensiven oder
zustimmungsbasierten Umfeld zulässig und unzulässig sein, wenn es als Missbrauchsworkflow
verpackt wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                    | Nicht erlaubt                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung                      | Auth-Bypass, Kontoübernahme, Missbrauch von Rate Limits, Übernahme von Live Calls oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Getarnte Konten nach Sperren, Account Warming oder Farming, gefälschtes Engagement, Multi-Account-Automatisierung, Massenposting, Spam-Bots oder Automatisierung, die zur Vermeidung von Erkennung gebaut wurde.                                                                                                                                          |
| Betrug, Scams und täuschende Finanzworkflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Outreach, gefälschter Social Proof, Synthetic-Identity-Workflows für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Kombination mit unaufgefordertem Outreach, verdeckte Überwachung, nicht einvernehmliches biometrisches Matching oder Nutzung geleakter Daten oder Breach-Dumps.                                                                                                                  |
| Nicht einvernehmliche Nachahmung oder Identitätsmanipulation       | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Nachahmung oder Irreführung verwendet werden.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Versteckte, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Secret- oder Private-Key-Anforderungen, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag tatsächlich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechteverletzendes Material           | Erneutes Veröffentlichen von Skills, Plugins, Docs, Markenassets oder proprietärem Code anderer ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Nachahmung des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Unzulässiges Marktplatzverhalten

ClawHub prüft auch, wie Publisher den Marktplatz nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder Nutzeraufmerksamkeit
zu manipulieren.

Unzulässiges Marktplatzverhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen an aufwandsarmen, duplizierenden, Platzhalter- oder
  maschinengenerierten Einträgen, die keinen echten Nutzwert zu haben scheinen
- Fluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten von Einträgen mit wenig oder keiner Nutzung, Wartung, Quellenklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marktplatzprüfungen zu umgehen
- Irreführen von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichen in hohem Volumen ist nicht automatisch Missbrauch. Große Kataloge sind zulässig,
wenn die Einträge sich sinnvoll unterscheiden, zutreffend beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, duplizierenden, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie der Ansicht sind, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marktplatz-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiterprüfungen verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu erkennen. Ein Signal
beweist für sich allein keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- verletzende Einträge ausblenden, zurückhalten, entfernen, soft-löschen oder, sofern für den Ressourcentyp unterstützt,
  hard-löschen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte soft-löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren keine Durchsetzung mit vorheriger Warnung bei offensichtlichem Missbrauch. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
ausgeblendete Einträge, Sperren und Kontostatus.
