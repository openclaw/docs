---
read_when:
    - Skill, Plugin oder Paket melden
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Eintrag
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperren und der Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-04T20:28:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeits- und Installationsoberflächen benötigen weiterhin Schutzmaßnahmen. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Benutzer zu schützen, wenn ein Release oder Konto unsicher, irreführend oder regelwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Für Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe siehe [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Zulässige Nutzung](/clawhub/acceptable-usage). Bei Urheberrechts- oder anderen Bedenken zu Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Zugangsdaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsnachahmung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Paketmeldebefehl bzw. die Paketmelde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Sicherheitslücken im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt an den Publisher oder das Quell-Repository, das im Eintrag verlinkt ist. ClawHub wartet oder patcht keinen Drittanbieter-Skill- oder -Plugin-Code.

GitHub Security Advisories für `openclaw/clawhub` sind für Sicherheitslücken in ClawHub selbst vorgesehen. Beispiele umfassen Fehler in Website, API, CLI, Registry, Authentifizierung, Scanning, Moderation oder Vertrauensgrenzen beim Download bzw. bei der Installation. Verwenden Sie ClawHub-Advisories nicht für Sicherheitslücken in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch des Meldesystems kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitfälle zu Organisations-, Marken-, Paket-Scope-, Owner-Handle- oder Namespace-Eigentum sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Formular für Kontoeinsprüche.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht vertrauliche Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, quarantänisiert, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie in einem öffentlichen Issue keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Identitätsdokumente, API-Token oder DNS-Challenge-Token ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können einen Publisher oder Eintrag unter eine Moderationssperre stellen. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden oder zukünftige Veröffentlichungen zunächst ausgeblendet starten, bis das Problem geprüft ist.

Moderationssperren sollen Benutzer schützen, während ClawHub Hochrisikofälle klärt. Sie können auch aufgehoben werden, wenn ein falsch positives Ergebnis bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann gesperrt, ausgeblendet, quarantänisiert, widerrufen oder anderweitig auf öffentlichen Installationsoberflächen nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie das Release nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt es wieder her.

Owner können weiterhin Diagnosen für ihre eigenen gesperrten oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was geändert werden muss, bevor der Eintrag auf öffentliche Oberflächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Missbrauchsdrucksignale für Publisher werden täglich geprüft. Signale, die den Schwellenwert von ClawHub für mögliche Sperren erreichen, können eine automatische Warnung auslösen. Wenn der nächste berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin in den Schwellenwert für mögliche Sperren einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit geringerer Konfidenz und zeitlich begrenzte Prüfsignale bleiben von der automatischen Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn Anmeldung oder normaler CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert sind, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für die Wiederherstellungsprüfung.

Wenn eine scanner-ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig benennt, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter:
`clawhub scan download <slug> --version <version>`. Für Plugins fügen Sie `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Leitlinien für Publisher

Um falsch positive Ergebnisse zu reduzieren und das Vertrauen der Benutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe vor dem Veröffentlichen von Plugins
- reagieren Sie klar, wenn Benutzer oder Moderatoren nach dem Release-Verhalten fragen
