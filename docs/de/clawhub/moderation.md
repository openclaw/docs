---
read_when:
    - Eine Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung nach einer zurückgehaltenen, ausgeblendeten oder blockierten Listung
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperren und der Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-01T07:59:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist für Veröffentlichungen offen, aber öffentliche Auffindbarkeits- und Installationsoberflächen benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Benutzer zu schützen, wenn ein Release oder Konto unsicher, irreführend oder nicht richtlinienkonform erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe finden Sie unter [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Zulässige Nutzung](/clawhub/acceptable-usage). Verwenden Sie bei Bedenken zu Urheberrechten oder anderen Inhaltsrechten [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, wie etwa:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Zugangsdaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsvortäuschung
- missbräuchliche Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl/die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt dem Publisher oder dem im Eintrag verlinkten Quell-Repository. ClawHub wartet oder patcht keinen Drittanbieter-Skill- oder Plugin-Code.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele sind Fehler in der Website, API, CLI, Registry, Authentifizierung, Prüfung, Moderation oder in den Vertrauensgrenzen für Download/Installation. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind spezifisch und umsetzbar. Missbrauch des Meldesystems kann selbst zu einer Kontomaßnahme führen.

## Organisations- und Namespace-Ansprüche

Streitigkeiten über Organisations-, Marken-, Paketbereichs-, Owner-Handle- oder Namespace-Eigentum sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Einspruchsformular für Konten.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht vertrauliche Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie in einem öffentlichen Issue keine Secrets, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Token oder DNS-Challenge-Token ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder zukünftige Veröffentlichungen können bis zur Prüfung des Problems zunächst ausgeblendet starten.

Moderationssperren sollen Benutzer schützen, während ClawHub Hochrisikofälle klärt. Sie können auch aufgehoben werden, wenn ein Fehlalarm bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann gesperrt, ausgeblendet, unter Quarantäne gestellt, widerrufen oder anderweitig auf öffentlichen Installationsoberflächen nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie das Release nicht, sofern der Owner das Problem nicht behebt oder die Moderation den Eintrag wiederherstellt.

Owner können weiterhin Diagnosen für ihre eigenen gesperrten oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was geändert werden muss, bevor der Eintrag auf öffentliche Oberflächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugriff verlieren. Schwerwiegender Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Missbrauchsdrucksignale von Publishern werden täglich geprüft. Signale, die den ClawHub-Schwellenwert für potenzielle Sperren erreichen, können eine automatische Warnung auslösen. Wenn der nächste berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin im Schwellenwert für potenzielle Sperren einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit geringerer Vertrauenswürdigkeit und zeitlich begrenzte Prüfsignale bleiben von der automatischen Durchsetzung ausgenommen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

Um Fehlalarme zu reduzieren und das Benutzervertrauen zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Testläufe vor der Veröffentlichung von Plugins
- antworten Sie klar, wenn Benutzer oder Moderatoren Fragen zum Release-Verhalten stellen
