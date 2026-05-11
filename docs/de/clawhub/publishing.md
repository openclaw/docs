---
read_when:
    - Einen Skill oder ein Plugin veröffentlichen
    - Debugging von Fehlern im Owner- oder Paket-Scope
    - Veröffentlichungs-UI, CLI- oder Backend-Verhalten hinzufügen
summary: Wie die Veröffentlichung in ClawHub für Skills, Plugins, Owner, Scopes, Releases und Review funktioniert.
x-i18n:
    generated_at: "2026-05-11T20:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# Veröffentlichen

Das Veröffentlichen auf ClawHub ist nach Ownern gegliedert: Jede Veröffentlichung zielt auf einen Publisher, und der Server entscheidet, ob der angemeldete Benutzer dort veröffentlichen darf.

## Owner

Ein Owner ist ein ClawHub-Publisher-Handle, z. B. `@alice` oder `@openclaw`.
Persönliche Owner werden für Benutzer erstellt. Organisations-Owner können mehrere Mitglieder haben.

Beim Veröffentlichen verwenden Sie entweder Ihren persönlichen Owner oder wählen einen Organisations-Owner aus, für den Sie Publisher-Zugriff haben.

## Skills

Skills werden aus einem Skill-Ordner veröffentlicht. Die öffentliche Seite ist:

```text
https://clawhub.ai/<owner>/<slug>
```

Beispiel:

```text
https://clawhub.ai/alice/review-helper
```

Die Veröffentlichungsanfrage enthält den ausgewählten Owner, Slug, Version, Changelog und
Dateien. Der Server überprüft, ob der Akteur als dieser Owner veröffentlichen darf, bevor er
das Release erstellt.

Um einen bestehenden Skill beim Veröffentlichen einer neuen Version zu einem anderen Owner zu verschieben, wählen Sie
den neuen Owner aus und bestätigen Sie die Owner-Verschiebung ausdrücklich. In der CLI/API übergeben Sie
den Ziel-Owner plus die Migrationszustimmung:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Die Migration eines Skill-Owners erfordert Admin- oder Owner-Zugriff sowohl auf den aktuellen Owner
als auch auf den Ziel-Owner. Sie bewahrt den Skill, die Versionshistorie, Statistiken,
Kommentare, Forks, Aliase und Audit-Trail; alte Owner-URLs funktionieren weiterhin über den
Alias-/Redirect-Pfad.

## Plugins

Plugins verwenden Paketnamen im npm-Stil. Scoped-Paketnamen enthalten den Owner im
ersten Teil des Namens:

```text
@owner/package-name
```

Der Scope muss mit dem ausgewählten Veröffentlichungs-Owner übereinstimmen. Wenn Ihr Paket
`@openclaw/dronzer` heißt, kann es nur als `@openclaw` veröffentlicht werden. Wenn Sie als
`@vintageayu` veröffentlichen, benennen Sie das Paket in `@vintageayu/dronzer` um.

Dadurch wird verhindert, dass ein Paket einen Organisations-Namespace beansprucht, den der Publisher
nicht kontrolliert.

## Release-Ablauf

1. Die UI, CLI oder der GitHub-Workflow sammelt Paketmetadaten und Dateien.
2. Die Veröffentlichungsanfrage wird mit dem ausgewählten Owner an ClawHub gesendet.
3. Der Server validiert Owner-Berechtigungen, Paket-Scope, Paketnamen, Version,
   Dateigrenzen und Quellmetadaten.
4. ClawHub speichert das Release und startet automatisierte Sicherheitsprüfungen.
5. Neue Releases werden vor normalen Installations-/Download-Oberflächen verborgen, bis Review
   und Verifizierung abgeschlossen sind.

Wenn die Validierung fehlschlägt, wird das Release nicht erstellt.

## FAQ

### Paket-Scope muss mit ausgewähltem Owner übereinstimmen

Wenn Paket-Scope und ausgewählter Owner nicht übereinstimmen, lehnt ClawHub die
Veröffentlichung ab:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Um das zu beheben, wählen Sie entweder den Owner, der durch den Paket-Scope benannt wird, oder benennen Sie das
Paket so um, dass der Scope dem Owner entspricht, als den Sie veröffentlichen können.

Wenn der Paketname bereits den richtigen Scope hat, das Paket aber dem
falschen Publisher gehört, übertragen Sie stattdessen die Ownership:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Verwenden Sie Paket- oder Skill-Transfer nur, wenn Sie Admin-Zugriff sowohl auf den
aktuellen Owner als auch auf den Ziel-Publisher haben. Paket-Transfer erlaubt Ihnen nicht,
in einen Scope zu veröffentlichen, den Sie nicht verwalten können.

Dies schützt Organisations-Namespaces. Ein Paket namens `@openclaw/dronzer` beansprucht den
`@openclaw`-Namespace, daher können es nur Publisher mit Zugriff auf den `@openclaw`-Owner
veröffentlichen.
