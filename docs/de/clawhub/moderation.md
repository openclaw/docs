---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung bei einem zurückgehaltenen, ausgeblendeten oder blockierten Eintrag
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie Meldungen, Moderationssperren, ausgeblendete Einträge, Ausschlüsse und der Kontostatus in ClawHub funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-24T03:41:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub steht für Veröffentlichungen offen, doch die öffentliche Auffindbarkeit und die Installationsoberflächen benötigen weiterhin Schutzvorkehrungen. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen tragen zum Schutz der Benutzer bei, wenn eine Veröffentlichung oder ein Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und den Kontostatus. Informationen zu Audit-Kennzeichnungen wie `Pass`, `Review`, `Warn`, `Malicious` und zur Risikostufe finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und
[Zulässige Nutzung](/clawhub/acceptable-usage). Verwenden Sie bei Bedenken hinsichtlich Urheberrechten oder anderen Inhaltsrechten die Seite [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, beispielsweise:

- schädliche Einträge
- irreführende Metadaten
- nicht offengelegte Anmeldedaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsvortäuschung
- böswillige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Befehl/die API zur Paketmeldung für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Skills oder Plugins eines Drittanbieters. Melden Sie diese direkt dem Herausgeber oder dem im Eintrag verlinkten Quell-Repository. ClawHub wartet oder korrigiert den Code von Skills oder Plugins von Drittanbietern nicht.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele hierfür sind Fehler in der Website, API, CLI, Registry, Authentifizierung, Überprüfung, Moderation oder in den Vertrauensgrenzen für Downloads und Installationen. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Skills oder Plugins von Drittanbietern.

Gute Meldungen sind konkret und umsetzbar. Der Missbrauch der Meldefunktion kann selbst zu Kontomaßnahmen führen.

## Ansprüche auf Organisationen und Namensräume

Streitigkeiten über die Inhaberschaft einer Organisation, Marke, eines Paketbereichs, Inhaber-Handles oder Namensraums sollten über das Verfahren [Ansprüche auf Organisationen und Namensräume](/clawhub/namespace-claims) geklärt werden, nicht über die produktinterne Meldefunktion oder das Einspruchsformular für Konten.

Verwenden Sie dieses Verfahren, wenn ClawHub-Mitarbeiter nicht vertrauliche Nachweise prüfen sollen, dass ein Namensraum reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig überprüft werden sollte. Fügen Sie einem öffentlichen Issue keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Identitätsdokumente, API-Tokens oder DNS-Challenge-Tokens bei.

## Moderationssperren

Einige schwerwiegende Feststellungen oder Richtlinienverstöße können dazu führen, dass ein Herausgeber oder Eintrag mit einer Moderationssperre belegt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden oder künftige Veröffentlichungen zunächst ausgeblendet erscheinen, bis das Problem geprüft wurde.

Moderationssperren sollen Benutzer schützen, während ClawHub Fälle mit hohem Risiko klärt. Sie können auch aufgehoben werden, wenn ein falsch positives Ergebnis bestätigt wird.

## Ausgeblendete oder gesperrte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder auf öffentlichen Installationsoberflächen anderweitig nicht verfügbar sein.

Wenn einer dieser Zustände angezeigt wird, installieren Sie die Veröffentlichung nicht, sofern der Inhaber das Problem nicht behebt oder die Moderation sie nicht wiederherstellt.

Inhaber können weiterhin Diagnosedaten für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosedaten erläutern, was geschehen ist und was geändert werden muss, bevor der Eintrag wieder auf öffentlichen Oberflächen erscheinen kann.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinien verstoßen, können ihre Veröffentlichungsberechtigung verlieren. Schwerwiegender Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Drucksignale für Herausgebermissbrauch werden täglich geprüft. Signale, die den Schwellenwert von ClawHub für eine potenzielle Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste zulässige Scan nach Ablauf der Warnfrist den Herausgeber weiterhin im Schwellenwert für eine potenzielle Sperre einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Prüfsignale mit geringerer Konfidenz und zeitlich begrenztem Umfang werden nicht automatisch durchgesetzt.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff aufgrund einer Sperre oder eines deaktivierten Kontos blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als schädlich bezeichnet, laden Sie die gespeicherten Scanergebnisse für die gesperrte eingereichte Version herunter:
`clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins
`--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Herausgeber

So reduzieren Sie falsch positive Ergebnisse und stärken das Vertrauen der Benutzer:

- halten Sie Namen, Zusammenfassungen, Tags und Änderungsprotokolle korrekt
- geben Sie erforderliche Umgebungsvariablen und Berechtigungen an
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Benutzer oder Moderatoren Fragen zum Verhalten einer Veröffentlichung stellen
