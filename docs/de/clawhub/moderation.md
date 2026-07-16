---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung nach einer zurückgehaltenen, ausgeblendeten oder gesperrten Auflistung
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Funktionsweise von Meldungen, Moderationssperren, ausgeblendeten Einträgen, Ausschlüssen und Kontostatus bei ClawHub.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-16T12:48:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ermöglicht offene Veröffentlichungen, doch die öffentliche Auffindbarkeit und die Installationsoberflächen benötigen weiterhin Schutzmaßnahmen. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen tragen zum Schutz der Benutzer bei, wenn eine Version oder ein Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Auditkennzeichnungen wie `Pass`, `Review`, `Warn`, `Malicious` und zur Risikostufe finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und
[Zulässige Nutzung](/clawhub/acceptable-usage). Verwenden Sie bei Bedenken hinsichtlich Urheberrechten oder anderen Inhaltsrechten die [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, beispielsweise:

- bösartige Einträge
- irreführende Metadaten
- nicht offengelegte Anmeldedaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsvortäuschung
- böswillige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Report skill** auf einer Skill-Seite oder den Befehl beziehungsweise die API zum Melden von Paketen.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im Quellcode eines Skills oder Plugins eines Drittanbieters. Melden Sie diese direkt dem Herausgeber oder dem im Eintrag verlinkten Quell-Repository. ClawHub wartet oder korrigiert den Code von Skills oder Plugins Dritter nicht.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in
ClawHub selbst vorgesehen. Beispiele sind Fehler in der Website, API, CLI, Registry, Authentifizierung, Überprüfung, Moderation oder in den Vertrauensgrenzen für Downloads und Installationen. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Skills oder Plugins Dritter.

Gute Meldungen sind konkret und umsetzbar. Der Missbrauch der Meldefunktion kann selbst zu Kontomaßnahmen führen.

## Ansprüche auf Organisationen und Namensräume

Streitigkeiten über die Inhaberschaft von Organisationen, Marken, Paketbereichen, Inhaber-Handles oder Namensräumen sollten über das Verfahren für [Ansprüche auf Organisationen und Namensräume](/clawhub/namespace-claims) abgewickelt werden, nicht über die produktinterne Meldefunktion oder das Einspruchsformular für Konten.

Verwenden Sie dieses Verfahren, wenn ClawHub-Mitarbeiter nicht vertrauliche Nachweise prüfen sollen, nach denen ein Namensraum reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig überprüft werden sollte. Fügen Sie einem öffentlichen Issue keine Geheimnisse, privaten Dokumente, vertraulichen Rechtsunterlagen, persönlichen Identitätsdokumente, API-Tokens oder DNS-Challenge-Tokens bei.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienverstöße können dazu führen, dass ein Herausgeber oder Eintrag mit einer Moderationssperre belegt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden oder zukünftige Veröffentlichungen zunächst ausgeblendet bleiben, bis das Problem überprüft wurde.

Moderationssperren sollen Benutzer schützen, während ClawHub Fälle mit hohem Risiko klärt. Sie können auch aufgehoben werden, wenn ein falsch positives Ergebnis bestätigt wird.

## Ausgeblendete oder gesperrte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder auf öffentlichen Installationsoberflächen anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Version nicht, sofern der Inhaber das Problem nicht behebt oder die Moderation sie nicht wiederherstellt.

Inhaber können weiterhin Diagnosedaten für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosedaten helfen zu erklären, was geschehen ist und was geändert werden muss, bevor der Eintrag wieder auf öffentlichen Oberflächen verfügbar sein kann.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinien verstoßen, können ihre Veröffentlichungsberechtigung verlieren. Schwerwiegender Missbrauch kann zu Kontosperren, dem Widerruf von Tokens, ausgeblendeten Inhalten oder entfernten Einträgen führen.
Belastungssignale für Missbrauch durch Herausgeber werden täglich überprüft. Signale, die den ClawHub-Schwellenwert für eine mögliche Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste zulässige Scan nach Ablauf der Warnfrist den Herausgeber weiterhin dem Schwellenwert für eine mögliche Sperre zuordnet, kann ClawHub die Kontomaßnahme automatisch anwenden.
Signale mit geringerer Zuverlässigkeit und zeitlich begrenzte Überprüfungssignale werden nicht automatisch durchgesetzt.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich bei der Weboberfläche an, um den Kontostatus zu überprüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert wird, verwenden Sie zur Prüfung einer Wiederherstellung das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/).

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scanergebnisse für die gesperrte eingereichte Version herunter:
`clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins
`--kind plugin` hinzu. Überprüfen Sie die Scanergebnisse, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Herausgeber

So reduzieren Sie falsch positive Ergebnisse und stärken das Vertrauen der Benutzer:

- halten Sie Namen, Zusammenfassungen, Tags und Änderungsprotokolle korrekt
- geben Sie erforderliche Umgebungsvariablen und Berechtigungen an
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit den Quellcode
- verwenden Sie vor der Veröffentlichung von Plugins Probeläufe
- antworten Sie eindeutig, wenn Benutzer oder Moderatoren Fragen zum Verhalten einer Version stellen
