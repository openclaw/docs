---
read_when:
    - Einen Skill, ein Plugin oder ein Paket melden
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Listing
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperrungen und der Kontostatus funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-06-30T22:10:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Entdeckungs- und Installationsflächen benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Nutzer zu schützen, wenn eine Version oder ein Konto unsicher, irreführend oder nicht richtlinienkonform erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe finden Sie unter [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Akzeptable Nutzung](/clawhub/acceptable-usage). Verwenden Sie bei Bedenken zu Urheberrechten oder anderen Inhaltsrechten [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Anmeldeinformationen oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsnachahmung
- böswillige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Akzeptable Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl bzw. die API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt an den Publisher oder das im Eintrag verlinkte Quell-Repository. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scans, Moderation oder Vertrauensgrenzen für Downloads und Installationen. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch des Meldesystems kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitigkeiten über die Inhaberschaft von Organisationen, Marken, Paket-Scopes, Owner-Handles oder Namespaces sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) nutzen, nicht den produktinternen Meldefluss oder das Formular für Kontoeinsprüche.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeitende nicht sensible Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Token oder DNS-Challenge-Token in ein öffentliches Issue ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienverstöße können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Entdeckung ausgeblendet werden, oder zukünftige Veröffentlichungen können zunächst ausgeblendet werden, bis das Problem geprüft wurde.

Moderationssperren sollen Nutzer schützen, während ClawHub Fälle mit hohem Risiko klärt. Sie können auch aufgehoben werden, wenn ein Fehlalarm bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann auf öffentlichen Installationsflächen zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Version nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt sie wieder her.

Owner können weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was sich ändern muss, bevor der Eintrag wieder auf öffentliche Flächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Signale für Missbrauchsdruck durch Publisher werden täglich geprüft. Signale, die den Schwellenwert von ClawHub für eine mögliche Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin in den Schwellenwert für eine mögliche Sperre einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit geringerer Verlässlichkeit und zeitlich begrenzte Prüfsignale bleiben von der automatischen Durchsetzung ausgenommen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn Anmeldung oder normaler CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert sind, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scanergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, beheben Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

So reduzieren Sie Fehlalarme und stärken das Vertrauen der Nutzer:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Nutzer oder Moderatoren Fragen zum Verhalten einer Version stellen
