---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Reviewer-Runbooks schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was nicht gehostet wird.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-04T03:41:53Z"
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

Diese Regeln gelten dafür, was ein Eintrag tut, was er Nutzer ausführen lässt, wie er
sich selbst darstellt und wie Publisher ClawHubs Oberflächen für Auffindbarkeit, Installation und
Vertrauen nutzen. Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Urheberrechts- oder andere Rechteansprüche
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in guter
Absicht veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag hilft Nutzern dabei, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben. |
| UI-, Daten- und Automatisierungsworkflows        | Der Umfang ist klar, erforderliche Zugangsdaten sind explizit angegeben, und riskante Aktionen enthalten Prüf-, Dry-Run-, Vorschau- oder Bestätigungspfade. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfung eingeordnet, bewahrt Beweise und hält Grenzen für menschliche Freigaben klar.              |
| Persönliche oder Team-Workflows                  | Der Workflow verwendet zustimmungsbasierte Konten, transparente Einrichtung und explizite Berechtigungen.                         |
| Gepflegte Kataloge                               | Jeder Eintrag ist eindeutig, nützlich, korrekt beschrieben und angemessen gepflegt.                                               |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Rahmen zulässig sein und unzulässig, wenn es als Missbrauchsworkflow
paketiert ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechteverletzung ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unautorisierter Zugriff oder Umgehung von Sicherheitsmechanismen | Auth-Umgehung, Kontoübernahme, Missbrauch von Rate-Limits, Live-Anruf- oder Agent-Übernahme, wiederverwendbarer Sitzungsdiebstahl oder automatisch freigegebene Pairing-Flows für nicht genehmigte Nutzer.                                                                                                 |
| Plattformmissbrauch und Umgehung von Sperren                | Tarnkonten nach Sperren, Account-Warming oder -Farming, gefälschtes Engagement, Multi-Konto-Automatisierung, Massenposting, Spam-Bots oder Automatisierung, die zur Vermeidung von Erkennung gebaut wurde.                                                                                                |
| Betrug, Scams und täuschende Finanzworkflows                | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschter Social Proof, Workflows mit synthetischen Identitäten für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Freigabe.                                                                          |
| Datenschutzverletzende Anreicherung oder Überwachung        | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                    |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation | Face Swap, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                             |
| Explizite sexuelle Inhalte oder Generierung von Erwachseneninhalten mit deaktivierten Sicherheitsmechanismen | NSFW-Bild-, Video- oder Inhaltsgenerierung; Wrapper für Erwachseneninhalt um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                          |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag tatsächlich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder rechtsverletzendes Material  | Wiederveröffentlichung von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                             |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Auffindbarkeit, Metriken, Vertrauenssignale, Moderationssysteme oder
Nutzeraufmerksamkeit zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen großer Mengen von Einträgen mit geringem Aufwand,
  Duplikaten, Platzhaltern oder maschinell erzeugten Einträgen, die keinen echten Nutzwert zu haben scheinen
- Überfluten von Such- oder Kategorieoberflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichen von Hunderten von Einträgen mit wenig oder keiner Nutzung, Pflege, Quellenklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht-organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Prüfungen zu umgehen
- Irreführung von Nutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen in hohem Umfang sind nicht automatisch Missbrauch. Große Kataloge sind zulässig,
wenn die Einträge sinnvoll unterschiedlich, korrekt beschrieben, gepflegt
und von echten Nutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Umfang mit dünnen, duplikativen, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen kombiniert wird.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder Rechteansprüche, es sei denn, der Eintrag ist auch unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Nutzermeldungen und
Mitarbeiterprüfung verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich allein keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- regelverletzende Einträge ausblenden, zurückhalten, entfernen, soft-deleten oder, sofern für den Ressourcentyp unterstützt,
  hard-deleten
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte soft-deleten
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung erst nach Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderationssperren,
ausgeblendete Einträge, Sperren und Kontostatus.
