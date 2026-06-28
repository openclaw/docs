---
read_when:
    - Melden eines Skill, Plugin oder Pakets
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Eintrag
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie Meldungen, Moderationssperren, ausgeblendete Einträge, Sperren und der Kontostatus in ClawHub funktionieren.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-06-28T07:41:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeit und Installationsoberflächen benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen helfen, Nutzer zu schützen, wenn ein Release oder Konto unsicher, irreführend oder nicht richtlinienkonform erscheint.

Diese Seite behandelt Moderation und Kontostatus. Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe finden Sie unter [Security Audits](/de/clawhub/security-audits).

Siehe auch [Sicherheit](/de/clawhub/security) und [Zulässige Nutzung](/de/clawhub/acceptable-usage). Bei Bedenken zu Urheberrecht oder anderen Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/de/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Anmeldeinformationen oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsnachahmung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl beziehungsweise die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt an den Publisher oder das im Eintrag verlinkte Quell-Repository. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst bestimmt. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scanning, Moderation oder Vertrauensgrenzen beim Herunterladen und Installieren. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch von Meldungen kann selbst zu Kontomaßnahmen führen.

## Org- und Namespace-Ansprüche

Streitigkeiten über Org-, Marken-, Paket-Scope-, Owner-Handle- oder Namespace-Eigentum sollten den Prozess [Org- und Namespace-Ansprüche](/de/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Einspruchsformular für Konten.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht sensible Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Identitätsdokumente, API-Tokens oder DNS-Challenge-Tokens in ein öffentliches Issue ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Publisher oder Eintrag unter eine Moderationssperre gestellt wird. Wenn dies geschieht, können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder zukünftige Veröffentlichungen können bis zur Prüfung des Problems zunächst ausgeblendet starten.

Moderationssperren sollen Nutzer schützen, während ClawHub Hochrisikofälle klärt. Sie können auch aufgehoben werden, wenn ein False Positive bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann gesperrt, ausgeblendet, unter Quarantäne gestellt, widerrufen oder anderweitig auf öffentlichen Installationsoberflächen nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie das Release nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt es wieder her.

Owner können weiterhin Diagnosen für ihre eigenen gesperrten oder ausgeblendeten Einträge sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was geändert werden muss, bevor der Eintrag auf öffentliche Oberflächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Drucksignale für Publisher-Missbrauch werden täglich geprüft. Signale, die den ClawHub-Schwellenwert für eine mögliche Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin in den Schwellenwert für eine mögliche Sperre einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Weniger verlässliche und zeitlich begrenzte Prüfsignale bleiben von der automatischen Durchsetzung ausgenommen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine scanner-ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig benennt, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

So reduzieren Sie False Positives und verbessern das Vertrauen der Nutzer:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe vor dem Veröffentlichen von Plugins
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Release-Verhalten fragen
