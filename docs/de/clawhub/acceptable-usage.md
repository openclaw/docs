---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße prüfen
    - Moderationsdokumentation oder Prüfer-Runbooks verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was dort nicht gehostet wird.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-12T15:03:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marketplace-Metadaten für OpenClaw.
Auf dieser Seite können Sie entscheiden, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub zulässig sind.

Diese Regeln gelten dafür, was ein Eintrag tut, zu welchen Ausführungen er Benutzer auffordert, wie er
sich darstellt und wie Herausgeber die Auffindbarkeits-, Installations- und
Vertrauensfunktionen von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechtsansprüchen oder Ansprüchen aus anderen Rechten
finden Sie unter [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich und verständlich sind und nach Treu und Glauben
veröffentlicht werden.

| Kategorie                                         | Zulässig, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Der Eintrag hilft Benutzern, Software zu entwickeln, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungs-Workflows               | Der Umfang ist klar, erforderliche Zugangsdaten sind ausdrücklich angegeben und riskante Aktionen bieten Möglichkeiten zur Überprüfung, zum Probelauf, zur Vorschau oder zur Bestätigung. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool ist für autorisierte Prüfungen vorgesehen, bewahrt Beweismittel und definiert die Grenzen für menschliche Genehmigungen eindeutig.                          |
| Persönliche oder Team-Workflows                       | Der Workflow verwendet einwilligungsbasierte Konten, eine transparente Einrichtung und ausdrückliche Berechtigungen.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag ist eigenständig, nützlich, korrekt beschrieben und wird angemessen gepflegt.                                                |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng begrenzten defensiven oder
einwilligungsbasierten Umfeld zulässig sein, aber unzulässig werden, wenn es als Workflow für Missbrauch angeboten wird.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzungen sind.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Umgehung von Sicherheitsmaßnahmen                      | Umgehung der Authentifizierung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Übernahme aktiver Anrufe oder Agenten, Diebstahl wiederverwendbarer Sitzungen oder automatische Genehmigung von Kopplungsvorgängen für nicht genehmigte Benutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Verdeckte Konten nach Sperren, Aufwärmen oder Farmen von Konten, vorgetäuschte Interaktionen, Automatisierung mehrerer Konten, Massenveröffentlichungen, Spam-Bots oder Automatisierung zur Vermeidung der Erkennung.                                                                                                                                          |
| Betrug, Täuschungsversuche und irreführende Finanz-Workflows             | Gefälschte Zertifikate oder Rechnungen, irreführende Zahlungsabläufe, betrügerische Kontaktaufnahme, vorgetäuschte soziale Bestätigung, Workflows mit synthetischen Identitäten für Betrug oder Tools zum Ausgeben bzw. Abbuchen ohne eindeutige menschliche Genehmigung.                                                                                                                    |
| In die Privatsphäre eingreifende Datenanreicherung oder Überwachung                 | Auslesen von Kontaktdaten für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, biometrischer Abgleich ohne Einwilligung oder Verwendung geleakter Daten bzw. Datensammlungen aus Sicherheitsverletzungen.                                                                                                                  |
| Identitätsvortäuschung oder -manipulation ohne Einwilligung       | Gesichtstausch, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools zur Identitätsvortäuschung oder Irreführung.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder Erwachseneninhalte ohne Sicherheitsvorkehrungen | Erzeugung von NSFW-Bildern, -Videos oder -Inhalten; Wrapper für Erwachseneninhalte um APIs von Drittanbietern; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installationsprogramme, beispielsweise heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Geheimnisse oder private Schlüssel, entfernte Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verschleiern, was für die Ausführung des Eintrags tatsächlich erforderlich ist. |
| Urheberrechtsverletzendes oder andere Rechte verletzendes Material           | Erneute Veröffentlichung von Skills, Plugins, Dokumentation, Markenressourcen oder proprietärem Code anderer Personen ohne Genehmigung; Verletzung von Lizenzbedingungen; oder Vortäuschung, der ursprüngliche Autor oder Herausgeber zu sein.                                                                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub überprüft auch, wie Herausgeber den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Auffindbarkeit, Kennzahlen, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit der
Benutzer zu manipulieren.

Zu unzulässigem Marketplace-Verhalten gehören:

- massenhaftes Veröffentlichen großer Mengen oberflächlicher, duplizierter, als Platzhalter dienender oder
  maschinell erzeugter Einträge, die keinen echten Nutzen für Benutzer erkennen lassen
- Überfluten von Such- oder Kategorieansichten mit nahezu identischen Skills oder Plugins
- Veröffentlichen Hunderter Einträge mit geringer oder keiner Nutzung, Pflege, Quelltransparenz
  oder bedeutsamen Differenzierung
- künstliches Erhöhen von Installationen, Downloads, Sternen oder anderen Interaktionskennzahlen
  durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahlte Interaktionen oder anderes nicht organisches Verhalten
- Erstellen oder Wechseln von Konten, um Moderation, Sperren, Herausgeberbeschränkungen oder
  Marketplace-Prüfungen zu umgehen
- Irreführung von Benutzern hinsichtlich Eigentümerschaft, Quelle, Funktionen, Sicherheitsniveau,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Herausgeber
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder gesperrt wurden,
  ohne das zugrunde liegende Problem zu beheben

Das Veröffentlichen großer Mengen stellt nicht automatisch Missbrauch dar. Große Kataloge sind zulässig,
wenn sich die Einträge wesentlich unterscheiden, korrekt beschrieben und gepflegt werden
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
die Menge mit inhaltsarmen, duplizierten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie der Ansicht sind, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechtsansprüche oder Ansprüche aus anderen Rechten, es sei denn, der Eintrag ist außerdem unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Prüfungen durch Mitarbeiter einsetzen, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu erkennen. Ein Signal
allein beweist keinen Missbrauch; es hilft ClawHub bei der Entscheidung, was überprüft werden muss.

Wir können:

- gegen die Regeln verstoßende Einträge ausblenden, zurückhalten, entfernen, vorläufig löschen oder, sofern dies für den Ressourcentyp
  unterstützt wird, endgültig löschen
- Downloads oder Installationen unsicherer Releases sperren
- API-Token widerrufen
- zugehörige Inhalte vorläufig löschen
- den Veröffentlichungszugriff einschränken
- wiederholt oder schwerwiegend gegen die Regeln verstoßende Personen sperren

Bei eindeutigem Missbrauch garantieren wir keine vorherige Warnung. Informationen zu
[Moderation und Kontosicherheit](/clawhub/moderation) finden Sie unter Meldungen, Moderationssperren,
ausgeblendeten Einträgen, Sperren und Kontostatus.
