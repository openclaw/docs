---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung nach einer zurückgehaltenen, ausgeblendeten oder blockierten Auflistung
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperren und Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-04T03:42:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeit und Installationsflächen benötigen weiterhin Schutzmaßnahmen. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Nutzer zu schützen, wenn eine Veröffentlichung oder ein Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Für Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe siehe [Sicherheits-Audits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Akzeptable Nutzung](/clawhub/acceptable-usage). Bei Urheberrechts- oder anderen Anliegen zu Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Anmeldedaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsnachahmung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Akzeptable Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl bzw. die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt beim Publisher oder im Quell-Repository, das im Eintrag verlinkt ist. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scanning, Moderation oder den Vertrauensgrenzen für Download/Installation. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch der Meldefunktion kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitfälle zu Organisation, Marke, Paket-Scope, Owner-Handle oder Namespace-Eigentum sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den In-Product-Meldefluss oder das Einspruchsformular für Konten.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeitende nicht sensible Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, in Quarantäne versetzt, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie in einem öffentlichen Issue keine Geheimnisse, privaten Dokumente, privaten juristischen Unterlagen, persönlichen Ausweisdokumente, API-Token oder DNS-Challenge-Token ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder zukünftige Veröffentlichungen können zunächst ausgeblendet starten, bis das Problem geprüft wurde.

Moderationssperren sollen Nutzer schützen, während ClawHub Fälle mit hohem Risiko klärt. Sie können auch aufgehoben werden, wenn ein Fehlalarm bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, in Quarantäne versetzt, widerrufen oder anderweitig auf öffentlichen Installationsflächen nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Veröffentlichung nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt sie wieder her.

Owner können möglicherweise weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen erklären, was passiert ist und was geändert werden muss, bevor der Eintrag auf öffentliche Flächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Missbrauchsdrucksignale von Publishern werden täglich geprüft. Signale, die den ClawHub-Schwellenwert für eine mögliche Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin im Schwellenwert für eine mögliche Sperre einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit geringerer Zuverlässigkeit und begrenzte zeitliche Review-Signale bleiben von der automatischen Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

Um Fehlalarme zu reduzieren und das Vertrauen der Nutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe vor der Veröffentlichung von Plugins
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Verhalten einer Veröffentlichung fragen
