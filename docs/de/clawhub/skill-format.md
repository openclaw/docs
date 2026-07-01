---
read_when:
    - Veröffentlichen von Skills
    - Veröffentlichungsfehler debuggen
summary: Format des Skill-Ordners, erforderliche Dateien, zulässige Dateitypen, Grenzwerte.
x-i18n:
    generated_at: "2026-07-01T07:59:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill-Format

## Auf dem Datenträger

Ein Skill ist ein Ordner.

Erforderlich:

- `SKILL.md` (oder `skill.md`; das ältere `skills.md` wird ebenfalls akzeptiert)

Optional:

- beliebige unterstützende _textbasierte_ Dateien (siehe „Erlaubte Dateien“)
- `.clawhubignore` (Ignoriermuster für die Veröffentlichung, älter: `.clawdhubignore`)
- `.gitignore` (wird ebenfalls berücksichtigt)

## GitHub-Import

Der Web-GitHub-Importer ist strenger als lokales Veröffentlichen/Synchronisieren. Er erkennt nur
`SKILL.md`- oder ältere `skills.md`-Dateien in öffentlichen, nicht geforkten Repositories, die dem
angemeldeten GitHub-Konto gehören. Er importiert keine privaten Repos, Forks,
archivierten/deaktivierten Repos oder öffentlichen Repos von Drittanbietern.

Lokale Installationsmetadaten (von der CLI geschrieben):

- `<skill>/.clawhub/origin.json` (älter: `.clawdhub`)

Workdir-Installationsstatus (von der CLI geschrieben):

- `<workdir>/.clawhub/lock.json` (älter: `.clawdhub`)

## `SKILL.md`

- Markdown mit optionalem YAML-Frontmatter.
- Der Server extrahiert beim Veröffentlichen Metadaten aus dem Frontmatter.
- `description` wird als Skill-Zusammenfassung in UI/Suche verwendet.

## Frontmatter-Metadaten

Skill-Metadaten werden im YAML-Frontmatter am Anfang Ihrer `SKILL.md` deklariert. Das teilt der Registry (und der Sicherheitsanalyse) mit, was Ihr Skill zur Ausführung benötigt.

### Einfaches Frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Laufzeitmetadaten (`metadata.openclaw`)

Deklarieren Sie die Laufzeitanforderungen Ihres Skills unter `metadata.openclaw` (Aliase: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Verwenden Sie `requires.env` für Umgebungsvariablen, die vorhanden sein müssen, bevor der Skill ausgeführt werden kann. Verwenden Sie `envVars`, wenn Sie Metadaten pro Variable benötigen, einschließlich optionaler Variablen mit `required: false`.

### Vollständige Feldreferenz

| Feld               | Typ        | Beschreibung                                                                                                                                                  |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Erforderliche Umgebungsvariablen, die Ihr Skill erwartet.                                                                                                      |
| `requires.bins`    | `string[]` | CLI-Binärdateien, die alle installiert sein müssen.                                                                                                           |
| `requires.anyBins` | `string[]` | CLI-Binärdateien, von denen mindestens eine vorhanden sein muss.                                                                                               |
| `requires.config`  | `string[]` | Pfade zu Konfigurationsdateien, die Ihr Skill liest.                                                                                                          |
| `primaryEnv`       | `string`   | Die wichtigste Anmeldeinformations-Umgebungsvariable für Ihren Skill.                                                                                         |
| `envVars`          | `array`    | Deklarationen von Umgebungsvariablen mit `name`, optionalem `required` und optionaler `description`. Setzen Sie `required: false` für optionale Env-Variablen. |
| `always`           | `boolean`  | Wenn `true`, ist der Skill immer aktiv (keine explizite Installation erforderlich).                                                                            |
| `skillKey`         | `string`   | Überschreibt den Aufrufschlüssel des Skills.                                                                                                                  |
| `emoji`            | `string`   | Anzeige-Emoji für den Skill.                                                                                                                                  |
| `homepage`         | `string`   | URL zur Homepage oder Dokumentation des Skills.                                                                                                               |
| `os`               | `string[]` | Betriebssystemeinschränkungen (z. B. `["macos"]`, `["linux"]`).                                                                                               |
| `install`          | `array`    | Installationsspezifikationen für Abhängigkeiten (siehe unten).                                                                                                |
| `nix`              | `object`   | Nix-Plugin-Spezifikation (siehe README).                                                                                                                      |
| `config`           | `object`   | Clawdbot-Konfigurationsspezifikation (siehe README).                                                                                                          |

### Installationsspezifikationen

Wenn Ihr Skill installierte Abhängigkeiten benötigt, deklarieren Sie sie im Array `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Unterstützte Installationsarten: `brew`, `node`, `go`, `uv`.

### Optionale Umgebungsvariablen

Deklarieren Sie optionale Umgebungsvariablen unter `metadata.openclaw.envVars` und setzen Sie `required: false`. Fügen Sie optionale Einträge nicht zu `requires.env` hinzu, da `requires.env` bedeutet, dass der Skill ohne sie nicht ausgeführt werden kann.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Warum das wichtig ist

Die Sicherheitsanalyse von ClawHub prüft, ob das, was Ihr Skill deklariert, mit dem übereinstimmt, was er tatsächlich tut. Wenn Ihr Code auf `TODOIST_API_KEY` verweist, Ihr Frontmatter sie aber nicht unter `requires.env`, `primaryEnv` oder `envVars` deklariert, markiert die Analyse dies als Metadatenabweichung. Korrekte Deklarationen helfen Ihrem Skill, die Prüfung zu bestehen, und helfen Benutzern zu verstehen, was sie installieren.

### Beispiel: vollständiges Frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Erlaubte Dateien

Nur „textbasierte“ Dateien werden bei der Veröffentlichung akzeptiert.

- Die Erweiterungs-Allowlist befindet sich in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Skriptdateien werden nach dem Upload weiterhin gescannt; PowerShell-Dateien `.ps1`, `.psm1` und `.psd1` werden als Text akzeptiert.
- Inhaltstypen, die mit `text/` beginnen, werden als Text behandelt; zusätzlich gibt es eine kleine Allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limits (serverseitig):

- Gesamtgröße des Bundles: 50 MB.
- Einbettungstext enthält `SKILL.md` + bis zu ca. 40 Nicht-`.md`-Dateien (Best-Effort-Obergrenze).

## Slugs

- Werden standardmäßig aus dem Ordnernamen abgeleitet.
- Package-Scopes müssen exakt mit dem ClawHub-Publisher-Handle übereinstimmen. Publisher-Handles können Kleinbuchstaben, Zahlen, Bindestriche, Punkte und Unterstriche verwenden; sie müssen mit einem Kleinbuchstaben oder einer Zahl beginnen und enden.
- Package-Slugs müssen kleingeschrieben und npm-sicher sein, zum Beispiel `@example.tools/demo-plugin` oder `demo-plugin`.

## Versionierung + Tags

- Jede Veröffentlichung erstellt eine neue Version (semver).
- Tags sind String-Zeiger auf eine Version; `latest` wird häufig verwendet.

## Lizenz

- Alle auf ClawHub veröffentlichten Skills sind unter `MIT-0` lizenziert.
- Jede Person darf veröffentlichte Skills verwenden, ändern und weiterverteilen, auch kommerziell.
- Namensnennung ist nicht erforderlich.
- Fügen Sie in `SKILL.md` keine widersprüchlichen Lizenzbedingungen hinzu; ClawHub unterstützt keine lizenzspezifischen Überschreibungen pro Skill.

## Kostenpflichtige Skills

- ClawHub unterstützt keine kostenpflichtigen Skills, Preise pro Skill, Paywalls oder Umsatzbeteiligung.
- Fügen Sie `SKILL.md` keine Preismetadaten hinzu; sie sind nicht Teil des Skill-Formats und machen einen veröffentlichten Skill nicht kostenpflichtig.
- Wenn Ihr Skill in einen kostenpflichtigen Drittanbieterdienst integriert ist, dokumentieren Sie die externen Kosten und das erforderliche Konto klar in den Skill-Anweisungen und Env-Deklarationen (`requires.env` für erforderliche Variablen oder `envVars` mit `required: false` für optionale Variablen).
