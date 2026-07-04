---
read_when:
    - Melden eines Skills, Plugins oder Pakets
    - Wiederherstellung nach einer zurückgehaltenen, ausgeblendeten oder blockierten Listung
    - ClawHub-Moderation, Sperren oder Kontostatus verstehen
sidebarTitle: Moderation and Account Safety
summary: Wie ClawHub Meldungen, Moderationssperren, ausgeblendete Listings, Sperren und den Kontostatus handhabt.
title: Moderation und Kontosicherheit
x-i18n:
    generated_at: "2026-07-04T15:14:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderation und Kontosicherheit

ClawHub ist offen für Veröffentlichungen, aber öffentliche Auffindbarkeit und Installationsflächen
benötigen weiterhin Leitplanken. Meldungen, Moderationssperren, ausgeblendete Einträge und Kontomaßnahmen
helfen, Nutzer zu schützen, wenn eine Veröffentlichung oder ein Konto unsicher, irreführend oder nicht
richtlinienkonform erscheint.

Diese Seite behandelt Moderation und Kontostatus. Informationen zu Audit-Labels wie
`Pass`, `Review`, `Warn`, `Malicious` und Risikostufe finden Sie unter
[Security Audits](/clawhub/security-audits).

Siehe auch [Security](/clawhub/security) und
[Acceptable usage](/clawhub/acceptable-usage). Bei Bedenken zu Urheberrecht oder anderen
Inhaltsrechten verwenden Sie [Content Rights Requests](/clawhub/content-rights).

## Meldungen

Angemeldete Nutzer können Skills, Plugins und Pakete melden.

Verwenden Sie ClawHub-Meldungen nur für unsichere Marketplace-Inhalte, zum Beispiel:

- schädliche Einträge
- irreführende Metadaten
- nicht deklarierte Anmeldedaten oder Berechtigungsanforderungen
- verdächtige Installationsanweisungen
- Identitätsnachahmung
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen [Acceptable usage](/clawhub/acceptable-usage) verstoßen

Verwenden Sie die Schaltfläche **Skill melden** auf einer Skill-Seite oder den Meldebefehl
bzw. die Melde-API für Pakete.

Verwenden Sie ClawHub-Meldungen nicht für Sicherheitslücken im eigenen Quellcode eines
Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt dem Publisher oder dem im Eintrag
verlinkten Quell-Repository. ClawHub wartet oder patcht keinen Code von Drittanbieter-Skills
oder -Plugins.

GitHub Security Advisories für `openclaw/clawhub` sind für Sicherheitslücken in
ClawHub selbst vorgesehen. Beispiele sind Fehler in Website, API, CLI, Registry, Auth,
Scanning, Moderation oder Vertrauensgrenzen beim Download bzw. bei der Installation. Verwenden Sie
ClawHub-Advisories nicht für Sicherheitslücken in Drittanbieter-Skills oder -Plugins.

Gute Meldungen sind konkret und umsetzbar. Missbrauch des Meldeverfahrens kann selbst zu
Kontomaßnahmen führen.

## Organisations- und Namespace-Ansprüche

Streitigkeiten über Organisations-, Marken-, Paket-Scope-, Owner-Handle- oder Namespace-Eigentum sollten
das Verfahren [Org and Namespace Claims](/clawhub/namespace-claims) verwenden, nicht den
produktinternen Meldefluss oder das Konto-Einspruchsformular.

Verwenden Sie dieses Verfahren, wenn ClawHub-Mitarbeitende nicht sensible Nachweise prüfen sollen, dass ein
Namespace reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen
oder anderweitig geprüft werden sollte. Fügen Sie keine Geheimnisse, privaten Dokumente, privaten Rechtsunterlagen,
persönlichen Ausweisdokumente, API-Token oder DNS-Challenge-Token in ein öffentliches Issue ein.

## Moderationssperren

Einige schwerwiegende Feststellungen oder Richtlinienprobleme können einen Publisher oder Eintrag unter eine
Moderationssperre stellen. Wenn dies geschieht, können betroffene Inhalte aus der öffentlichen Auffindbarkeit
ausgeblendet werden, oder künftige Veröffentlichungen können bis zur Prüfung des Problems zunächst ausgeblendet starten.

Moderationssperren sollen Nutzer schützen, während ClawHub Hochrisikofälle klärt.
Sie können auch aufgehoben werden, wenn ein falsch positives Ergebnis bestätigt wird.

## Ausgeblendete oder blockierte Einträge

Ein Eintrag kann gesperrt, ausgeblendet, unter Quarantäne gestellt, widerrufen oder auf
öffentlichen Installationsflächen anderweitig nicht verfügbar sein.

Wenn Sie einen dieser Zustände sehen, installieren Sie die Veröffentlichung nicht, es sei denn, der Owner
behebt das Problem oder die Moderation stellt sie wieder her.

Owner können weiterhin Diagnosen für ihre eigenen gesperrten oder ausgeblendeten Einträge sehen. Diese
Diagnosen erklären, was passiert ist und was geändert werden muss, bevor der
Eintrag auf öffentliche Flächen zurückkehren kann.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann
zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen.
Drucksignale für Publisher-Missbrauch werden täglich geprüft. Signale, die den potenziellen Sperrschwellenwert
von ClawHub erreichen, können eine automatische Warnung auslösen. Wenn der nächste
berechtigte Scan nach Ablauf der Warnfrist den Publisher weiterhin im
potenziellen Sperrschwellenwert einordnet, kann ClawHub die Kontomaßnahme automatisch anwenden.
Weniger sichere und zeitlich begrenzte Prüfsignale bleiben von der automatischen
Durchsetzung ausgenommen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn CLI-Auth
nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den
Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff durch eine Sperre oder ein deaktiviertes Konto
blockiert ist, verwenden Sie das [ClawHub-Einspruchsformular](https://appeals.openclaw.ai/) für eine Wiederherstellungsprüfung.

Wenn eine scanner-ausgelöste E-Mail eine Skill- oder Plugin-Version als schädlich bezeichnet,
laden Sie die gespeicherten Scan-Ergebnisse für die blockierte eingereichte Version herunter:
`clawhub scan download <slug> --version <version>`. Fügen Sie für Plugins
`--kind plugin` hinzu. Prüfen Sie die Scan-Ausgabe, beheben Sie den Eintrag, erhöhen Sie die Versionsnummer
und laden Sie die korrigierte Version hoch.

## Hinweise für Publisher

Um falsch positive Ergebnisse zu reduzieren und das Vertrauen der Nutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Probeläufe vor der Veröffentlichung von Plugins
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Verhalten einer Veröffentlichung fragen
