---
read_when:
    - Überprüfung von Uploads auf Missbrauch oder Richtlinienverstöße
    - Moderationsdokumentation oder Prüfleitfäden verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden soll
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: Was ClawHub erlaubt und welche Inhalte dort nicht gehostet werden.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-12T01:25:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marketplace-Metadaten für OpenClaw.
Diese Seite hilft Ihnen bei der Entscheidung, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub zulässig sind.

Diese Regeln gelten dafür, was ein Eintrag tut, zu welchen Ausführungen er Benutzer auffordert, wie er
sich darstellt und wie Herausgeber die Auffindbarkeits-, Installations- und
Vertrauensfunktionen von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechts- oder anderen Rechtsansprüchen
finden Sie unter [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich und verständlich sind und in gutem
Glauben veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                          | Der Eintrag Benutzern hilft, Software zu entwickeln, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                       |
| Benutzeroberflächen-, Daten- und Automatisierungsabläufe | Der Umfang klar ist, erforderliche Zugangsdaten ausdrücklich angegeben sind und riskante Aktionen Prüf-, Probelauf-, Vorschau- oder Bestätigungswege umfassen.       |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen vorgesehen ist, Beweise erhält und die Grenzen für menschliche Genehmigungen klar einhält.                                      |
| Persönliche oder Team-Arbeitsabläufe              | Der Arbeitsablauf auf Einwilligung basierende Konten, eine transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                                     |
| Gepflegte Kataloge                                | Jeder Eintrag eigenständig und nützlich ist, korrekt beschrieben wird und angemessen gepflegt ist.                                                                  |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng begrenzten defensiven oder
einwilligungsbasierten Rahmen zulässig sein und unzulässig werden, wenn es als Arbeitsablauf für Missbrauch angeboten wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzungen sind.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Umgehung von Sicherheitsmaßnahmen    | Umgehung der Authentifizierung, Kontoübernahmen, Missbrauch von Ratenbegrenzungen, Übernahme laufender Anrufe oder Agenten, wiederverwendbarer Diebstahl von Sitzungen oder automatische Genehmigung von Kopplungsabläufen für nicht genehmigte Benutzer.                                                                        |
| Plattformmissbrauch und Umgehung von Sperren                  | Verdeckte Konten nach Sperren, Aufwärmen oder Farmen von Konten, vorgetäuschte Interaktionen, Automatisierung mehrerer Konten, massenhafte Veröffentlichungen, Spam-Bots oder Automatisierung zur Vermeidung der Erkennung.                                                                                                     |
| Betrug, Täuschungen und irreführende Finanzabläufe            | Gefälschte Zertifikate oder Rechnungen, irreführende Zahlungsabläufe, betrügerische Kontaktaufnahme, vorgetäuschte soziale Bestätigung, Arbeitsabläufe mit synthetischen Identitäten für Betrug oder Tools zum Ausgeben bzw. Abbuchen von Geld ohne klare menschliche Genehmigung.                                               |
| In die Privatsphäre eingreifende Datenanreicherung oder Überwachung | Sammeln von Kontaktdaten für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder die Verwendung geleakter Daten beziehungsweise von Datensätzen aus Sicherheitsverletzungen.                                  |
| Nicht einvernehmliche Identitätsnachahmung oder -manipulation | Gesichtsaustausch, digitale Zwillinge, geklonte Influencer, gefälschte Identitäten oder andere Tools, die zum Nachahmen oder Irreführen verwendet werden.                                                                                                                                                                    |
| Explizite sexuelle Inhalte oder nicht sicherheitsbeschränkte Generierung von Inhalten für Erwachsene | Generierung von NSFW-Bildern, -Videos oder -Inhalten, Wrapper für Inhalte für Erwachsene um APIs von Drittanbietern oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                        |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installationsprogramme, etwa heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Geheimnisse oder private Schlüssel, entfernte Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verbergen, was der Eintrag tatsächlich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder anderweitig rechtswidriges Material | Erneute Veröffentlichung fremder Skills, Plugins, Dokumentationen, Markenressourcen oder proprietären Codes ohne Genehmigung, Verletzung von Lizenzbedingungen oder Nachahmung des ursprünglichen Autors oder Herausgebers.                                                                                                  |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Herausgeber den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Auffindbarkeit, Kennzahlen, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit
der Benutzer zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- massenhaftes Veröffentlichen einer großen Anzahl mit geringem Aufwand erstellter, doppelter, als Platzhalter dienender oder
  maschinell erzeugter Einträge, die keinen echten Nutzen für Benutzer erkennen lassen
- das Überfluten von Such- oder Kategoriebereichen mit nahezu identischen Skills oder Plugins
- das Veröffentlichen Hunderter Einträge mit geringer oder keiner Nutzung, Pflege, Klarheit
  der Quelle oder bedeutsamen Unterscheidungsmerkmalen
- das künstliche Erhöhen von Installationen, Downloads, Sternen oder anderen Interaktionskennzahlen
  durch Automatisierung, Schleifen von Selbstinstallationen, gefälschte Konten, koordinierte
  Aktivitäten, bezahlte Interaktionen oder anderes nicht organisches Verhalten
- das Erstellen oder Wechseln von Konten, um Moderation, Sperren, Herausgeberbeschränkungen oder
  Marketplace-Prüfungen zu umgehen
- das Irreführen von Benutzern hinsichtlich Eigentümerschaft, Quelle, Funktionen, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Herausgeber
- das wiederholte Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder gesperrt wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen in großer Zahl stellen nicht automatisch Missbrauch dar. Große Kataloge sind zulässig,
wenn die Einträge sich wesentlich unterscheiden, korrekt beschrieben und gepflegt werden
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
die große Anzahl mit inhaltsarmen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie der Ansicht sind, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, nutzen Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechts- oder andere Rechtsansprüche, es sei denn, der Eintrag ist außerdem unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Prüfungen durch Mitarbeiter einsetzen, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu erkennen. Ein Signal
beweist für sich allein keinen Missbrauch; es hilft ClawHub bei der Entscheidung, was geprüft werden muss.

Wir können:

- regelwidrige Einträge ausblenden, zurückhalten, entfernen, vorläufig löschen oder, sofern dies für den Ressourcentyp unterstützt wird,
  endgültig löschen
- Downloads oder Installationen unsicherer Versionen sperren
- API-Token widerrufen
- zugehörige Inhalte vorläufig löschen
- den Veröffentlichungszugriff einschränken
- wiederholte oder schwerwiegende Regelverstöße mit einer Sperre belegen

Bei offensichtlichem Missbrauch garantieren wir keine vorherige Warnung. Unter
[Moderation und Kontosicherheit](/clawhub/moderation) finden Sie Informationen zu Meldungen, Moderationssperren,
ausgeblendeten Einträgen, Sperren und dem Kontostatus.
