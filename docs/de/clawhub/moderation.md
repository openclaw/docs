---
read_when:
    - Melden eines Skills, Plugins oder Pakets
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Eintrag
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperrungen und der Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-01T15:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeits- und Installationsflächen benötigen weiterhin Schutzmaßnahmen. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Nutzer zu schützen, wenn ein Release oder Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und zur Risikostufe finden Sie unter [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Zulässige Nutzung](/clawhub/acceptable-usage). Bei Anliegen zu Urheberrechten oder anderen Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Zugangsdaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsvortäuschung
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl bzw. die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Skills oder Plugins eines Drittanbieters. Melden Sie diese direkt an den Publisher oder das Quell-Repository, das im Eintrag verlinkt ist. ClawHub wartet oder patcht keinen Skill- oder Plugin-Code von Drittanbietern.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scanning, Moderation oder Vertrauensgrenzen für Download und Installation. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Skills oder Plugins von Drittanbietern.

Gute Meldungen sind konkret und umsetzbar. Missbrauch des Meldesystems kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitigkeiten über Organisations-, Marken-, Paket-Scope-, Owner-Handle- oder Namespace-Eigentum sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Formular für Konto-Einsprüche.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht sensible Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig überprüft werden sollte. Fügen Sie keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Token oder DNS-Challenge-Token in ein öffentliches Issue ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder künftige Veröffentlichungen können zunächst ausgeblendet starten, bis das Problem geprüft wurde.

Moderationssperren sollen Nutzer schützen, während ClawHub Fälle mit hohem Risiko klärt. Sie können auch aufgehoben werden, wenn ein False Positive bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder auf öffentlichen Installationsflächen anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie das Release nicht, sofern der Owner das Problem nicht behebt oder die Moderation es wiederherstellt.

Owner können weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was geändert werden muss, bevor der Eintrag auf öffentliche Flächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Missbrauchsdrucksignale von Publishern werden täglich geprüft. Signale, die ClawHubs Schwellenwert für potenzielle Sperren erreichen, können eine automatische Warnung auslösen. Wenn der nächste berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin im Schwellenwert für potenzielle Sperren einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit geringerer Sicherheit und zeitlich begrenzte Prüfsignale bleiben von der automatischen Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine scanner-ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

Um False Positives zu reduzieren und das Vertrauen der Nutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Release-Verhalten fragen
