---
read_when:
    - Skills veröffentlichen
    - Fehler bei der Veröffentlichung debuggen
summary: Format des Skills-Ordners, erforderliche Dateien, unterstützende Artefakte, Beschränkungen.
x-i18n:
    generated_at: "2026-07-24T03:41:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fdf16a589b8961ccd9181a53a9fa92a358952b9147d22eaf977f23e0b4b4d653
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill-Format

## Auf dem Datenträger

Ein Skill ist ein Ordner.

Erforderlich:

- `SKILL.md` (oder `skill.md`; das veraltete `skills.md` wird ebenfalls akzeptiert)

Optional:

- beliebige unterstützende reguläre Dateien (siehe „Skill-Dateien“)
- `.clawhubignore` (Ignoriermuster für die Veröffentlichung, veraltet: `.clawdhubignore`)
- `.gitignore` (wird ebenfalls berücksichtigt)

## GitHub-Import

Der GitHub-Importer im Web ist strenger als die lokale Veröffentlichung/Synchronisierung. Er erkennt nur
`SKILL.md`- oder veraltete `skills.md`-Dateien in öffentlichen Repositorys ohne Fork-Status, die dem
angemeldeten GitHub-Konto gehören. Er importiert keine privaten Repositorys, Forks,
archivierten/deaktivierten Repositorys oder öffentlichen Repositorys Dritter.

Lokale Installationsmetadaten (von der CLI geschrieben):

- `<skill>/.clawhub/origin.json` (veraltet: `.clawdhub`)

Installationsstatus des Arbeitsverzeichnisses (von der CLI geschrieben):

- `<workdir>/.clawhub/lock.json` (veraltet: `.clawdhub`)

## `SKILL.md`

- Markdown mit optionalem YAML-Frontmatter.
- Der Server extrahiert während der Veröffentlichung Metadaten aus dem Frontmatter.
- `description` wird als Skill-Zusammenfassung in der Benutzeroberfläche/Suche verwendet.

Für portable Agent Skills sollte `name` mit dem übergeordneten Verzeichnis übereinstimmen und
1–64 Kleinbuchstaben, Ziffern oder Bindestriche verwenden. ClawHub verwaltet den routingfähigen Slug und
den Anzeigenamen im Katalog getrennt, sodass vorhandene Namen aus anderen Clients weiterhin
veröffentlicht und nicht stillschweigend umgeschrieben werden. Kataloglisten können lange Namen
visuell kürzen, ohne den gespeicherten Namen zu ändern.

## Frontmatter-Metadaten

Skill-Metadaten werden im YAML-Frontmatter am Anfang Ihrer `SKILL.md` deklariert. Dadurch erfährt die Registry (und die Sicherheitsanalyse), was Ihr Skill zur Ausführung benötigt.

### Grundlegendes Frontmatter

```yaml
---
name: my-skill
description: Kurze Zusammenfassung der Funktion dieses Skills.
version: 1.0.0
---
```

### Laufzeitmetadaten (`metadata.openclaw`)

Deklarieren Sie die Laufzeitanforderungen Ihres Skills unter `metadata.openclaw` (Aliasse: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Aufgaben über die Todoist-API verwalten.
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

Verwenden Sie `requires.env` für Umgebungsvariablen, die vorhanden sein müssen, bevor der Skill ausgeführt werden kann. Verwenden Sie `envVars`, wenn Sie Metadaten für einzelne Variablen benötigen, einschließlich optionaler Variablen mit `required: false`.

### Vollständige Feldreferenz

| Feld               | Typ        | Beschreibung                                                                                                                                 |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Erforderliche Umgebungsvariablen, die Ihr Skill erwartet.                                                                                    |
| `requires.bins`    | `string[]` | CLI-Binärdateien, die alle installiert sein müssen.                                                                                          |
| `requires.anyBins` | `string[]` | CLI-Binärdateien, von denen mindestens eine vorhanden sein muss.                                                                             |
| `requires.config`  | `string[]` | Pfade zu Konfigurationsdateien, die Ihr Skill liest.                                                                                         |
| `primaryEnv`       | `string`   | Die primäre Umgebungsvariable für Anmeldedaten Ihres Skills.                                                                                 |
| `envVars`          | `array`    | Deklarationen von Umgebungsvariablen mit `name`, optionalem `required` und optionalem `description`. Legen Sie `required: false` für optionale Umgebungsvariablen fest. |
| `always`           | `boolean`  | Wenn `true`, ist der Skill immer aktiv (keine explizite Installation erforderlich).                                                        |
| `skillKey`         | `string`   | Überschreibt den Aufrufschlüssel des Skills.                                                                                                 |
| `emoji`            | `string`   | Anzeige-Emoji für den Skill.                                                                                                                 |
| `homepage`         | `string`   | URL zur Homepage oder Dokumentation des Skills.                                                                                              |
| `os`               | `string[]` | Betriebssystemeinschränkungen (z. B. `["macos"]`, `["linux"]`).                                                                           |
| `install`          | `array`    | Installationsspezifikationen für Abhängigkeiten (siehe unten).                                                                               |
| `nix`              | `object`   | Nix-Plugin-Spezifikation (siehe README).                                                                                                     |
| `config`           | `object`   | Clawdbot-Konfigurationsspezifikation (siehe README).                                                                                         |

### Installationsspezifikationen

Wenn für Ihren Skill Abhängigkeiten installiert werden müssen, deklarieren Sie diese im Array `install`:

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

Deklarieren Sie optionale Umgebungsvariablen unter `metadata.openclaw.envVars` und legen Sie `required: false` fest. Fügen Sie `requires.env` keine optionalen Einträge hinzu, da `requires.env` bedeutet, dass der Skill ohne sie nicht ausgeführt werden kann.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist-API-Token für authentifizierte Anfragen.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optionale Standardprojekt-ID, wenn keine angegeben wird.
```

### Warum dies wichtig ist

Die Sicherheitsanalyse von ClawHub überprüft, ob die Deklarationen Ihres Skills mit seinem tatsächlichen Verhalten übereinstimmen. Wenn Ihr Code auf `TODOIST_API_KEY` verweist, das Frontmatter es jedoch nicht unter `requires.env`, `primaryEnv` oder `envVars` deklariert, kennzeichnet die Analyse dies als Metadatenabweichung. Korrekte Deklarationen helfen Ihrem Skill, die Prüfung zu bestehen, und vermitteln Benutzern, was sie installieren.

### Beispiel: vollständiges Frontmatter

```yaml
---
name: todoist-cli
description: Todoist-Aufgaben, -Projekte und -Labels über die Befehlszeile verwalten.
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
        description: Todoist-API-Token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optionale Standardprojekt-ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Skill-Dateien

Bei der Veröffentlichung werden unabhängig von der Erweiterung alle regulären Dateien im Skill-Ordner akzeptiert. Regeln für ignorierte Dateien,
versteckte Pfade, symbolische Links, macOS-Metadaten und serverseitige Größenbeschränkungen gelten weiterhin.

- Begrenzte Dateien mit gültigem UTF-8 können als maskierter Klartext in einer Vorschau angezeigt werden und werden
  in die begrenzte Textanalyse einbezogen.
- Andere Dateien behalten ihre exakten Bytes bei und stehen zum Herunterladen zur Verfügung.
- Sicherheitsscanner erhalten das vollständige gespeicherte Artefakt; die Texterkennung betrifft die Darstellung und
  Analyse und ist keine Positivliste für Uploads.

Beschränkungen (serverseitig):

- Gesamtgröße des Bundles: 50MB.
- Der Einbettungstext umfasst `SKILL.md` + bis zu etwa 40 begrenzte UTF-8-Dateien (Best-Effort-Obergrenze).

## Slugs

- Standardmäßig aus dem Ordnernamen abgeleitet.
- Paket-Scopes müssen exakt mit dem ClawHub-Publisher-Handle übereinstimmen. Publisher-Handles dürfen Kleinbuchstaben, Ziffern, Bindestriche, Punkte und Unterstriche enthalten; sie müssen mit einem Kleinbuchstaben oder einer Ziffer beginnen und enden.
- Paket-Slugs müssen kleingeschrieben und npm-kompatibel sein, beispielsweise `@example.tools/demo-plugin` oder `demo-plugin`.

## Versionierung + Tags

- Jede Veröffentlichung erstellt eine neue Version (SemVer).
- Tags sind Zeichenfolgenzeiger auf eine Version; `latest` wird häufig verwendet.

## Lizenz

- Alle auf ClawHub veröffentlichten Skills werden unter `MIT-0` lizenziert.
- Jeder darf veröffentlichte Skills verwenden, ändern und weiterverbreiten, auch kommerziell.
- Eine Namensnennung ist nicht erforderlich.
- Fügen Sie in `SKILL.md` keine widersprüchlichen Lizenzbedingungen hinzu; ClawHub unterstützt keine individuellen Lizenzüberschreibungen pro Skill.

## Kostenpflichtige Skills

- ClawHub unterstützt keine kostenpflichtigen Skills, individuellen Preise pro Skill, Bezahlschranken oder Umsatzbeteiligungen.
- Fügen Sie `SKILL.md` keine Preismetadaten hinzu; diese sind nicht Teil des Skill-Formats und machen einen veröffentlichten Skill nicht kostenpflichtig.
- Wenn Ihr Skill einen kostenpflichtigen Drittanbieterdienst integriert, dokumentieren Sie die externen Kosten und das erforderliche Konto deutlich in den Skill-Anweisungen und Umgebungsvariablendeklarationen (`requires.env` für erforderliche Variablen oder `envVars` mit `required: false` für optionale Variablen).
