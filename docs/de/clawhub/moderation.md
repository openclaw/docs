---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung nach einer zurückgehaltenen, ausgeblendeten oder blockierten Auflistung
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperren und Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-01T12:53:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeits- und Installationsoberflächen benötigen weiterhin Schutzmechanismen. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Benutzer zu schützen, wenn eine Veröffentlichung oder ein Konto unsicher, irreführend oder nicht richtlinienkonform erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe finden Sie unter [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Zulässige Nutzung](/clawhub/acceptable-usage). Bei Anliegen zu Urheberrechten oder anderen Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- schädliche Einträge
- irreführende Metadaten
- nicht deklarierte Anmeldeinformationen oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsvortäuschung
- böswillige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Befehl/die API zum Melden von Paketen.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt an den Publisher oder das Quell-Repository, das im Eintrag verlinkt ist. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scanning, Moderation oder Vertrauensgrenzen beim Download/bei der Installation. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch von Meldungen kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitfälle zur Inhaberschaft von Organisationen, Marken, Paket-Scopes, Owner-Handles oder Namespaces sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Konto-Einspruchsformular.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht vertrauliche Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie in einem öffentlichen Issue keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Tokens oder DNS-Challenge-Tokens hinzu.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienverstöße können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder zukünftige Veröffentlichungen können bis zur Prüfung des Problems ausgeblendet starten.

Moderationssperren sollen Benutzer schützen, während ClawHub Hochrisikofälle klärt. Sie können auch aufgehoben werden, wenn ein False Positive bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder auf öffentlichen Installationsoberflächen anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Veröffentlichung nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt sie wieder her.

Owner können weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was sich ändern muss, bevor der Eintrag auf öffentliche Oberflächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugang verlieren. Schwerwiegender Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Publisher-Missbrauchsdruck-Signale werden täglich geprüft. Signale, die den Schwellenwert von ClawHub für eine potenzielle Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste zulässige Scan nach Ablauf der Warnfrist den Publisher weiterhin im Schwellenwert für eine potenzielle Sperre einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit geringerer Sicherheit und begrenzte zeitliche Prüfsignale bleiben von der automatischen Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn Anmeldung oder normaler CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert sind, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für die Wiederherstellungsprüfung.

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als schädlich benennt, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Publisher-Leitlinien

Um False Positives zu reduzieren und das Vertrauen der Benutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe vor der Veröffentlichung von Plugins
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Veröffentlichungsverhalten fragen
