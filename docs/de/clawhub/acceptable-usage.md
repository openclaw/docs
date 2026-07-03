---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob eine Skill ausgeblendet oder ein Nutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was dort nicht gehostet wird.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-03T13:22:12Z"
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

Diese Regeln gelten dafür, was ein Eintrag tut, was er Benutzer auszuführen auffordert, wie er
sich darstellt und wie Publisher die Discovery-, Installations- und Vertrauensflächen von
ClawHub nutzen. Informationen zu Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechteansprüchen finden Sie unter [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben veröffentlicht
werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag hilft Benutzern, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.     |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang ist klar, erforderliche Zugangsdaten sind ausdrücklich genannt, und riskante Aktionen enthalten Review-, Probelauf-, Vorschau- oder Bestätigungspfade. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfungen gedacht, bewahrt Beweise und hält Grenzen für menschliche Genehmigungen klar.             |
| Persönliche oder Team-Workflows                  | Der Workflow verwendet zustimmungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen.                     |
| Gepflegte Kataloge                               | Jeder Eintrag ist eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt.                                            |

Der Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und unzulässig werden, wenn es als
Missbrauchsworkflow verpackt ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Umgehung von Sicherheitsmaßnahmen   | Auth-Umgehung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Übernahme laufender Aufrufe oder Agents, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Benutzer.                                                                                 |
| Plattformmissbrauch und Umgehung von Sperren                | Tarnkonten nach Sperren, Kontoaufwärmung oder -farming, gefälschtes Engagement, Mehrkonten-Automatisierung, Massenveröffentlichungen, Spam-Bots oder Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.                                                                                       |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflüsse, Scam-Kontaktaufnahme, gefälschte soziale Belege, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung        | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                    |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation | Face-Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Erwachsenengenerierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                    |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Prüfbarkeit oder Metadaten, die verschleiern, was der Eintrag tatsächlich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material  | Erneutes Veröffentlichen von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                               |

## Unzulässiges Marktplatzverhalten

ClawHub überprüft auch, wie Publisher den Marktplatz nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit von
Benutzern zu manipulieren.

Unzulässiges Marktplatzverhalten umfasst:

- Massenveröffentlichung großer Mengen von Einträgen mit geringem Aufwand, doppelten,
  Platzhalter- oder maschinell generierten Inhalten, die keinen echten Benutzernutzen erkennen lassen
- Überflutung von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichung von Hunderten von Einträgen mit wenig oder keiner Nutzung, Pflege, Quellklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Grenzen oder
  Marktplatzprüfungen zu umgehen
- Irreführung von Benutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen mit hohem Volumen sind nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Einträge sinnvoll unterschiedlich, korrekt beschrieben, gepflegt und von echten Benutzern
verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, doppelten, irreführenden, ungepflegten oder künstlich beworbenen Einträgen
verbunden ist.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marktplatzmeldungen nicht für
Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist außerdem unsicher,
bösartig oder irreführend.

## Überprüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Mitarbeiterprüfungen verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist Missbrauch nicht für sich allein; es hilft ClawHub zu entscheiden, was überprüft werden muss.

Wir können:

- verletzende Einträge ausblenden, zurückhalten, entfernen, soft-deleten oder, sofern für den Ressourcentyp unterstützt,
  hard-deleten
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte soft-deleten
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung erst nach Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
ausgeblendete Einträge, Sperren und Kontostatus.
