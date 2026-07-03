---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumente oder Review-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was es nicht hostet.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-03T00:54:19Z"
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

Diese Regeln gelten dafür, was ein Eintrag tut, welche Ausführungsschritte er von Benutzern verlangt, wie er
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub verwenden. Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Erlaubte Inhalte

ClawHub begrüßt Inhalte, die nützlich und verständlich sind und in gutem
Glauben veröffentlicht werden.

| Kategorie                                        | Erlaubt, wenn                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag Benutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                            |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang klar ist, erforderliche Zugangsdaten explizit genannt sind und riskante Aktionen Review-, Dry-Run-, Vorschau- oder Bestätigungspfade haben. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen gedacht ist, Beweise erhält und Grenzen für menschliche Freigaben klar hält.                                 |
| Persönliche oder Team-Workflows                  | Der Workflow auf einwilligungsbasierten Konten, transparenter Einrichtung und expliziten Berechtigungen basiert.                                        |
| Gepflegte Kataloge                               | Jeder Eintrag eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                                   |

Der Kontext zählt. Dasselbe Thema kann in einem engen defensiven oder
einwilligungsbasierten Rahmen zulässig sein und unzulässig werden, wenn es als Missbrauchsworkflow verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                   | Nicht erlaubt                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Umgehung von Sicherheitsmaßnahmen   | Umgehung der Authentifizierung, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Freigabe von Pairing-Flows für nicht genehmigte Benutzer.                                                                                       |
| Plattformmissbrauch und Umgehung von Sperren                | Verdeckte Konten nach Sperren, Account-Warming oder -Farming, gefälschtes Engagement, Multi-Konto-Automatisierung, Massenposting, Spam-Bots oder Automatisierung zur Vermeidung von Erkennung.                                                                                                                               |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Tools zum Ausgeben/Belasten ohne klare menschliche Freigabe.                                                                                           |
| Datenschutzverletzende Anreicherung oder Überwachung        | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion zusammen mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Verwendung geleakter Daten oder Breach-Dumps.                                                                                         |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                              |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Adult-Generierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                  |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material  | Wiederveröffentlichung von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code Dritter ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                                           |

## Unzulässiges Marketplace-Verhalten

ClawHub überprüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die
Aufmerksamkeit der Benutzer zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von geringwertigen, doppelten, Platzhalter- oder
  maschinell generierten Einträgen, die keinen echten Benutzerwert zu haben scheinen
- das Fluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- das Veröffentlichen von Hunderten von Einträgen mit wenig oder keiner Nutzung, Pflege, Quellenklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Review zu umgehen
- Irreführung von Benutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitsstatus,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen mit hohem Volumen sind nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sich sinnvoll unterscheiden, korrekt beschrieben, gepflegt
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist außerdem unsicher,
bösartig oder irreführend.

## Überprüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzerberichte und
Mitarbeiterprüfungen verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist Missbrauch nicht für sich genommen; es hilft ClawHub zu entscheiden, was überprüft werden muss.

Wir können:

- rechtsverletzende Einträge verbergen, zurückhalten, entfernen, soft-deleten oder, sofern für den Ressourcentyp unterstützt,
  hard-deleten
- Downloads oder Installationen für unsichere Releases blockieren
- API-Token widerrufen
- zugehörige Inhalte soft-deleten
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderations-Holds,
verborgene Einträge, Sperren und Kontostatus.
