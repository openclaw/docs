---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung aus einem zurückgehaltenen, verborgenen oder blockierten Listing
    - Moderation, Sperren oder Kontostatus bei ClawHub verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperrungen und Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-01T05:37:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Discovery- und Installationsoberflächen benötigen weiterhin Schutzmechanismen. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Nutzer zu schützen, wenn eine Version oder ein Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufen finden Sie unter [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Akzeptable Nutzung](/clawhub/acceptable-usage). Für Urheberrechts- oder andere Anliegen zu Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Zugangsdaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsnachahmung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Akzeptable Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl/die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt an den Publisher oder das Quell-Repository, das im Eintrag verlinkt ist. ClawHub wartet oder patcht keinen Skill- oder Plugin-Code von Drittanbietern.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scans, Moderation oder Vertrauensgrenzen beim Download/bei der Installation. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Skills oder Plugins von Drittanbietern.

Gute Meldungen sind konkret und umsetzbar. Missbrauch des Meldesystems kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitigkeiten über die Inhaberschaft von Organisationen, Marken, Paket-Scopes, Owner-Handles oder Namespaces sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den Meldefluss im Produkt oder das Konto-Einspruchsformular.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht vertrauliche Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig überprüft werden sollte. Fügen Sie in einem öffentlichen Issue keine Secrets, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Token oder DNS-Challenge-Token hinzu.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Discovery ausgeblendet werden, oder künftige Veröffentlichungen werden möglicherweise zunächst ausgeblendet, bis das Problem geprüft wurde.

Moderationssperren sollen Nutzer schützen, während ClawHub risikoreiche Fälle klärt. Sie können auch aufgehoben werden, wenn ein False Positive bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder anderweitig auf öffentlichen Installationsoberflächen nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Version nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt sie wieder her.

Owner können weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen erklären, was passiert ist und was geändert werden muss, bevor der Eintrag auf öffentliche Oberflächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Publisher-Missbrauchsdrucksignale werden täglich geprüft. Signale, die ClawHubs Schwellenwert für potenzielle Sperren erreichen, können eine automatische Warnung auslösen. Wenn der nächste berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin in den Schwellenwert für potenzielle Sperren einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Weniger zuverlässige und zeitlich begrenzte Prüfsignale bleiben von der automatischen Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine scanner-ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Für Plugins fügen Sie `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Publisher-Richtlinien

Um False Positives zu reduzieren und das Vertrauen der Nutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe vor dem Veröffentlichen von Plugins
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Verhalten einer Version fragen
