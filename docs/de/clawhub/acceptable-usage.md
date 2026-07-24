---
read_when:
    - Überprüfung von Uploads auf Missbrauch oder Richtlinienverstöße
    - Moderationsdokumentation oder Reviewer-Runbooks verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden soll
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: Was ClawHub erlaubt und was dort nicht gehostet wird.'
title: Zulässige Nutzung
x-i18n:
    generated_at: "2026-07-24T03:40:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

ClawHub hostet Skills, Plugins, Pakete und Marketplace-Metadaten für OpenClaw.
Auf dieser Seite können Sie entscheiden, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub gehören.

Diese Regeln gelten dafür, was ein Eintrag tut, zu welchen Ausführungen er Benutzer auffordert, wie er
sich darstellt und wie Herausgeber die Entdeckungs-, Installations- und
Vertrauensbereiche von ClawHub nutzen. Informationen zu Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Informationen zu Urheberrechtsansprüchen oder Ansprüchen aufgrund anderer Rechte
finden Sie unter [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich und verständlich sind und nach bestem
Wissen und Gewissen veröffentlicht werden.

| Kategorie                                        | Zulässig, wenn                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Entwicklerproduktivität                          | Der Eintrag Benutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.              |
| UI-, Daten- und Automatisierungsworkflows         | Der Umfang klar ist, erforderliche Anmeldedaten ausdrücklich genannt sind und riskante Aktionen Prüf-, Probelauf-, Vorschau- oder Bestätigungsabläufe umfassen. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen vorgesehen ist, Beweismittel bewahrt und die Grenzen menschlicher Genehmigung klar hält.         |
| Persönliche oder Team-Workflows                   | Der Workflow einwilligungsbasierte Konten, eine transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                       |
| Gepflegte Kataloge                                | Jeder Eintrag eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                      |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng begrenzten defensiven oder
einwilligungsbasierten Umfeld zulässig und als verpackter Missbrauchsworkflow unzulässig
sein.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder die Verletzung von Rechten ist.

| Kategorie                                                   | Nicht zulässig                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Umgehung von Sicherheitsmaßnahmen   | Umgehung der Authentifizierung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Übernahme laufender Anrufe oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatische Genehmigung von Kopplungsabläufen für nicht genehmigte Benutzer.                                                               |
| Plattformmissbrauch und Umgehung von Sperren                 | Verdeckte Konten nach Sperren, Aufwärmen oder Farmen von Konten, vorgetäuschte Interaktionen, Automatisierung mehrerer Konten, Massenveröffentlichungen, Spam-Bots oder Automatisierung zur Vermeidung der Erkennung.                                                                                              |
| Betrug, Täuschungen und irreführende Finanzworkflows         | Gefälschte Zertifikate oder Rechnungen, irreführende Zahlungsabläufe, betrügerische Kontaktaufnahme, vorgetäuschte soziale Glaubwürdigkeit, Workflows mit synthetischen Identitäten für Betrug oder Tools zum Ausgeben beziehungsweise Abbuchen ohne klare menschliche Genehmigung.                                |
| In die Privatsphäre eingreifende Datenanreicherung oder Überwachung | Auslesen von Kontakten für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, biometrischer Abgleich ohne Einwilligung oder Verwendung geleakter Daten oder Datensätze aus Sicherheitsverletzungen.                                       |
| Identitätsnachahmung oder -manipulation ohne Einwilligung    | Gesichtsaustausch, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools, die zur Nachahmung oder Irreführung verwendet werden.                                                                                                                                                         |
| Explizite sexuelle Inhalte oder nicht sicherheitsbeschränkte Generierung von Inhalten für Erwachsene | Generierung nicht jugendfreier Bilder, Videos oder Inhalte; Wrapper für Inhalte für Erwachsene um Drittanbieter-APIs; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                             |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen | Verschleierte Installationsbefehle, Pipe-to-Shell-Installationsprogramme wie heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verschleiern, was der Eintrag tatsächlich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder sonstige Rechte verletzendes Material | Erneute Veröffentlichung von Skills, Plugins, Dokumentation, Markenressourcen oder proprietärem Code anderer Personen ohne Genehmigung; Verletzung von Lizenzbedingungen; oder Nachahmung des ursprünglichen Autors oder Herausgebers.                                                               |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Herausgeber den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Entdeckung, Metriken, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit der
Benutzer zu manipulieren.

Zu unzulässigem Marketplace-Verhalten gehören:

- massenhaftes Veröffentlichen einer großen Anzahl von mit geringem Aufwand erstellten, duplizierten, als Platzhalter dienenden oder
  maschinell generierten Einträgen, die keinen echten Nutzen für Benutzer zu haben scheinen
- Überfluten von Such- oder Kategoriebereichen mit nahezu identischen Skills oder Plugins
- Veröffentlichen Hunderter Einträge mit geringer oder keiner Nutzung, Pflege, Klarheit
  der Quellen oder nennenswerten Abgrenzung
- künstliches Erhöhen von Installationen, Downloads, Sternen oder anderen Interaktionsmetriken
  durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahlte Interaktionen oder anderes nicht organisches Verhalten
- Erstellen oder Wechseln von Konten zur Umgehung von Moderation, Sperren, Herausgeberbeschränkungen oder
  Marketplace-Prüfungen
- Irreführen von Benutzern über Eigentumsverhältnisse, Quellen, Funktionen, Sicherheitsstatus,
  Installationsanforderungen oder die Zugehörigkeit zu einem anderen Projekt oder Herausgeber
- wiederholtes Hochladen von Inhalten, die bereits verborgen, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen in großer Zahl stellen nicht automatisch Missbrauch dar. Große Kataloge sind zulässig,
wenn sich die Einträge wesentlich unterscheiden, korrekt beschrieben und gepflegt werden
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
ein hohes Volumen mit substanzarmen, duplizierten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen verbunden ist.

## Inhaltsrechte

Wenn Sie der Ansicht sind, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechtsansprüche oder Ansprüche aufgrund anderer Rechte, es sei denn, der Eintrag ist zugleich unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Prüfungen durch Mitarbeitende verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu erkennen. Ein Signal
beweist allein keinen Missbrauch; es hilft ClawHub bei der Entscheidung, was geprüft werden muss.

Wir können:

- gegen die Regeln verstoßende Einträge verbergen, zurückhalten, entfernen, vorläufig löschen oder, sofern für den Ressourcentyp unterstützt,
  endgültig löschen
- Downloads oder Installationen unsicherer Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte vorläufig löschen
- den Veröffentlichungszugriff einschränken
- wiederholte oder schwerwiegende Verstöße mit einer Sperre ahnden

Bei offensichtlichem Missbrauch garantieren wir nicht, dass vor Durchsetzungsmaßnahmen zunächst eine Warnung erfolgt. Informationen zu Meldungen, Moderationssperren,
verborgenen Einträgen, Sperren und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation).
