---
read_when:
    - Skills veröffentlichen
    - Debugging von Veröffentlichungs-/Synchronisierungsfehlern
summary: Skill-Ordnerformat, erforderliche Dateien, zulässige Dateitypen, Grenzwerte.
x-i18n:
    generated_at: "2026-05-12T04:09:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill-Format

## Auf der Festplatte

Ein Skill ist ein Ordner.

Erforderlich:

- `SKILL.md` (oder `skill.md`)

Optional:

- beliebige unterstützende _textbasierte_ Dateien (siehe „Zulässige Dateien“)
- `.clawhubignore` (Ignoriermuster für Veröffentlichung/Synchronisierung, veraltet: `.clawdhubignore`)
- `.gitignore` (wird ebenfalls berücksichtigt)

Lokale Installationsmetadaten (von der CLI geschrieben):

- `<skill>/.clawhub/origin.json` (veraltet: `.clawdhub`)

Installationsstatus im Arbeitsverzeichnis (von der CLI geschrieben):

- `<workdir>/.clawhub/lock.json` (veraltet: `.clawdhub`)

## `SKILL.md`

- Markdown mit optionalem YAML-Frontmatter.
- Der Server extrahiert Metadaten beim Veröffentlichen aus dem Frontmatter.
- `description` wird als Skill-Zusammenfassung in der UI/Suche verwendet.

## Frontmatter-Metadaten

Skill-Metadaten werden im YAML-Frontmatter am Anfang Ihrer `SKILL.md` deklariert. Dies teilt der Registry (und der Sicherheitsanalyse) mit, was Ihr Skill zum Ausführen benötigt.

### Einfaches Frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Laufzeitmetadaten (`metadata.openclaw`)

Deklarieren Sie die Laufzeitanforderungen Ihres Skills unter `metadata.openclaw` (Aliasse: `metadata.clawdbot`, `metadata.clawdis`).

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

| Feld               | Typ        | Beschreibung                                                                                                                                                   |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Erforderliche Umgebungsvariablen, die Ihr Skill erwartet.                                                                                                      |
| `requires.bins`    | `string[]` | CLI-Binärdateien, die alle installiert sein müssen.                                                                                                           |
| `requires.anyBins` | `string[]` | CLI-Binärdateien, von denen mindestens eine vorhanden sein muss.                                                                                              |
| `requires.config`  | `string[]` | Pfade zu Konfigurationsdateien, die Ihr Skill liest.                                                                                                          |
| `primaryEnv`       | `string`   | Die wichtigste Anmeldeinformations-Umgebungsvariable für Ihren Skill.                                                                                         |
| `envVars`          | `array`    | Deklarationen von Umgebungsvariablen mit `name`, optionalem `required` und optionaler `description`. Setzen Sie `required: false` für optionale Env-Vars.     |
| `always`           | `boolean`  | Wenn `true`, ist der Skill immer aktiv (keine explizite Installation erforderlich).                                                                            |
| `skillKey`         | `string`   | Überschreibt den Aufrufschlüssel des Skills.                                                                                                                  |
| `emoji`            | `string`   | Anzeige-Emoji für den Skill.                                                                                                                                  |
| `homepage`         | `string`   | URL zur Homepage oder Dokumentation des Skills.                                                                                                               |
| `os`               | `string[]` | Betriebssystemeinschränkungen (z. B. `["macos"]`, `["linux"]`).                                                                                               |
| `install`          | `array`    | Installationsspezifikationen für Abhängigkeiten (siehe unten).                                                                                                |
| `nix`              | `object`   | Nix-Plugin-Spezifikation (siehe README).                                                                                                                      |
| `config`           | `object`   | Clawdbot-Konfigurationsspezifikation (siehe README).                                                                                                          |

### Installationsspezifikationen

Wenn Ihr Skill installierte Abhängigkeiten benötigt, deklarieren Sie diese im Array `install`:

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

Die Sicherheitsanalyse von ClawHub prüft, ob das, was Ihr Skill deklariert, zu dem passt, was er tatsächlich tut. Wenn Ihr Code auf `TODOIST_API_KEY` verweist, Ihr Frontmatter diese Variable aber nicht unter `requires.env`, `primaryEnv` oder `envVars` deklariert, markiert die Analyse dies als Metadatenabweichung. Genaue Deklarationen helfen Ihrem Skill, die Prüfung zu bestehen, und helfen Benutzern zu verstehen, was sie installieren.

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

## Zulässige Dateien

Nur „textbasierte“ Dateien werden beim Veröffentlichen akzeptiert.

- Die Erweiterungs-Allowlist befindet sich in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Skriptdateien werden nach dem Hochladen weiterhin gescannt; PowerShell-Dateien `.ps1`, `.psm1` und `.psd1` werden als Text akzeptiert.
- Inhaltstypen, die mit `text/` beginnen, werden als Text behandelt; zusätzlich gilt eine kleine Allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Grenzwerte (serverseitig):

- Gesamtgröße des Bundles: 50 MB.
- Einbettungstext umfasst `SKILL.md` + bis zu etwa 40 Nicht-`.md`-Dateien (Best-Effort-Obergrenze).

## Slugs

- Werden standardmäßig aus dem Ordnernamen abgeleitet.
- Müssen kleingeschrieben und URL-sicher sein: `^[a-z0-9][a-z0-9-]*$`.

## Versionierung + Tags

- Jede Veröffentlichung erstellt eine neue Version (Semver).
- Tags sind String-Zeiger auf eine Version; `latest` wird häufig verwendet.

## Lizenz

- Alle auf ClawHub veröffentlichten Skills sind unter `MIT-0` lizenziert.
- Jeder darf veröffentlichte Skills verwenden, ändern und weiterverbreiten, auch kommerziell.
- Namensnennung ist nicht erforderlich.
- Fügen Sie keine widersprüchlichen Lizenzbedingungen in `SKILL.md` hinzu; ClawHub unterstützt keine Lizenzüberschreibungen pro Skill.

## Bezahlte Skills

- ClawHub unterstützt keine bezahlten Skills, keine Preisgestaltung pro Skill, keine Paywalls und keine Umsatzbeteiligung.
- Fügen Sie keine Preismetadaten zu `SKILL.md` hinzu; sie sind nicht Teil des Skill-Formats und machen einen veröffentlichten Skill nicht kostenpflichtig.
- Wenn Ihr Skill in einen kostenpflichtigen Drittanbieterdienst integriert ist, dokumentieren Sie die externen Kosten und das erforderliche Konto klar in den Skill-Anweisungen und Env-Deklarationen (`requires.env` für erforderliche Variablen oder `envVars` mit `required: false` für optionale Variablen).
