---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung nach einem angehaltenen, ausgeblendeten oder blockierten Listing
    - Moderation, Sperren oder Kontostatus bei ClawHub verstehen
sidebarTitle: Moderation and Account Safety
summary: So funktionieren ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperrungen und der Kontostatus.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-06-28T05:29:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeits- und Installationsflächen benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontoaktionen helfen, Benutzer zu schützen, wenn eine Veröffentlichung oder ein Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Prüfungslabels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe finden Sie unter [Sicherheitsprüfungen](/de/clawhub/security-audits).

Siehe auch [Sicherheit](/de/clawhub/security) und [Akzeptable Nutzung](/de/clawhub/acceptable-usage). Bei Urheberrechts- oder anderen Bedenken zu Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Zugangsdaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsvortäuschung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Akzeptable Nutzung](/de/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Befehl/die API zur Paketmeldung für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt dem Publisher oder dem im Eintrag verlinkten Quell-Repository. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst gedacht. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scanning, Moderation oder Vertrauensgrenzen beim Download/bei der Installation. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch von Meldungen kann selbst zu Kontoaktionen führen.

## Ansprüche auf Organisationen und Namespaces

Streitfälle über Eigentum an Organisationen, Marken, Paket-Scopes, Owner-Handles oder Namespaces sollten den Prozess [Ansprüche auf Organisationen und Namespaces](/de/clawhub/namespace-claims) nutzen, nicht den produktinternen Meldefluss oder das Formular für Konto-Einsprüche.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht sensible Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, quarantänisiert, aliasiert oder anderweitig geprüft werden sollte. Fügen Sie keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Tokens oder DNS-Challenge-Tokens in ein öffentliches Issue ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder zukünftige Veröffentlichungen können bis zur Prüfung des Problems zunächst ausgeblendet bleiben.

Moderationssperren sollen Benutzer schützen, während ClawHub Hochrisikofälle klärt. Sie können auch aufgehoben werden, wenn ein False Positive bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, quarantänisiert, widerrufen oder anderweitig auf öffentlichen Installationsflächen nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Veröffentlichung nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt sie wieder her.

Owner können weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was geändert werden muss, bevor der Eintrag auf öffentliche Flächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Missbrauchsdrucksignale von Publishern werden täglich geprüft. Signale, die den potenziellen Sperrschwellenwert von ClawHub erreichen, können eine automatische Warnung auslösen. Wenn der nächste zulässige Scan nach Ablauf der Warnfrist den Publisher weiterhin im potenziellen Sperrschwellenwert einordnet, kann ClawHub die Kontoaktion automatisch anwenden. Signale mit geringerer Sicherheit und zeitlich begrenzte Prüfsignale bleiben von automatischer Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung nach einer Kontoaktion fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scanergebnisse für die blockierte eingereichte Version herunter:
`clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scanausgabe, beheben Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

So reduzieren Sie False Positives und verbessern das Vertrauen der Benutzer:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Testläufe vor der Veröffentlichung von Plugins
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Verhalten einer Veröffentlichung fragen
