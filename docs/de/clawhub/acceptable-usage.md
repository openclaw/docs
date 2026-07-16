---
read_when:
    - Überprüfung von Uploads auf Missbrauch oder Richtlinienverstöße
    - Moderationsdokumentation oder Leitfäden für Reviewer verfassen
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden soll
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: Was ClawHub erlaubt und was dort nicht gehostet wird.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-16T12:32:23Z"
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
Diese Seite hilft bei der Entscheidung, ob Inhalte oder Veröffentlichungsverhalten auf
ClawHub gehören.

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
| Produktivität für Entwickler                           | Der Eintrag Benutzern hilft, Software zu entwickeln, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungsworkflows               | Der Umfang klar ist, erforderliche Anmeldedaten ausdrücklich genannt werden und riskante Aktionen Prüf-, Testlauf-, Vorschau- oder Bestätigungsabläufe umfassen. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfungen vorgesehen ist, Beweismittel bewahrt und die Grenzen menschlicher Genehmigung klar erkennbar hält.                          |
| Persönliche oder Team-Workflows                       | Der Workflow auf Einwilligung basierende Konten, eine transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                                            |
| Gepflegte Kataloge                              | Jeder Eintrag eigenständig, nützlich, zutreffend beschrieben und angemessen gepflegt ist.                                                |

Der Kontext ist entscheidend. Dasselbe Thema kann in einem eng begrenzten defensiven oder
einwilligungsbasierten Umfeld zulässig und als Missbrauchsworkflow verpackt unzulässig sein.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzungen sind.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Umgehung von Sicherheitsmaßnahmen                      | Umgehung der Authentifizierung, Kontoübernahme, Missbrauch von Ratenbegrenzungen, Übernahme laufender Anrufe oder Agents, Diebstahl wiederverwendbarer Sitzungen oder automatische Genehmigung von Kopplungsabläufen für nicht zugelassene Benutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Verdeckte Konten nach Sperren, Aufwärmen oder Farmen von Konten, vorgetäuschte Interaktionen, Automatisierung mehrerer Konten, massenhafte Veröffentlichungen, Spam-Bots oder Automatisierung zur Vermeidung der Erkennung.                                                                                                                                          |
| Betrug, Täuschung und irreführende Finanzworkflows             | Gefälschte Zertifikate oder Rechnungen, irreführende Zahlungsabläufe, betrügerische Kontaktaufnahme, vorgetäuschter sozialer Beweis, Workflows mit synthetischen Identitäten für Betrug oder Tools zum Ausgeben beziehungsweise Abbuchen von Geld ohne eindeutige menschliche Genehmigung.                                                                                                                    |
| Eingriffe in die Privatsphäre oder Überwachung                 | Extraktion von Kontaktdaten für Spam, Doxxing, Stalking, Lead-Extraktion in Verbindung mit unaufgeforderter Kontaktaufnahme, verdeckte Überwachung, biometrischer Abgleich ohne Einwilligung oder die Verwendung geleakter Daten oder Datensätze aus Sicherheitsverletzungen.                                                                                                                  |
| Identitätsnachahmung oder -manipulation ohne Einwilligung       | Gesichtsaustausch, digitale Zwillinge, geklonte Influencer, gefälschte Personas oder andere Tools zur Identitätsnachahmung oder Irreführung.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder nicht abgesicherte Generierung von Erwachseneninhalten | Generierung nicht jugendfreier Bilder, Videos oder Inhalte; Wrapper für Erwachseneninhalte um APIs von Drittanbietern; oder Einträge, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installationsprogramme, etwa heruntergeladene Inhalte, die ohne klare Prüfbarkeit mit `sh` oder `bash` ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte Ausführung von `npx @latest` ohne klare Prüfbarkeit oder Metadaten, die verschleiern, was der Eintrag tatsächlich zur Ausführung benötigt. |
| Urheberrechtsverletzendes oder sonstige Rechte verletzendes Material           | Erneute Veröffentlichung fremder Skills, Plugins, Dokumentation, Markenassets oder proprietären Codes ohne Genehmigung; Verletzung von Lizenzbedingungen; oder Nachahmung des ursprünglichen Autors oder Herausgebers.                                                                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft außerdem, wie Herausgeber den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Auffindbarkeit, Kennzahlen, Vertrauenssignale, Moderationssysteme oder die Aufmerksamkeit von
Benutzern zu manipulieren.

Zu unzulässigem Marketplace-Verhalten gehören:

- massenhafte Veröffentlichung einer großen Zahl oberflächlicher, doppelter, als Platzhalter dienender oder
  maschinell erstellter Einträge, die keinen echten Nutzen für Benutzer zu haben scheinen
- Überflutung von Such- oder Kategorieansichten mit nahezu identischen Skills oder Plugins
- Veröffentlichung Hunderter Einträge mit geringer oder keiner Nutzung, Pflege, Quellenklarheit
  oder sinnvollen Unterscheidungsmerkmalen
- künstliche Steigerung von Installationen, Downloads, Sternen oder anderen Interaktionskennzahlen
  durch Automatisierung, Selbstinstallationsschleifen, gefälschte Konten, koordinierte
  Aktivitäten, bezahlte Interaktionen oder anderes nicht organisches Verhalten
- Erstellung oder Rotation von Konten zur Umgehung von Moderation, Sperren, Herausgeberbeschränkungen oder
  Marketplace-Prüfungen
- Irreführung von Benutzern hinsichtlich Eigentümerschaft, Quelle, Funktionen, Sicherheitsniveau,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Herausgeber
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder gesperrt wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichungen in großem Umfang stellen nicht automatisch Missbrauch dar. Große Kataloge sind zulässig,
wenn sich die Einträge wesentlich unterscheiden, zutreffend beschrieben und gepflegt werden
und von echten Benutzern verwendet werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
der Umfang mit inhaltsarmen, doppelten, irreführenden, ungepflegten oder
künstlich beworbenen Einträgen einhergeht.

## Inhaltsrechte

Wenn Sie der Ansicht sind, dass Inhalte auf ClawHub Ihr Urheberrecht oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Urheberrechtsansprüche oder Ansprüche aus anderen Rechten, es sei denn, der Eintrag ist außerdem unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Prüfungen durch Mitarbeiter verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich allein keinen Missbrauch; es hilft ClawHub bei der Entscheidung, was geprüft werden muss.

Wir können:

- rechtsverletzende Einträge ausblenden, zurückhalten, entfernen, vorläufig löschen oder, sofern für den Ressourcentyp unterstützt,
  endgültig löschen
- Downloads oder Installationen unsicherer Releases sperren
- API-Token widerrufen
- zugehörige Inhalte vorläufig löschen
- den Veröffentlichungszugriff einschränken
- wiederholte oder schwerwiegende Verstöße mit einer Sperre belegen

Bei offensichtlichem Missbrauch garantieren wir nicht, dass vor Durchsetzungsmaßnahmen zunächst eine Warnung erfolgt. Informationen zu
Meldungen, Moderationssperren, ausgeblendeten Einträgen, Sperren und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation).
