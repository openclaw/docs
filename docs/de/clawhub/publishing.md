---
read_when:
    - Einen Skill oder ein Plugin veröffentlichen
    - Debuggen von Owner- oder Paket-Scope-Fehlern
    - Hinzufügen von Veröffentlichungsoberfläche, CLI- oder Backend-Verhalten
summary: So funktioniert das Veröffentlichen über ClawHub für Skills, Plugins, Owner, Scopes, Releases und Reviews.
x-i18n:
    generated_at: "2026-05-10T19:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# Veröffentlichen

ClawHub-Veröffentlichungen sind auf Eigentümer begrenzt: Jede Veröffentlichung zielt auf einen Veröffentlicher, und der
Server entscheidet, ob der angemeldete Benutzer dort veröffentlichen darf.

## Eigentümer

Ein Eigentümer ist eine ClawHub-Veröffentlicherkennung, zum Beispiel `@alice` oder `@openclaw`.
Persönliche Eigentümer werden für Benutzer erstellt. Organisationseigentümer können mehrere Mitglieder haben.

Wenn Sie veröffentlichen, verwenden Sie entweder Ihren persönlichen Eigentümer oder wählen einen Organisationseigentümer,
bei dem Sie Veröffentlichungszugriff haben.

## Skills

Skills werden aus einem Skill-Ordner veröffentlicht. Die öffentliche Seite ist:

```text
https://clawhub.ai/<owner>/<slug>
```

Beispiel:

```text
https://clawhub.ai/alice/review-helper
```

Die Veröffentlichungsanfrage enthält den ausgewählten Eigentümer, Slug, die Version, das Changelog und
Dateien. Der Server überprüft, ob der Akteur als dieser Eigentümer veröffentlichen darf, bevor er
das Release erstellt.

Um einen vorhandenen Skill beim Veröffentlichen einer neuen Version zu einem anderen Eigentümer zu verschieben, wählen Sie
den neuen Eigentümer und bestätigen Sie den Eigentümerwechsel ausdrücklich. Über CLI/API übergeben Sie den
Ziel-Eigentümer plus die Zustimmung zur Migration:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Die Migration eines Skill-Eigentümers erfordert Administrator- oder Eigentümerzugriff sowohl beim aktuellen Eigentümer
als auch beim Ziel-Eigentümer. Sie erhält den Skill, die Versionshistorie, Statistiken,
Kommentare, Forks, Aliase und den Audit-Trail; alte Eigentümer-URLs funktionieren weiterhin über den
Alias-/Weiterleitungspfad.

## Plugins

Plugins verwenden Paketnamen im npm-Stil. Paketnamen mit Scope enthalten den Eigentümer im
ersten Teil des Namens:

```text
@owner/package-name
```

Der Scope muss mit dem ausgewählten Veröffentlichungseigentümer übereinstimmen. Wenn Ihr Paket
`@openclaw/dronzer` heißt, kann es nur als `@openclaw` veröffentlicht werden. Wenn Sie als
`@vintageayu` veröffentlichen, benennen Sie das Paket in `@vintageayu/dronzer` um.

Dies verhindert, dass ein Paket einen Organisations-Namensraum beansprucht, den der Veröffentlicher nicht
kontrolliert.

## Release-Ablauf

1. Die UI, CLI oder der GitHub-Workflow sammelt Paketmetadaten und Dateien.
2. Die Veröffentlichungsanfrage wird mit dem ausgewählten Eigentümer an ClawHub gesendet.
3. Der Server validiert Eigentümerberechtigungen, Paket-Scope, Paketnamen, Version,
   Dateigrenzwerte und Quellmetadaten.
4. ClawHub speichert das Release und startet automatisierte Sicherheitsprüfungen.
5. Neue Releases werden von normalen Installations-/Download-Oberflächen ausgeblendet, bis Überprüfung
   und Verifizierung abgeschlossen sind.

Wenn die Validierung fehlschlägt, wird das Release nicht erstellt.

## FAQ

### Paket-Scope muss mit ausgewähltem Eigentümer übereinstimmen

Wenn Paket-Scope und ausgewählter Eigentümer nicht übereinstimmen, lehnt ClawHub die
Veröffentlichung ab:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Um das zu beheben, wählen Sie entweder den durch den Paket-Scope benannten Eigentümer oder benennen Sie das
Paket so um, dass der Scope mit dem Eigentümer übereinstimmt, als der Sie veröffentlichen dürfen.

Wenn der Paketname bereits den richtigen Scope hat, das Paket aber dem falschen
Veröffentlicher gehört, übertragen Sie stattdessen die Eigentümerschaft:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Verwenden Sie Paketübertragung nur, wenn Sie Administratorzugriff sowohl auf den aktuellen Paket-
Eigentümer als auch auf den Ziel-Veröffentlicher haben. Damit können Sie nicht in einem Scope veröffentlichen, den Sie
nicht verwalten dürfen.

Dies schützt Organisations-Namensräume. Ein Paket namens `@openclaw/dronzer` beansprucht den
Namensraum `@openclaw`, daher können nur Veröffentlicher mit Zugriff auf den Eigentümer `@openclaw`
es veröffentlichen.
