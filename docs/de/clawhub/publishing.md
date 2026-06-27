---
read_when:
    - Einen Skill oder ein Plugin veröffentlichen
    - Fehler im Zusammenhang mit Owner- oder Paket-Scope debuggen
    - Veröffentlichungs-UI, CLI oder Backend-Verhalten hinzufügen
summary: So funktioniert die Veröffentlichung in ClawHub für Skills, Plugins, Verantwortliche, Geltungsbereiche, Releases und Review.
x-i18n:
    generated_at: "2026-06-27T17:16:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Veröffentlichung

Durch die Veröffentlichung wird ein Skill-Ordner oder ein Plugin-Paket unter dem von Ihnen
gewählten Owner an ClawHub gesendet. ClawHub prüft, ob Ihr Token für diesen Owner veröffentlichen darf, validiert
Metadaten, Name, Version, Dateien und Quellinformationen, speichert dann das Release
und startet automatisierte Sicherheitsprüfungen.

Wenn die Validierung fehlschlägt, wird nichts veröffentlicht. Neue Releases bleiben möglicherweise auch außerhalb der
normalen Installations- und Download-Oberflächen, bis die Prüfung abgeschlossen ist.

## Skills

Der einfachste Veröffentlichungsweg ist die CLI. Melden Sie sich an und veröffentlichen Sie dann einen lokalen Skill-Ordner:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Verwenden Sie `--owner <handle>`, wenn Sie unter einem Organisations-Owner veröffentlichen. Lassen Sie es weg, um als
authentifizierter Benutzer zu veröffentlichen. Beim Veröffentlichen werden unveränderte Inhalte übersprungen. Ein neuer Skill beginnt
bei `1.0.0`, und spätere Änderungen veröffentlichen automatisch die nächste Patch-Version. Übergeben Sie
`--version` nur, wenn Sie eine explizite Version benötigen.

Für Katalog-Repos verwenden Sie ClawHubs wiederverwendbaren
[`skill-publish.yml`-Workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Er ruft `skill publish` für jeden direkten Skill-Ordner unter `root` auf (Standard:
`skills`) oder nur für den als `skill_path` angegebenen Ordner.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Verwenden Sie `dry_run: true`, um neue und geänderte Skills vorab anzuzeigen, ohne sie zu veröffentlichen.

## Plugins

Plugins verwenden Paketnamen im npm-Stil. Paketnamen mit Scope enthalten den Owner im
ersten Teil des Namens:

```text
@owner/package-name
```

Der Scope muss mit dem ausgewählten Veröffentlichungs-Owner übereinstimmen. Wenn Ihr Paket
`@openclaw/dronzer` heißt, kann es nur als `@openclaw` veröffentlicht werden. Wenn Sie als
`@vintageayu` veröffentlichen, benennen Sie das Paket in `@vintageayu/dronzer` um.

Das verhindert, dass ein Paket einen Organisations-Namespace beansprucht, den der Herausgeber
nicht kontrolliert.

Wenn Sie der rechtmäßige Owner einer Organisation, Marke, eines Paket-Scopes, Owner-Handles oder
Namespaces sind, der auf ClawHub bereits beansprucht oder reserviert ist, öffnen Sie ein
[Issue für Organisations-/Namespace-Anspruch](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
mit öffentlichen, nicht sensiblen Nachweisen. Unter
[Organisations- und Namespace-Ansprüche](/de/clawhub/namespace-claims) erfahren Sie, was Sie angeben und was
Sie aus öffentlichen Issues heraushalten sollten.

### Vor dem Veröffentlichen eines Plugins

- Wählen Sie einen Owner, der zum Paket-Scope passt.
- Fügen Sie `openclaw.plugin.json` hinzu. Code-Plugins benötigen außerdem `package.json` mit
  `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`.
- Um ein eigenes Plugin-Kartensymbol anzuzeigen, fügen Sie `icon` mit
  einer beliebigen HTTPS-Bild-URL zu `openclaw.plugin.json` hinzu.
- Fügen Sie das Quell-Repository und genaue Commit-Metadaten hinzu, oder verwenden Sie die CLI aus einem
  GitHub-basierten Checkout, damit sie diese erkennen kann.
- Führen Sie vor dem Veröffentlichen `clawhub package validate <source>` aus. Für Befunde zu Paket,
  Manifest, SDK-Import oder Artefakten siehe
  [Korrekturen für Plugin-Validierung](/de/clawhub/plugin-validation-fixes).
- Führen Sie `clawhub package publish <source> --dry-run` aus, bevor Sie ein Release erstellen.
- Rechnen Sie damit, dass neue Releases außerhalb öffentlicher Installationsoberflächen bleiben, bis automatisierte
  Sicherheitsprüfungen und die Verifizierung abgeschlossen sind.

### Vertrauenswürdige Veröffentlichung für Pakete

Die vertrauenswürdige Veröffentlichung von Paketen ist eine Einrichtung in zwei Schritten:

1. Veröffentlichen Sie das Paket einmal über normales manuelles oder tokenauthentifiziertes
   `clawhub package publish`. Dadurch wird der Paketdatensatz erstellt und es werden die
   Paketmanager festgelegt, die seine Konfiguration für vertrauenswürdige Herausgeber ändern können.
2. Ein Paketmanager legt die Konfiguration für vertrauenswürdige Herausgeber in GitHub Actions fest:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Nachdem die Konfiguration festgelegt wurde, können zukünftige unterstützte Veröffentlichungen über GitHub Actions
OIDC/vertrauenswürdige Veröffentlichung verwenden, ohne ein langlebiges ClawHub-Token im
Repository zu speichern. Das konfigurierte Repository und der Workflow-Dateiname müssen mit dem
OIDC-Claim von GitHub Actions übereinstimmen. Wenn Sie zusätzlich `--environment <name>` übergeben, muss der
GitHub-Actions-Environment-Claim exakt diesem Namen entsprechen.

ClawHub verifiziert das konfigurierte GitHub-Repository, wenn die Konfiguration für vertrauenswürdige Herausgeber
festgelegt wird. Öffentliche Repositories können über öffentliche GitHub-Metadaten verifiziert werden.
Private Repositories erfordern, dass ClawHub GitHub-Zugriff auf dieses Repository hat,
zum Beispiel über eine zukünftige Installation der ClawHub GitHub App oder eine andere
autorisierte GitHub-Integration.

Der aktuelle wiederverwendbare Workflow zum Veröffentlichen von Paketen unterstützt geheimefreie vertrauenswürdige
Veröffentlichung für Veröffentlichungen über `workflow_dispatch`, wenn `id-token: write`
verfügbar ist. Echte Veröffentlichungen per Tag-Push benötigen weiterhin `clawhub_token`; halten Sie daher
`CLAWHUB_TOKEN` für Tag-Releases, Erstveröffentlichungen, nicht vertrauenswürdige Pakete
oder Notfall-Veröffentlichungen verfügbar.

Prüfen oder entfernen Sie die Konfiguration mit:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Das Löschen der Konfiguration für vertrauenswürdige Herausgeber ist der Rollback-Weg. Es deaktiviert zukünftige
Token-Erstellung für vertrauenswürdige Veröffentlichungen, bis ein Paketmanager die Konfiguration erneut festlegt.

## FAQ

### Paket-Scope muss mit ausgewähltem Owner übereinstimmen

Wenn Paket-Scope und ausgewählter Owner nicht übereinstimmen, lehnt ClawHub die
Veröffentlichung ab:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Um das zu beheben, wählen Sie entweder den durch den Paket-Scope benannten Owner aus, oder benennen Sie das
Paket um, sodass der Scope zu dem Owner passt, als der Sie veröffentlichen können.

Wenn der Paketname bereits den richtigen Scope hat, das Paket aber dem falschen Herausgeber gehört,
übertragen Sie stattdessen die Ownership:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Verwenden Sie die Übertragung von Paketen oder Skills nur, wenn Sie Admin-Zugriff sowohl auf den
aktuellen Owner als auch auf den Ziel-Herausgeber haben. Mit einer Paketübertragung können Sie nicht
in einem Scope veröffentlichen, den Sie nicht verwalten können.

Wenn Sie keinen Zugriff auf den aktuellen Owner haben, aber glauben, dass Ihre Organisation, Ihr Projekt oder
Ihre Marke der rechtmäßige Namespace-Owner ist, öffnen Sie ein
[Issue für Organisations-/Namespace-Anspruch](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
mit öffentlichen, nicht sensiblen Nachweisen zur Prüfung durch das Team. Lesen Sie vor dem Einreichen
[Organisations- und Namespace-Ansprüche](/de/clawhub/namespace-claims).

Dies schützt Organisations-Namespaces. Ein Paket namens `@openclaw/dronzer` beansprucht den
Namespace `@openclaw`, daher können nur Herausgeber mit Zugriff auf den Owner `@openclaw`
es veröffentlichen.
