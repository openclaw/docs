---
read_when:
    - Einen Skill oder ein Plugin veröffentlichen
    - Fehler bei Eigentümer- oder Paketbereichen debuggen
    - Veröffentlichungsverhalten für Benutzeroberfläche, CLI oder Backend hinzufügen
summary: So funktioniert die Veröffentlichung auf ClawHub für Skills, Plugins, Verantwortliche, Geltungsbereiche, Releases und Reviews.
x-i18n:
    generated_at: "2026-07-24T04:49:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 582dffaf4429e9f24d7c38f2809cc7dc05f8471e4ae2f9c6be60153cc8604e3f
    source_path: clawhub/publishing.md
    workflow: 16
---

# Veröffentlichen

Beim Veröffentlichen wird ein Skill-Ordner oder Plugin-Paket unter dem von Ihnen
ausgewählten Eigentümer an ClawHub gesendet. ClawHub prüft, ob Ihr Token für diesen Eigentümer veröffentlichen darf, validiert
Metadaten, Namen, Version, Dateien und Quellinformationen, speichert anschließend das Release
und startet automatisierte Sicherheitsprüfungen.

Wenn die Validierung fehlschlägt, wird nichts veröffentlicht. Neue Releases erscheinen möglicherweise auch erst nach
Abschluss der Überprüfung auf den regulären Installations- und Download-Oberflächen.

## Skills

Der einfachste Veröffentlichungsweg führt über die CLI. Melden Sie sich an und veröffentlichen Sie anschließend einen lokalen Skill-
Ordner:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Verwenden Sie `--owner <handle>`, wenn Sie unter einem Organisationseigentümer veröffentlichen. Lassen Sie die Angabe weg, um als
authentifizierter Benutzer zu veröffentlichen. Unveränderte Inhalte werden beim Veröffentlichen übersprungen. Ein neuer Skill beginnt
mit `1.0.0`, und spätere Änderungen veröffentlichen automatisch die nächste Patch-Version. Übergeben Sie
`--version` nur, wenn Sie eine explizite Version benötigen.

Verwenden Sie für Katalog-Repositorys den wiederverwendbaren
[`skill-publish.yml`-Workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
von ClawHub. Er ruft `skill publish` für jeden unmittelbar unter `root` liegenden Skill-Ordner auf (Standard:
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

Plugins verwenden Paketnamen im npm-Stil. Paketnamen mit Gültigkeitsbereich enthalten den Eigentümer im
ersten Teil des Namens:

```text
@owner/package-name
```

Der Gültigkeitsbereich muss dem ausgewählten Veröffentlichungseigentümer entsprechen. Wenn Ihr Paket
`@openclaw/dronzer` heißt, kann es nur als `@openclaw` veröffentlicht werden. Wenn Sie als
`@vintageayu` veröffentlichen, benennen Sie das Paket in `@vintageayu/dronzer` um.

Dadurch wird verhindert, dass ein Paket einen Organisationsnamensraum beansprucht, über den die veröffentlichende Person
keine Kontrolle hat.

Wenn Sie der rechtmäßige Eigentümer einer Organisation, Marke, eines Paket-Gültigkeitsbereichs, Eigentümernamens oder
Namensraums sind, der auf ClawHub bereits beansprucht oder reserviert ist, öffnen Sie ein
[Anliegen zur Beanspruchung einer Organisation/eines Namensraums](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
mit öffentlichen, nicht vertraulichen Nachweisen. Unter
[Beanspruchung von Organisationen und Namensräumen](/clawhub/namespace-claims) erfahren Sie, was Sie angeben und was Sie
aus öffentlichen Anliegen heraushalten sollten.

### Vor dem Veröffentlichen eines Plugins

- Wählen Sie einen Eigentümer, der dem Paket-Gültigkeitsbereich entspricht.
- Fügen Sie `openclaw.plugin.json` hinzu. Code-Plugins benötigen außerdem `package.json` mit
  `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`.
- Um auf der Startseite und den Plugin-Listenseiten ein benutzerdefiniertes Plugin-Katalogsymbol anzuzeigen,
  fügen Sie `icon` mit einer beliebigen HTTPS-Bild-URL zu `openclaw.plugin.json` hinzu.
- Geben Sie das Quell-Repository und die Metadaten des genauen Commits an oder verwenden Sie die CLI aus einem
  GitHub-basierten Checkout, damit sie diese erkennen kann.
- Führen Sie vor dem Veröffentlichen `clawhub package validate <source>` aus. Informationen zu Befunden bezüglich Paket,
  Manifest, SDK-Import oder Artefakt finden Sie unter
  [Korrekturen für die Plugin-Validierung](/clawhub/plugin-validation-fixes).
- Führen Sie `clawhub package publish <source> --dry-run` aus, bevor Sie ein Release erstellen.
- Rechnen Sie damit, dass neue Releases erst nach Abschluss der automatisierten
  Sicherheitsprüfungen und Verifizierung auf öffentlichen Installationsoberflächen erscheinen.

### Vertrauenswürdiges Veröffentlichen von Paketen

Das vertrauenswürdige Veröffentlichen von Paketen wird in zwei Schritten eingerichtet:

1. Veröffentlichen Sie das Paket einmal über das normale manuelle oder Token-authentifizierte
   `clawhub package publish`. Dadurch wird der Paketdatensatz erstellt und festgelegt,
   welche Paketverwalter die Konfiguration des vertrauenswürdigen Herausgebers ändern können.
2. Ein Paketverwalter legt die Konfiguration des vertrauenswürdigen Herausgebers für GitHub Actions fest:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Nachdem die Konfiguration festgelegt wurde, können zukünftige unterstützte Veröffentlichungen über GitHub Actions
OIDC beziehungsweise vertrauenswürdiges Veröffentlichen verwenden, ohne ein langlebiges ClawHub-Token im
Repository zu speichern. Das konfigurierte Repository und der Workflow-Dateiname müssen dem
GitHub-Actions-OIDC-Claim entsprechen. Wenn Sie zusätzlich `--environment <name>` übergeben, muss der GitHub-
Actions-Umgebungs-Claim exakt diesem Namen entsprechen.

ClawHub verifiziert das konfigurierte GitHub-Repository, wenn die Konfiguration des vertrauenswürdigen Herausgebers
festgelegt wird. Öffentliche Repositorys können anhand öffentlicher GitHub-Metadaten verifiziert werden.
Bei privaten Repositorys benötigt ClawHub GitHub-Zugriff auf das betreffende Repository,
beispielsweise durch eine zukünftige Installation der ClawHub GitHub App oder eine andere
autorisierte GitHub-Integration.

Der aktuelle wiederverwendbare Workflow zur Paketveröffentlichung unterstützt das geheimnislose vertrauenswürdige
Veröffentlichen für Veröffentlichungen mit `workflow_dispatch`, wenn `id-token: write`
verfügbar ist. Echte Veröffentlichungen durch Tag-Push benötigen weiterhin `clawhub_token`. Halten Sie daher
`CLAWHUB_TOKEN` für Tag-Releases, Erstveröffentlichungen, nicht vertrauenswürdige Pakete
oder Notfallveröffentlichungen verfügbar.

Prüfen oder entfernen Sie die Konfiguration mit:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Das Löschen der Konfiguration des vertrauenswürdigen Herausgebers dient als Rücksetzpfad. Es deaktiviert die zukünftige
Ausstellung vertrauenswürdiger Veröffentlichungstoken, bis ein Paketverwalter die Konfiguration erneut festlegt.

## Häufig gestellte Fragen

### Der Paket-Gültigkeitsbereich muss dem ausgewählten Eigentümer entsprechen

Wenn Paket-Gültigkeitsbereich und ausgewählter Eigentümer nicht übereinstimmen, lehnt ClawHub die
Veröffentlichung ab:

```text
Der Paket-Gültigkeitsbereich "@openclaw" muss dem ausgewählten Eigentümer "@vintageayu" entsprechen.
Veröffentlichen Sie als "@openclaw" oder benennen Sie dieses Paket in "@vintageayu/dronzer" um.
```

Um dies zu beheben, wählen Sie entweder den im Paket-Gültigkeitsbereich genannten Eigentümer oder benennen das
Paket so um, dass der Gültigkeitsbereich dem Eigentümer entspricht, unter dem Sie veröffentlichen dürfen.

Wenn der Paketname bereits den richtigen Gültigkeitsbereich hat, das Paket aber der
falschen veröffentlichenden Person gehört, übertragen Sie stattdessen das Eigentum:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Verwenden Sie die Übertragung von Paketen oder Skills nur, wenn Sie sowohl für den
aktuellen Eigentümer als auch den Zielherausgeber Administratorzugriff haben. Eine Paketübertragung ermöglicht es Ihnen nicht,
in einem Gültigkeitsbereich zu veröffentlichen, den Sie nicht verwalten können.

Wenn Sie keinen Zugriff auf den aktuellen Eigentümer haben, aber der Ansicht sind, dass Ihre Organisation, Ihr Projekt oder
Ihre Marke der rechtmäßige Eigentümer des Namensraums ist, öffnen Sie ein
[Anliegen zur Beanspruchung einer Organisation/eines Namensraums](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
mit öffentlichen, nicht vertraulichen Nachweisen zur Prüfung durch das Team. Lesen Sie vor dem Einreichen
[Beanspruchung von Organisationen und Namensräumen](/clawhub/namespace-claims).

Dies schützt Organisationsnamensräume. Ein Paket namens `@openclaw/dronzer` beansprucht den
Namensraum `@openclaw`, sodass nur Herausgeber mit Zugriff auf den Eigentümer `@openclaw`
es veröffentlichen können.
