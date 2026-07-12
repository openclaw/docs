---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung einer zurückgehaltenen, ausgeblendeten oder blockierten Listung
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: So funktionieren Meldungen, Moderationssperren, ausgeblendete Einträge, Ausschlüsse und der Kontostatus bei ClawHub.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-12T21:34:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub steht für Veröffentlichungen offen, doch die öffentliche Auffindbarkeit und Installationsoberflächen benötigen weiterhin Schutzmechanismen. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen tragen zum Schutz der Benutzer bei, wenn eine Veröffentlichung oder ein Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Kennzeichnungen wie `Pass`, `Review`, `Warn`, `Malicious` und zur Risikostufe finden Sie unter [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Zulässige Nutzung](/clawhub/acceptable-usage). Bei Bedenken hinsichtlich Urheberrechten oder anderen Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, beispielsweise:

- schädliche Einträge
- irreführende Metadaten
- nicht deklarierte Anmeldedaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsvortäuschung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Report skill** auf einer Skill-Seite oder den Meldebefehl beziehungsweise die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im Quellcode eines Skills oder Plugins eines Drittanbieters. Melden Sie diese direkt dem Herausgeber oder dem im Eintrag verlinkten Quellcode-Repository. ClawHub wartet oder korrigiert den Code von Skills oder Plugins von Drittanbietern nicht.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele sind Fehler in der Website, API, CLI, Registry, Authentifizierung, Prüfung, Moderation oder in den Vertrauensgrenzen beim Herunterladen und Installieren. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Skills oder Plugins von Drittanbietern.

Gute Meldungen sind konkret und umsetzbar. Der Missbrauch der Meldefunktion kann selbst zu Kontomaßnahmen führen.

## Ansprüche auf Organisationen und Namespaces

Streitigkeiten über die Inhaberschaft von Organisationen, Marken, Paketbereichen, Inhaber-Handles oder Namespaces sollten über das Verfahren [Ansprüche auf Organisationen und Namespaces](/clawhub/namespace-claims) geklärt werden, nicht über die produktinterne Meldefunktion oder das Einspruchsformular für Konten.

Verwenden Sie dieses Verfahren, wenn ClawHub-Mitarbeiter nicht vertrauliche Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie einem öffentlichen Issue keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Identitätsdokumente, API-Token oder DNS-Challenge-Token bei.

## Moderationssperren

Einige schwerwiegende Feststellungen oder Richtlinienverstöße können dazu führen, dass ein Herausgeber oder Eintrag mit einer Moderationssperre belegt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden oder zukünftige Veröffentlichungen zunächst ausgeblendet erscheinen, bis der Sachverhalt geprüft wurde.

Moderationssperren sollen Benutzer schützen, während ClawHub Fälle mit hohem Risiko klärt. Sie können auch aufgehoben werden, wenn ein Fehlalarm bestätigt wird.

## Ausgeblendete oder gesperrte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder anderweitig auf öffentlichen Installationsoberflächen nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Veröffentlichung nicht, es sei denn, der Inhaber behebt das Problem oder die Moderation stellt sie wieder her.

Inhaber können möglicherweise weiterhin Diagnosedaten zu ihren eigenen zurückgehaltenen oder ausgeblendeten Einträgen sehen. Diese Diagnosedaten erklären, was geschehen ist und was geändert werden muss, bevor der Eintrag wieder auf öffentlichen Oberflächen erscheinen kann.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerwiegender Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Drucksignale für Herausgebermissbrauch werden täglich überprüft. Signale, die den ClawHub-Schwellenwert für eine mögliche Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste zulässige Scan nach Ablauf der Warnfrist den Herausgeber weiterhin dem Schwellenwert für eine mögliche Sperre zuordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Prüfsignale mit geringerer Zuverlässigkeit und zeitlich begrenzte Prüfsignale werden nicht automatisch durchgesetzt.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich an der Weboberfläche an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff aufgrund einer Sperre oder eines deaktivierten Kontos blockiert ist, verwenden Sie zur Wiederherstellungsprüfung das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/).

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als schädlich bezeichnet, laden Sie die gespeicherten Scanergebnisse für die gesperrte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Fügen Sie bei Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Herausgeber

So reduzieren Sie Fehlalarme und stärken das Vertrauen der Benutzer:

- halten Sie Namen, Zusammenfassungen, Tags und Änderungsprotokolle korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit den Quellcode
- verwenden Sie vor der Veröffentlichung von Plugins Testläufe
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Verhalten einer Veröffentlichung fragen
