---
read_when:
    - Überprüfung von Uploads auf Missbrauch oder Richtlinienverstöße
    - Moderationsdokumentation oder Review-Runbooks schreiben
    - Entscheiden, ob eine Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
sidebarTitle: Acceptable Usage
summary: 'Marketplace-Richtlinie: was ClawHub erlaubt und was ClawHub nicht hostet.'
title: Akzeptable Nutzung
x-i18n:
    generated_at: "2026-07-04T20:28:19Z"
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

Diese Regeln gelten dafür, was ein Listing tut, welche Ausführungsschritte es von Benutzern verlangt, wie es
sich selbst darstellt und wie Publisher die Discovery-, Installations- und
Vertrauensflächen von ClawHub nutzen. Moderationsstatus und Kontostatus finden Sie unter
[Moderation und Kontosicherheit](/clawhub/moderation). Copyright- oder andere Rechteansprüche
finden Sie unter [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Zulässige Inhalte

ClawHub begrüßt Inhalte, die nützlich, verständlich und in gutem
Glauben veröffentlicht sind.

| Kategorie                                         | Zulässig, wenn                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entwicklerproduktivität                           | Das Listing Benutzern hilft, Software zu erstellen, zu testen, zu migrieren, zu debuggen, zu dokumentieren oder zu betreiben.                                               |
| UI-, Daten- und Automatisierungsworkflows               | Der Umfang klar ist, erforderliche Zugangsdaten ausdrücklich genannt werden und riskante Aktionen Prüf-, Dry-Run-, Vorschau- oder Bestätigungspfade enthalten. |
| Defensive Sicherheit, Moderation und Missbrauchsprüfung | Das Tool für autorisierte Prüfung formuliert ist, Beweise erhält und Grenzen für menschliche Genehmigung klar hält.                          |
| Persönliche oder Team-Workflows                       | Der Workflow zustimmungsbasierte Konten, transparente Einrichtung und ausdrückliche Berechtigungen verwendet.                                            |
| Gepflegte Kataloge                              | Jedes Listing eigenständig, nützlich, korrekt beschrieben und angemessen gepflegt ist.                                                |

Der Kontext ist wichtig. Dasselbe Thema kann in einem engen defensiven oder
zustimmungsbasierten Rahmen akzeptabel sein und inakzeptabel werden, wenn es als Missbrauchsworkflow paketiert ist.

## Unzulässige Inhalte

ClawHub hostet keine Inhalte, deren Hauptzweck Missbrauch, Täuschung, unsichere
Ausführung oder Rechtsverletzung ist.

| Kategorie                                                    | Nicht zulässig                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unbefugter Zugriff oder Sicherheitsumgehung                      | Auth-Umgehung, Kontoübernahme, Rate-Limit-Missbrauch, Übernahme von Live-Anrufen oder Agenten, wiederverwendbarer Sitzungsdiebstahl oder automatisch genehmigte Pairing-Flows für nicht genehmigte Benutzer.                                                                                                                                                   |
| Plattformmissbrauch und Umgehung von Sperren                              | Tarnkonten nach Sperren, Account Warming oder Farming, gefälschtes Engagement, Multi-Account-Automatisierung, Massenveröffentlichungen, Spam-Bots oder Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.                                                                                                                                          |
| Betrug, Scams und täuschende Finanzworkflows             | Gefälschte Zertifikate oder Rechnungen, täuschende Zahlungsflows, Scam-Outreach, gefälschte Social Proofs, Synthetic-Identity-Workflows für Betrug oder Ausgaben-/Abrechnungstools ohne klare menschliche Genehmigung.                                                                                                                    |
| Datenschutzverletzende Anreicherung oder Überwachung                 | Kontakt-Scraping für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgeforderter Ansprache, verdeckte Überwachung, nicht einvernehmlicher biometrischer Abgleich oder Nutzung geleakter Daten oder Daten aus Sicherheitsverletzungen.                                                                                                                  |
| Nicht einvernehmliche Imitation oder Identitätsmanipulation       | Face Swap, digitale Zwillinge, geklonte Influencer, Fake-Personas oder andere Tools, die zur Imitation oder Irreführung verwendet werden.                                                                                                                                                                                                 |
| Explizite sexuelle Inhalte oder sicherheitsdeaktivierte Adult-Generierung | Generierung von NSFW-Bildern, -Videos oder -Inhalten; Adult-Content-Wrapper um APIs von Drittanbietern; oder Listings, deren Hauptzweck explizite sexuelle Inhalte sind.                                                                                                                                                       |
| Verborgene, unsichere oder irreführende Ausführungsanforderungen        | Verschleierte Installationsbefehle, Pipe-to-Shell-Installer wie heruntergeladene Inhalte, die mit `sh` oder `bash` ohne klare Prüfbarkeit ausgeführt werden, nicht deklarierte Anforderungen an Secrets oder private Schlüssel, entfernte `npx @latest`-Ausführung ohne klare Prüfbarkeit oder Metadaten, die verbergen, was das Listing wirklich zur Ausführung benötigt. |
| Copyright-verletzendes oder rechteverletzendes Material           | Erneute Veröffentlichung von Skills, Plugins, Dokumentation, Markenassets oder proprietärem Code einer anderen Person ohne Erlaubnis; Verletzung von Lizenzbedingungen; oder Imitation des ursprünglichen Autors oder Publishers.                                                                                                                            |

## Unzulässiges Marketplace-Verhalten

ClawHub prüft auch, wie Publisher den Marketplace nutzen. Verwenden Sie ClawHub nicht, um
Discovery, Metriken, Vertrauenssignale, Moderationssysteme oder Benutzeraufmerksamkeit
zu manipulieren.

Unzulässiges Marketplace-Verhalten umfasst:

- Massenveröffentlichung großer Mengen geringwertiger, duplikativer, Platzhalter- oder
  maschinell generierter Listings, die keinen echten Benutzerwert erkennen lassen
- Überflutung von Such- oder Kategorieflächen mit nahezu identischen Skills oder Plugins
- Veröffentlichung Hunderter Listings mit geringer oder keiner Nutzung, Wartung, Quellklarheit
  oder sinnvoller Differenzierung
- künstliches Aufblähen von Installationen, Downloads, Sternen oder anderen Engagement-
  Metriken durch Automatisierung, Selbstinstallationsschleifen, Fake-Konten, koordinierte
  Aktivität, bezahltes Engagement oder anderes nicht organisches Verhalten
- Erstellen oder Rotieren von Konten, um Moderation, Sperren, Publisher-Limits oder
  Marketplace-Prüfung zu umgehen
- Irreführung von Benutzern über Eigentümerschaft, Quelle, Fähigkeiten, Sicherheitslage,
  Installationsanforderungen oder Zugehörigkeit zu einem anderen Projekt oder Publisher
- wiederholtes Hochladen von Inhalten, die bereits ausgeblendet, entfernt oder blockiert wurden,
  ohne das zugrunde liegende Problem zu beheben

Veröffentlichung in hohem Volumen ist nicht automatisch Missbrauch. Große Kataloge sind akzeptabel,
wenn die Listings sinnvoll unterschiedlich, korrekt beschrieben, gepflegt
und von echten Benutzern genutzt werden. Große Kataloge werden zu einem Vertrauens- und Sicherheitsproblem, wenn
Volumen mit dünnen, duplikativen, irreführenden, ungepflegten oder
künstlich beworbenen Listings einhergeht.

## Inhaltsrechte

Wenn Sie glauben, dass Inhalte auf ClawHub Ihr Copyright oder andere Rechte verletzen, verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights). Verwenden Sie normale Marketplace-
Meldungen nicht für Copyright- oder Rechteansprüche, es sei denn, das Listing ist außerdem unsicher,
bösartig oder irreführend.

## Prüfung und Durchsetzung

ClawHub kann automatisierte Prüfungen, statistische Missbrauchssignale, Benutzermeldungen und
Mitarbeiterprüfung verwenden, um unsichere Inhalte oder missbräuchliches Veröffentlichungsverhalten zu identifizieren. Ein Signal
beweist für sich genommen keinen Missbrauch; es hilft ClawHub zu entscheiden, was geprüft werden muss.

Wir können:

- Listings, die gegen Regeln verstoßen, ausblenden, zurückhalten, entfernen, soft-delete oder, sofern für den Ressourcentyp unterstützt,
  hard-delete
- Downloads oder Installationen für unsichere Releases blockieren
- API-Tokens widerrufen
- zugehörige Inhalte soft-delete
- Veröffentlichungszugriff einschränken
- Wiederholungstäter oder schwere Verstöße sperren

Wir garantieren bei offensichtlichem Missbrauch keine Durchsetzung mit vorheriger Warnung. Siehe
[Moderation und Kontosicherheit](/clawhub/moderation) für Meldungen, Moderations-Holds,
ausgeblendete Listings, Sperren und Kontostatus.
