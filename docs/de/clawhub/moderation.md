---
read_when:
    - Skill, Plugin oder Paket melden
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Listing
    - OpenClaw-ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationszurückstellungen, ausgeblendete Einträge, Sperren und der Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-06-28T05:07:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub steht für Veröffentlichungen offen, aber öffentliche Such- und
Installationsoberflächen benötigen weiterhin Schutzmechanismen. Meldungen,
Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Nutzer zu
schützen, wenn eine Veröffentlichung oder ein Konto unsicher, irreführend oder
richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Labels
wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe finden Sie unter
[Sicherheitsaudits](/de/clawhub/security-audits).

Siehe auch [Sicherheit](/de/clawhub/security) und
[Akzeptable Nutzung](/de/clawhub/acceptable-usage). Bei Urheberrechts- oder anderen
Bedenken zu Inhaltsrechten verwenden Sie
[Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum
Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Zugangsdaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsnachahmung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Akzeptable Nutzung](/de/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den
Meldebefehl beziehungsweise die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode
eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt an den
Publisher oder das Quell-Repository, das im Eintrag verlinkt ist. ClawHub wartet
oder patcht keinen Code von Drittanbieter-Skills oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in
ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry,
Authentifizierung, Scanning, Moderation oder Vertrauensgrenzen beim
Download/Installieren. Verwenden Sie ClawHub-Advisories nicht für
Schwachstellen in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind spezifisch und umsetzbar. Missbrauch des Meldesystems kann
selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitfälle über Organisations-, Marken-, Paket-Scope-, Owner-Handle- oder
Namespace-Eigentum sollten den Prozess
[Organisations- und Namespace-Ansprüche](/de/clawhub/namespace-claims) verwenden,
nicht den produktinternen Meldefluss oder das Formular für Konto-Einsprüche.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht sensible Nachweise
prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt,
ausgeblendet, quarantänisiert, mit einem Alias versehen oder anderweitig geprüft
werden sollte. Fügen Sie keine Geheimnisse, privaten Dokumente, privaten
Rechtsunterlagen, persönlichen Ausweisdokumente, API-Tokens oder
DNS-Challenge-Tokens in ein öffentliches Issue ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können einen Publisher
oder Eintrag unter eine Moderationssperre stellen. In diesem Fall können
betroffene Inhalte aus der öffentlichen Suche ausgeblendet werden, oder künftige
Veröffentlichungen können bis zur Prüfung des Problems zunächst ausgeblendet
starten.

Moderationssperren sollen Nutzer schützen, während ClawHub Fälle mit hohem
Risiko klärt. Sie können auch aufgehoben werden, wenn ein Fehlalarm bestätigt
wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, quarantänisiert, widerrufen oder
anderweitig auf öffentlichen Installationsoberflächen nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Veröffentlichung
nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt sie
wieder her.

Owner können weiterhin Diagnosedaten für ihre eigenen zurückgehaltenen oder
ausgeblendeten Einträge sehen. Diese Diagnosedaten helfen zu erklären, was
geschehen ist und was geändert werden muss, bevor der Eintrag auf öffentliche
Oberflächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff
verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf,
ausgeblendeten Inhalten oder entfernten Einträgen führen. Drucksignale für
Publisher-Missbrauch werden täglich geprüft. Signale, die den
ClawHub-Schwellenwert für eine mögliche Sperre erreichen, können eine
automatische Warnung auslösen. Wenn der nächste zulässige Scan nach Ablauf der
Warnfrist den Publisher weiterhin im Schwellenwert für eine mögliche Sperre
einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit
geringerer Verlässlichkeit und zeitlich begrenzte Prüfsignale bleiben von der
automatischen Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens
verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt,
melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn Anmeldung
oder normaler CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto
blockiert sind, verwenden Sie das
[ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine
Wiederherstellungsprüfung.

Wenn eine durch Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als
bösartig bezeichnet, laden Sie die gespeicherten Scan-Ergebnisse für die
blockierte eingereichte Version herunter:
`clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins
`--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag,
erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

Um Fehlalarme zu reduzieren und das Vertrauen der Nutzer zu verbessern:

- Namen, Zusammenfassungen, Tags und Changelogs korrekt halten
- erforderliche Umgebungsvariablen und Berechtigungen deklarieren
- verschleierte Installationsbefehle vermeiden
- wenn möglich auf den Quellcode verlinken
- Dry Runs vor der Veröffentlichung von Plugins verwenden
- klar antworten, wenn Nutzer oder Moderatoren nach dem Verhalten einer Veröffentlichung fragen
