---
read_when:
    - Melden eines Skills, Plugins oder Pakets
    - Wiederherstellung aus einem zurückgehaltenen, ausgeblendeten oder blockierten Listing
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: So funktionieren ClawHub-Meldungen, Moderationssperren, ausgeblendete Einträge, Sperrungen und der Kontostatus.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-03T13:21:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist für Veröffentlichungen offen, aber öffentliche Auffindbarkeits- und Installationsoberflächen benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen schützen Benutzer, wenn ein Release oder Konto unsicher, irreführend oder richtlinienwidrig erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Labels wie `Pass`, `Review`, `Warn`, `Malicious` und Risikostufe finden Sie unter [Sicherheitsaudits](/clawhub/security-audits).

Siehe auch [Sicherheit](/clawhub/security) und [Zulässige Nutzung](/clawhub/acceptable-usage). Bei Bedenken zu Urheberrecht oder anderen Inhaltsrechten verwenden Sie [Anfragen zu Inhaltsrechten](/clawhub/content-rights).

## Meldungen

Angemeldete Benutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- bösartige Einträge
- irreführende Metadaten
- nicht deklarierte Anmeldeinformationen oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsmissbrauch
- böswillige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl bzw. die API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder Drittanbieter-Plugins. Melden Sie diese direkt dem Herausgeber oder dem Quell-Repository, das im Eintrag verlinkt ist. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills oder Drittanbieter-Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Schwachstellen in ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Authentifizierung, Scans, Moderation oder Vertrauensgrenzen beim Herunterladen und Installieren. Verwenden Sie ClawHub-Advisories nicht für Schwachstellen in Drittanbieter-Skills oder Drittanbieter-Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch des Meldesystems kann selbst zu Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitfälle zu Eigentum an Organisationen, Marken, Paket-Scopes, Owner-Handles oder Namespaces sollten den Prozess [Organisations- und Namespace-Ansprüche](/clawhub/namespace-claims) verwenden, nicht den produktinternen Meldefluss oder das Konto-Einspruchsformular.

Verwenden Sie diesen Prozess, wenn ClawHub-Mitarbeiter nicht sensible Nachweise prüfen sollen, dass ein Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, aliasiert oder anderweitig geprüft werden sollte. Fügen Sie in einem öffentlichen Issue keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen, persönlichen Ausweisdokumente, API-Tokens oder DNS-Challenge-Tokens ein.

## Moderationssperren

Einige schwerwiegende Befunde oder Richtlinienprobleme können dazu führen, dass ein Herausgeber oder Eintrag unter eine Moderationssperre gestellt wird. In diesem Fall können betroffene Inhalte aus der öffentlichen Auffindbarkeit ausgeblendet werden, oder zukünftige Veröffentlichungen können bis zur Prüfung des Problems ausgeblendet beginnen.

Moderationssperren sollen Benutzer schützen, während ClawHub Fälle mit hohem Risiko klärt. Sie können auch aufgehoben werden, wenn ein Fehlalarm bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann zurückgehalten, ausgeblendet, unter Quarantäne gestellt, widerrufen oder auf öffentlichen Installationsoberflächen anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie das Release nicht, es sei denn, der Owner behebt das Problem oder die Moderation stellt es wieder her.

Owner können weiterhin Diagnosen für ihre eigenen zurückgehaltenen oder ausgeblendeten Einträge sehen. Diese Diagnosen erklären, was passiert ist und was sich ändern muss, bevor der Eintrag auf öffentliche Oberflächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen. Missbrauchsdrucksignale von Herausgebern werden täglich geprüft. Signale, die den Schwellenwert von ClawHub für eine mögliche Sperre erreichen, können eine automatische Warnung auslösen. Wenn der nächste zulässige Scan nach Ablauf der Warnfrist den Herausgeber weiterhin im Schwellenwert für eine mögliche Sperre einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden. Signale mit geringerer Sicherheit und zeitlich begrenzte Prüfsignale bleiben von automatischer Durchsetzung ausgeschlossen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine scanner-ausgelöste E-Mail eine Skill- oder Plugin-Version als bösartig benennt, laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter: `clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins `--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, beheben Sie den Eintrag, erhöhen Sie die Versionsnummer und laden Sie die behobene Version hoch.

## Hinweise für Herausgeber

Um Fehlalarme zu reduzieren und das Vertrauen der Benutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Testläufe vor der Veröffentlichung von Plugins
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Verhalten eines Releases fragen
