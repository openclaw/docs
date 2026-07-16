---
read_when:
    - Skills veröffentlichen
    - Fehler bei der Veröffentlichung debuggen
summary: Format des Skills-Ordners, erforderliche Dateien, zulässige Dateitypen, Beschränkungen.
x-i18n:
    generated_at: "2026-07-16T12:48:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill-Format

## Auf dem Datenträger

Ein Skill ist ein Ordner.

Erforderlich:

- `SKILL.md` (oder `skill.md`; das veraltete `skills.md` wird ebenfalls akzeptiert)

Optional:

- beliebige unterstützende _textbasierte_ Dateien (siehe „Zulässige Dateien“)
- `.clawhubignore` (Ausschlussmuster für die Veröffentlichung, veraltet: `.clawdhubignore`)
- `.gitignore` (wird ebenfalls berücksichtigt)

## GitHub-Import

Der webbasierte GitHub-Importer ist strenger als die lokale Veröffentlichung/Synchronisierung. Er erkennt nur
`SKILL.md`- oder veraltete `skills.md`-Dateien in öffentlichen Repositorys ohne Fork-Status, die dem
angemeldeten GitHub-Konto gehören. Er importiert weder private Repositorys noch Forks,
archivierte/deaktivierte Repositorys oder öffentliche Repositorys Dritter.

Lokale Installationsmetadaten (von der CLI geschrieben):

- `<skill>/.clawhub/origin.json` (veraltet: `.clawdhub`)

Installationsstatus des Arbeitsverzeichnisses (von der CLI geschrieben):

- `<workdir>/.clawhub/lock.json` (veraltet: `.clawdhub`)

## `SKILL.md`

- Markdown mit optionalem YAML-Frontmatter.
- Der Server extrahiert während der Veröffentlichung Metadaten aus dem Frontmatter.
- `description` wird in der Benutzeroberfläche und Suche als Zusammenfassung des Skills verwendet.

Bei portablen Agent Skills sollte `name` mit dem übergeordneten Verzeichnis übereinstimmen und
1–64 Kleinbuchstaben, Ziffern oder Bindestriche verwenden. ClawHub hält den routingfähigen Slug und
den Anzeigenamen im Katalog getrennt, sodass bestehende Namen aus anderen Clients weiterhin
veröffentlicht werden können und nicht stillschweigend umgeschrieben werden. Kataloglisten können lange Namen
optisch kürzen, ohne den gespeicherten Namen zu ändern.

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

Verwenden Sie `requires.env` für Umgebungsvariablen, die vorhanden sein müssen, bevor der Skill ausgeführt werden kann. Verwenden Sie `envVars`, wenn Sie Metadaten pro Variable benötigen, einschließlich optionaler Variablen mit `required: false`.

### Vollständige Feldreferenz

| Feld               | Typ        | Beschreibung                                                                                                                                 |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Erforderliche Umgebungsvariablen, die Ihr Skill erwartet.                                                                                    |
| `requires.bins`    | `string[]` | CLI-Binärdateien, die alle installiert sein müssen.                                                                                          |
| `requires.anyBins` | `string[]` | CLI-Binärdateien, von denen mindestens eine vorhanden sein muss.                                                                             |
| `requires.config`  | `string[]` | Pfade zu Konfigurationsdateien, die Ihr Skill liest.                                                                                         |
| `primaryEnv`       | `string`   | Die primäre Umgebungsvariable für Anmeldedaten Ihres Skills.                                                                                 |
| `envVars`          | `array`    | Deklarationen von Umgebungsvariablen mit `name`, optionalem `required` und optionalem `description`. Legen Sie für optionale Umgebungsvariablen `required: false` fest. |
| `always`           | `boolean`  | Wenn `true`, ist der Skill immer aktiv (keine explizite Installation erforderlich).                                                         |
| `skillKey`         | `string`   | Überschreibt den Aufrufschlüssel des Skills.                                                                                                 |
| `emoji`            | `string`   | Anzeige-Emoji für den Skill.                                                                                                                 |
| `homepage`         | `string`   | URL zur Homepage oder Dokumentation des Skills.                                                                                              |
| `os`               | `string[]` | Betriebssystembeschränkungen (z. B. `["macos"]`, `["linux"]`).                                                                              |
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
        description: Optionale Standard-Projekt-ID, wenn keine angegeben wird.
```

### Warum dies wichtig ist

Die Sicherheitsanalyse von ClawHub prüft, ob die Deklarationen Ihres Skills mit seinem tatsächlichen Verhalten übereinstimmen. Wenn Ihr Code auf `TODOIST_API_KEY` verweist, Ihr Frontmatter dies jedoch nicht unter `requires.env`, `primaryEnv` oder `envVars` deklariert, kennzeichnet die Analyse dies als Metadatenabweichung. Korrekte Deklarationen erleichtern Ihrem Skill das Bestehen der Prüfung und helfen Benutzern zu verstehen, was sie installieren.

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
        description: Optionale Standard-Projekt-ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Zulässige Dateien

Bei der Veröffentlichung werden nur „textbasierte“ Dateien akzeptiert.

- Die Positivliste der Erweiterungen befindet sich in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Skriptdateien werden nach dem Hochladen weiterhin gescannt; PowerShell-Dateien vom Typ `.ps1`, `.psm1` und `.psd1` werden als Text akzeptiert.
- Inhaltstypen, die mit `text/` beginnen, werden als Text behandelt; hinzu kommt eine kleine Positivliste (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Grenzwerte (serverseitig):

- Gesamtgröße des Bundles: 50MB.
- Der Einbettungstext umfasst `SKILL.md` sowie bis zu etwa 40 Dateien, die nicht `.md` sind (Best-Effort-Grenze).

## Slugs

- Werden standardmäßig aus dem Ordnernamen abgeleitet.
- Paketbereiche müssen exakt mit dem ClawHub-Publisher-Handle übereinstimmen. Publisher-Handles dürfen Kleinbuchstaben, Ziffern, Bindestriche, Punkte und Unterstriche enthalten; sie müssen mit einem Kleinbuchstaben oder einer Ziffer beginnen und enden.
- Paket-Slugs müssen kleingeschrieben und npm-kompatibel sein, beispielsweise `@example.tools/demo-plugin` oder `demo-plugin`.

## Versionierung und Tags

- Jede Veröffentlichung erstellt eine neue Version (SemVer).
- Tags sind Zeichenkettenverweise auf eine Version; `latest` wird häufig verwendet.

## Lizenz

- Alle auf ClawHub veröffentlichten Skills sind unter `MIT-0` lizenziert.
- Jeder darf veröffentlichte Skills verwenden, ändern und weiterverbreiten, auch kommerziell.
- Eine Namensnennung ist nicht erforderlich.
- Fügen Sie in `SKILL.md` keine widersprüchlichen Lizenzbedingungen hinzu; ClawHub unterstützt keine individuellen Lizenzüberschreibungen pro Skill.

## Kostenpflichtige Skills

- ClawHub unterstützt keine kostenpflichtigen Skills, Preise pro Skill, Bezahlschranken oder Umsatzbeteiligungen.
- Fügen Sie `SKILL.md` keine Preismetadaten hinzu; sie gehören nicht zum Skill-Format und machen einen veröffentlichten Skill nicht kostenpflichtig.
- Wenn Ihr Skill einen kostenpflichtigen Drittanbieterdienst integriert, dokumentieren Sie die externen Kosten und das erforderliche Konto eindeutig in den Skill-Anweisungen und Umgebungsvariablendeklarationen (`requires.env` für erforderliche Variablen oder `envVars` mit `required: false` für optionale Variablen).
