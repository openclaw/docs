---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Eintrag
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperrungen und der Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-02T08:10:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist für Veröffentlichungen offen, aber öffentliche Auffindbarkeits- und Installationsflächen benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Benutzer zu schützen, wenn ein Release oder Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und zur Risikostufe finden Sie unter [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Akzeptable Nutzung](/clawhub/acceptable-usage). Verwenden Sie bei Urheberrechts- oder anderen Bedenken zu Inhaltsrechten [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Anmeldeinformationen oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsmissbrauch
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen die [Akzeptable Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl bzw. die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Sicherheitslücken im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt an den Publisher oder das Quell-Repository, das im Eintrag verlinkt ist. ClawHub wartet oder patcht keinen Skill- oder Plugin-Code von Drittanbietern.

GitHub Security Advisories für `openclaw/clawhub` sind für Sicherheitslücken in ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scans, Moderation oder Vertrauensgrenzen beim Download bzw. bei der Installation. Verwenden Sie ClawHub-Advisories nicht für Sicherheitslücken in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch von Meldungen kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitfälle über Organisations-, Marken-, Paket-Scope-, Owner-Handle- oder Namespace-Eigentum sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Konto-Einspruchsformular.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht sensible Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, quarantänisiert, aliasiert oder anderweitig geprüft werden sollte. Nehmen Sie keine Secrets, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Tokens oder DNS-Challenge-Tokens in ein öffentliches Issue auf.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder künftige Veröffentlichungen können bis zur Prüfung des Problems zunächst ausgeblendet starten.

Moderationssperren sollen Benutzer schützen, während ClawHub Hochrisikofälle klärt. Sie können auch aufgehoben werden, wenn ein Fehlalarm bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, quarantänisiert, widerrufen oder auf öffentlichen Installationsflächen anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie das Release nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt es wieder her.

Owner können weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was sich ändern muss, bevor der Eintrag auf öffentliche Flächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerwiegender Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Drucksignale für Publisher-Missbrauch werden täglich geprüft. Signale, die ClawHubs Schwellenwert für eine mögliche Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin im Schwellenwert für eine mögliche Sperre einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Weniger zuverlässige und zeitlich begrenzte Prüfsignale bleiben von der automatischen Durchsetzung ausgenommen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scanergebnisse für die blockierte eingereichte Version herunter:
`clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

Um Fehlalarme zu reduzieren und das Vertrauen der Benutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Release-Verhalten fragen
