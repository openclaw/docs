---
read_when:
    - Melden eines Skills, Plugins oder Pakets
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Listing
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: So funktionieren ClawHub-Meldungen, Moderationssperren, ausgeblendete Listings, Bans und der Kontostatus.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-05T05:46:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeits- und Installationsflächen benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Listings und Kontoaktionen helfen, Nutzer zu schützen, wenn ein Release oder Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Für Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe siehe [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/de/clawhub/security) und [Zulässige Nutzung](/clawhub/acceptable-usage). Für Urheberrechts- oder andere Anliegen zu Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Listings
- irreführende Metadaten
- nicht deklarierte Zugangsdaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsanmaßung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl bzw. die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt dem Publisher oder dem Quell-Repository, das im Listing verlinkt ist. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst gedacht. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scanning, Moderation oder Vertrauensgrenzen für Download/Installation. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch der Meldefunktion kann selbst zu Kontoaktionen führen.

## Organisations- und Namespace-Ansprüche

Streitfälle über Organisations-, Marken-, Paket-Scope-, Owner-Handle- oder Namespace-Eigentum sollten das Verfahren [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Konto-Einspruchsformular.

Verwenden Sie dieses Verfahren, wenn ClawHub-Mitarbeiter nicht vertrauliche Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geprüft werden sollte. Fügen Sie in einem öffentlichen Issue keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Token oder DNS-Challenge-Token ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Publisher oder Listing unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder zukünftige Veröffentlichungen können ausgeblendet beginnen, bis das Problem geprüft wurde.

Moderationssperren sollen Nutzer schützen, während ClawHub Hochrisikofälle klärt. Sie können auch aufgehoben werden, wenn ein False Positive bestätigt wird.

## Ausgeblendete oder blockierte Listings

Ein Listing kann gesperrt, ausgeblendet, unter Quarantäne gestellt, widerrufen oder auf öffentlichen Installationsflächen anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie das Release nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt es wieder her.

Owner können weiterhin Diagnosen für ihre eigenen gesperrten oder ausgeblendeten Listings sehen. Diese Diagnosen helfen zu erklären, was passiert ist und was geändert werden muss, bevor das Listing auf öffentliche Flächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerwiegender Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Listings führen. Publisher-Missbrauchsdrucksignale werden täglich geprüft. Signale, die den ClawHub-Schwellenwert für potenzielle Sperren erreichen, können eine automatische Warnung auslösen. Wenn der nächste zulässige Scan nach Ablauf der Warnfrist den Publisher weiterhin in den Schwellenwert für potenzielle Sperren einordnet, kann ClawHub die Kontoaktion automatisch anwenden. Signale mit geringerer Konfidenz und zeitlich begrenzte Prüfsignale bleiben von automatischer Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontoaktion fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn Anmeldung oder normaler CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert sind, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine durch einen Scanner ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig bezeichnet, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Für Plugins fügen Sie `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, korrigieren Sie das Listing, erhöhen Sie die Versionsnummer und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

Um False Positives zu reduzieren und das Vertrauen der Nutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Release-Verhalten fragen
