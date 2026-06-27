---
read_when:
    - Skill, Plugin oder Paket melden
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Eintrag
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperrungen und der Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-06-27T17:15:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeits- und Installationsflächen benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Nutzer zu schützen, wenn ein Release oder Konto unsicher, irreführend oder regelwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Für Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe siehe [Sicherheitsaudits](/de/clawhub/security-audits).

Siehe auch [Sicherheit](/de/clawhub/security) und [Zulässige Nutzung](/de/clawhub/acceptable-usage). Verwenden Sie bei Bedenken zu Urheberrechten oder anderen Inhaltsrechten [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Zugangsdaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsvortäuschung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl bzw. die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Sicherheitslücken im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt dem Herausgeber oder dem im Eintrag verlinkten Quell-Repository. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Sicherheitslücken in ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scanning, Moderation oder Vertrauensgrenzen bei Download und Installation. Verwenden Sie ClawHub-Advisories nicht für Sicherheitslücken in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch des Meldesystems kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitfälle über Organisations-, Marken-, Paket-Scope-, Owner-Handle- oder Namespace-Inhaberschaft sollten den Prozess [Organisations- und Namespace-Ansprüche](/de/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Formular für Konto-Einsprüche.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht sensible Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie in einem öffentlichen Issue keine Secrets, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Tokens oder DNS-Challenge-Tokens ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können einen Herausgeber oder Eintrag unter eine Moderationssperre stellen. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder künftige Veröffentlichungen können bis zur Prüfung des Problems ausgeblendet starten.

Moderationssperren sollen Nutzer schützen, während ClawHub Hochrisikofälle klärt. Sie können auch aufgehoben werden, wenn ein False Positive bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann auf öffentlichen Installationsflächen zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie das Release nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt es wieder her.

Owner können weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was sich ändern muss, bevor der Eintrag auf öffentliche Flächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Missbrauchsdrucksignale von Herausgebern werden täglich geprüft. Signale, die den ClawHub-Schwellenwert für eine mögliche Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste geeignete Scan nach Ablauf der Warnfrist den Herausgeber weiterhin im Schwellenwert für eine mögliche Sperre einstuft, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit geringerer Zuverlässigkeit und zeitlich begrenzter Prüfung bleiben von der automatischen Durchsetzung ausgenommen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine scanner-ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig nennt, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter:
`clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Herausgeber

Um False Positives zu reduzieren und das Vertrauen der Nutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Trockenläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Verhalten eines Releases fragen
