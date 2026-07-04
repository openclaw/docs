---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was dort nicht gehostet wird.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-04T15:11:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marketplace-Metadaten für OpenClaw.
Nutzen Sie diese Seite, um zu entscheiden, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer ausführen lässt, wie er
sich darstellt und wie Publisher ClawHubs Discovery-, Installations- und
Vertrauensflächen nutzen. Informationen zu Moderationszuständen und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Für Urheberrechts- oder andere Rechteansprüche
siehe [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem Glauben veröffentlicht
werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag Nutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.       |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang klar ist, erforderliche Zugangsdaten ausdrücklich genannt werden und riskante Aktionen Prüf-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen ausgerichtet ist, Beweise erhält und Grenzen für menschliche Freigaben klar hält.             |
| Persönliche oder Team-Workflows                  | Der Workflow einwilligungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen nutzt.                       |
| Gepflegte Kataloge                               | Jeder Eintrag eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                             |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng gefassten defensiven oder
einwilligungsbasierten Rahmen zulässig sein und unzulässig, wenn es als Missbrauchsworkflow
verpackt wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Sicherheitsumgehung            | Auth-Umgehung, Kontoübernahme, Missbrauch von Rate-Limits, Übernahme von Live-Aufrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Pairing-Flows für nicht genehmigte Nutzer.                                                                                         |
| Plattformmissbrauch und Umgehung von Sperren                | Verdeckte Konten nach Sperren, Account Warming oder Farming, gefälschtes Engagement, Multi-Account-Automatisierung, massenhaftes Posten, Spam-Bots oder Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.                                                                                   |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Ansprache, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Freigabe.                                                                               |
| Datenschutzverletzende Anreicherung oder Überwachung        | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Ansprache, verdeckte Überwachung, biometrischer Abgleich ohne Einwilligung oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                               |
| Identitätsvortäuschung oder Identitätsmanipulation ohne Einwilligung | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Identitätsvortäuschung oder Irreführung verwendet werden.                                                                                                                                                 |
| Explizit sexuelle Inhalte oder sicherheitsdeaktivierte Adult-Generierung | NSFW-Bild-, Video- oder Inhaltsgenerierung; Adult-Content-Wrapper um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizit sexuelle Inhalte sind.                                                                                                                                                    |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag wirklich zum Ausführen benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material  | Erneute Veröffentlichung von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Identitätsvortäuschung des ursprünglichen Autors oder Publishers.                                                                 |

## Unzulässiges Marktplatzverhalten

ClawHub prüft auch, wie Publisher den Marktplatz nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder Nutzeraufmerksamkeit
zu manipulieren.

Unzulässiges Marktplatzverhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Einträgen mit geringem Aufwand, doppelten Inhalten, Platzhaltern oder
  maschinell generierten Einträgen, die keinen echten Nutzerwert erkennen lassen
- Überfluten von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten Einträgen mit wenig oder keiner Nutzung, Pflege, Quellklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marktplatzprüfungen zu umgehen
- Irreführung von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen mit hohem Volumen sind nicht automatisch Missbrauch. Große Kataloge sind zulässig,
wenn die Einträge sinnvoll unterschiedlich, korrekt beschrieben, gepflegt und von echten Nutzern
verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marktplatzmeldungen
nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist außerdem unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzerberichte und
Prüfungen durch Mitarbeitende verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- Einträge, die gegen Regeln verstoßen, ausblenden, zurückhalten, entfernen, vorläufig löschen oder, sofern für den Ressourcentyp unterstützt,
  endgültig löschen
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte vorläufig löschen
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren keine Durchsetzung mit vorheriger Warnung bei offensichtlichem Missbrauch. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
ausgeblendete Einträge, Sperren und Kontostatus.
