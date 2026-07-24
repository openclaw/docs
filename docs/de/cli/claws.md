---
read_when:
    - Sie erstellen oder validieren ein CLAW.md-Manifest.
    - Sie möchten einen Agenten aus einer Claw als Vorschau anzeigen oder hinzufügen
    - Sie müssen das Eigentum, Abweichungen oder Bereinigungsverhalten von Claw überprüfen
summary: Experimentelle Claw-Agent-Pakete erstellen, hinzufügen, aktualisieren und entfernen
title: Klauen
x-i18n:
    generated_at: "2026-07-24T03:41:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b9b83d9ae9846f231554ee7ff3db3410a2c0ee67f86ad2fc7a92d8f97374689a
    source_path: cli/claws.md
    workflow: 16
---

# `openclaw claws`

Ein Claw ist eine versionierte Einrichtung für einen neuen OpenClaw-Agenten. Es kann die
Agentenkonfiguration, Workspace-Dateien, Skills, Plugins, MCP-Server und Cron-
Jobs beschreiben, die der Agent benötigt. Ein Claw ersetzt oder verändert keinen vorhandenen Agenten.

Claws sind experimentell. Ihr Schema, ihre Befehlsausgabe und ihr Lebenszyklus können sich ändern.
Aktivieren Sie die Befehlsoberfläche ausdrücklich:

```bash
export OPENCLAW_EXPERIMENTAL_CLAWS=1
```

Die aktuelle CLI liest ein lokales Paketverzeichnis, `CLAW.md` oder ein gruppiertes JSON-Manifest.
Das Veröffentlichen, Suchen und Installieren vollständiger Claws über ClawHub erfolgt über einen
separaten Registry-Zweig und ist noch nicht Teil dieser Befehlsoberfläche.

## Ein Claw-Paket erstellen

Ein Paket enthält `package.json`, ein `CLAW.md`-Manifest und alle im Manifest
referenzierten Workspace-Begleitdateien:

```json
{
  "name": "@acme/incident-triage-claw",
  "version": "1.0.0",
  "type": "module",
  "openclaw": { "claw": "CLAW.md" }
}
```

`CLAW.md` beginnt mit YAML-Frontmatter. Sein Markdown-Text beschreibt das Claw
für Menschen und ist nicht Teil der Agentenkonfiguration:

```md
---
schemaVersion: 1
agent:
  id: incident-triage
  name: Vorfallstriage
  tools:
    deny: [exec]
workspace:
  bootstrapFiles: {}
packages: []
mcpServers: {}
cronJobs: []
---

# Vorfallstriage

Erstellt einen Agenten zum Prüfen und Weiterleiten von Vorfällen.
```

Dasselbe strikte Schema der Version 1 akzeptiert weiterhin gruppierte JSON-Manifeste.
Die verbleibenden Schemafragmente auf dieser Seite verwenden JSON; entsprechende Schlüssel
sind im Frontmatter von `CLAW.md` verfügbar.

Paket- und Workspace-Pfade müssen innerhalb des Paketstammverzeichnisses bleiben. Manifeste sind
auf 1 MiB, Paketmetadaten auf 256 KiB begrenzt, und für Workspace-Quelldateien gelten
separate Grenzwerte pro Datei und insgesamt. Workspace-Quelldateien lehnen außerdem über symbolische Links
eingebundene übergeordnete Verzeichnisse ab.

Workspace-Dateien werden über ihren Pfad deklariert und aus Paket-Begleitdateien gelesen. Bootstrap-
Dateien wie `SOUL.md` verwenden benannte Einträge; zusätzliche Dateien verwenden paketrelative
Quellen und Workspace-relative Ziele:

```json
{
  "workspace": {
    "bootstrapFiles": {
      "SOUL.md": { "source": "workspace/SOUL.md" }
    },
    "files": [
      {
        "source": "workspace/reference/policy.md",
        "path": "reference/policy.md"
      }
    ]
  }
}
```

Skills und Plugins verwenden exakte ClawHub-Versionen:

```json
{
  "packages": [
    {
      "kind": "skill",
      "source": "clawhub",
      "ref": "incident-triage",
      "version": "1.0.0"
    },
    {
      "kind": "plugin",
      "source": "clawhub",
      "ref": "@acme/audit-plugin",
      "version": "2.0.0"
    }
  ]
}
```

Der Probelauf verwendet die vorhandenen Vorprüfpfade für Skills und Plugins, um vor der
Zustimmung das exakte Artefakt, seine Integrität und etwaige ClawHub-Vertrauenswarnungen
zu ermitteln. Die Warnung bleibt im integritätsgebundenen Plan sichtbar. Bei der Anwendung werden
fehlende Artefakte installiert oder passende wiederverwendet, und es wird vermerkt, ob das Claw
die jeweilige Ressource eingeführt oder referenziert hat. Plugins bleiben prozessweite
OpenClaw-Funktionen und sind keine Installationen pro Agent.

Cron-Jobs deklarieren geplante Aufgaben für den neuen Agenten:

```json
{
  "cronJobs": [
    {
      "id": "daily-summary",
      "name": "Tägliche Vorfallszusammenfassung",
      "schedule": { "cron": "0 9 * * *", "timezone": "UTC" },
      "session": "isolated",
      "message": "Fasse aktive Vorfälle zusammen."
    }
  ]
}
```

Claws verwenden den vorhandenen Gateway-Scheduler und binden erstellte Jobs an den neuen
Agenten. Vorschau, Herkunft, Status und Entfernung umfassen diese Jobs, ohne
das Verhalten gewöhnlicher Cron-Befehle zu ändern. Beim Entfernen wird der aktuelle Job
erneut über das Gateway gelesen und beibehalten, wenn seine verwaltete Definition nach
der Planung geändert wurde.

MCP-Deklarationen verwenden das vorhandene Konfigurationsmodell `mcp.servers`:

```json
{
  "mcpServers": {
    "statuspage": {
      "command": "npx",
      "args": ["--yes", "@acme/statuspage-mcp@1.0.0"],
      "env": { "STATUSPAGE_TOKEN": "${STATUSPAGE_TOKEN}" }
    }
  }
}
```

Umgebungsreferenzen bleiben Referenzen; Claws betten keine aufgelösten geheimen
Werte ein. Eine kollisionsfreie Deklaration wird verwaltet, während eine exakt vorhandene
oder gemeinsam genutzte Deklaration referenziert wird. Vorschau, Herkunft, Status, Export und
Entfernung folgen derselben Eigentumsrichtlinie wie andere Claw-Ressourcen.

## Prüfen und Vorschau anzeigen

Validieren Sie die Quelle, ohne lokale Änderungen zu planen:

```bash
openclaw claws inspect ./incident-triage.claw.json
```

Zeigen Sie eine Vorschau aller vorgeschlagenen Lebenszyklusaktionen an:

```bash
openclaw claws add ./incident-triage.claw.json --dry-run --json
```

Der Plan meldet den abgeleiteten Agenten und Workspace, jede vorgeschlagene Aktion,
Voraussetzungen, Blockaden, unterschiedliche Funktionserweiterungen und einen
`planIntegrity`-Digest. Funktionsdatensätze zeigen die exakten Auswirkungen auf Pakete, MCP,
geplante Aufgaben, Sandbox, Werkzeuge oder Heartbeat. Prüfen Sie den Plan, bevor Sie den Agenten erstellen:

```bash
openclaw claws add ./incident-triage.claw.json \
  --yes \
  --plan-integrity <SHA256_FROM_DRY_RUN>
```

`--yes` allein reicht nicht aus. OpenClaw erstellt den Plan neu und lehnt die Zustimmung
ab, wenn sich Quelle, Ziel oder aktuelle Konfiguration nach der Vorschau geändert haben. Verwenden Sie
`--agent-id` oder `--workspace` sowohl bei der Vorschau als auch bei der Anwendung, wenn
Paketstandardwerte mit dem lokalen Zustand kollidieren. Übergeben Sie für temporäre Profile und
parallele Validierung ein ausdrückliches `--workspace`; `OPENCLAW_STATE_DIR` verlegt den
Laufzeitzustand, ändert jedoch nicht den standardmäßigen Workspace-Speicherort.

Beim Hinzufügen eines Claws werden der neue Agent und die Workspace-Konfiguration erstellt,
deklarierte Workspace-Dateien geschrieben, deklarierte Skill- und Plugin-Artefakte installiert
oder wiederverwendet und die Herkunft von Paketen, MCP und Cron erfasst. Vorhandene Dateien werden
nicht überschrieben, und Wiederholungsversuche werden sicher abgebrochen, wenn sich verwaltete Inhalte
geändert haben.

## Installierten Zustand prüfen

```bash
openclaw claws status
openclaw claws status incident-triage --json
openclaw doctor
```

`status` vergleicht den installierten Agenten und die erfasste Herkunft seines Workspace,
seiner Pakete, seiner MCP-Konfiguration und seiner Cron-Jobs mit dem aktuellen Zustand. Es meldet
unvollständige Installationen, fehlende Ressourcen und Abweichungen, ohne den lokalen Zustand zu
ändern. `openclaw doctor` ergänzt Claw-spezifische Diagnosen für unvollständige Eigentumsdatensätze,
unsichere verwaltete Dateien und Cron-Jobs, die nicht anhand des aktuellen Gateway-Inventars
bestätigt werden können.

Die Claw-Herkunft unterscheidet zwei Beziehungen:

- **Verwaltet:** Das Claw hat die Ressource eingeführt und verwaltet sie derzeit. Sie kommt
  für eine Bereinigung infrage, wenn sie unverändert ist und kein konkurrierender Eigentümer verbleibt.
- **Referenziert:** Die Ressource war bereits unabhängig vorhanden oder wird gemeinsam genutzt. Beim Entfernen
  wird die Referenz dieses Claws freigegeben und die Ressource standardmäßig beibehalten.

Dies ist kein Referenzzähler. Gewöhnliche Befehle für Plugins, Skills und Agenten behalten
ihr bestehendes Verhalten; Claws ergänzen darüber hinaus Herkunftsinformationen und abgesicherte
Lebenszyklusaktionen.

## Ein installiertes Claw aktualisieren

Standardmäßig verwendet die Aktualisierung die Quelle, die beim Hinzufügen des Claws erfasst wurde.
Verwenden Sie `--from`, wenn diese Quelle verschoben wurde oder wenn Sie ein anderes
Paketverzeichnis testen:

```bash
openclaw claws update incident-triage --dry-run --json
openclaw claws update incident-triage \
  --from ./incident-triage-next \
  --dry-run --json
```

Der Plan vergleicht die aktuelle Herkunft und den aktuellen Zustand mit dem Zielmanifest.
Er meldet Änderungen an Agent, Workspace, Paketen, MCP, Cron und Eigentumsverhältnissen,
einschließlich Funktionserweiterungen und Blockaden. Funktionserweiterungen besitzen
separate maschinenlesbare Datensätze und `!`-Zeilen mit exakten redigierten
Auswirkungen in der menschenlesbaren Ausgabe. Die aufgelöste Paketintegrität, Installationsidentität
und etwaige Vertrauenswarnungen sind enthalten. Beim Entfernen einer Paketdeklaration wird die
Verknüpfung dieses Claws freigegeben, ohne das Artefakt während der Aktualisierung zu deinstallieren.
Die abschließende exakte Bestätigung `planIntegrity` bindet sowohl diese offengelegte Menge als
auch gewöhnliche Inhaltsänderungen. Hosts können dieselben Datensätze für einen separaten Dialog
oder eine zusammengefasste Prüfung mehrerer Agenten verwenden. Wenden Sie den exakt geprüften Plan
mit ausdrücklicher Zustimmung an:

```bash
openclaw claws update incident-triage \
  --yes \
  --plan-integrity <SHA256_FROM_DRY_RUN>
```

OpenClaw erstellt den Plan neu und führt vor jeder Änderung einen Compare-and-Swap des
verwalteten Zustands aus. Entfernte Paketdeklarationen geben Abhängigkeitsverknüpfungen frei,
ohne Artefakte zu deinstallieren. Bei Cron-Änderungen wird die aktuelle Scheduler-Definition
erneut gelesen und bei Abweichungen durch Bedienereingriffe abgebrochen. Paketinstallationsprogramme,
Schreiber der Quellkonfiguration und der Gateway-Scheduler bilden keine gemeinsame Transaktion.
Wenn die Kompensation nach einer externen Änderung nicht nachgewiesen werden kann, meldet OpenClaw
den Fehlercode `update_partial` mit strukturierten `status: partial`, behält unsichere
Herkunftsinformationen bei und hält an. Prüfen Sie `claws status`, die betroffene Ressource
und `openclaw doctor`; zeigen Sie anschließend erneut eine Vorschau an, bevor Sie den Vorgang
wiederholen oder etwas entfernen.

## Ein installiertes Claw entfernen

Zeigen Sie vor der Auswahl der Bereinigung eine Vorschau der Entfernung an:

```bash
openclaw claws remove incident-triage --dry-run --json
openclaw claws remove incident-triage \
  --yes \
  --plan-integrity <SHA256_FROM_DRY_RUN>
```

Standardmäßig werden geeignete verwaltete Zustände entfernt und referenzierte Zustände freigegeben.
Geänderte Dateien und Ressourcen mit einem anderen aktuellen Eigentümer werden beibehalten oder
blockiert. Bereinigungsoptionen sind Teil des Plan-Digests; `--yes` erweitert sie niemals.
Global installierte Plugins werden beibehalten, während die Referenz dieses Claws freigegeben wird;
verwenden Sie den gewöhnlichen Plugin-Lebenszyklus separat, wenn Sie ein prozessweites Plugin
deinstallieren möchten.

Um unveränderte, vom Claw eingeführte Referenzen ohne anderen aktuellen Eigentümer zu entfernen,
geben Sie `--remove-unused` sowohl bei der Vorschau als auch bei der Anwendung an. Um stattdessen
bestimmte referenzierte Ressourcen auszuwählen, wiederholen Sie `--remove-referenced`:

```bash
openclaw claws remove incident-triage \
  --dry-run \
  --remove-referenced 'plugin:@acme/audit-plugin@2.0.0'
```

Verwenden Sie `--force-referenced` erst, nachdem Sie die angezeigten abhängigen Ressourcen,
unabhängigen Eigentümer und den bereits vorhandenen Ursprung geprüft haben. Damit ist die
ausgewählte Bereinigung trotz dieser Konflikte möglich; die Zustimmung zur Planintegrität
wird dadurch nicht übersprungen.

## Einen installierten Agenten exportieren

Der Export erstellt ein neues Paketverzeichnis und schlägt fehl, wenn das Ziel bereits vorhanden ist
oder der verwaltete Zustand abgewichen ist:

```bash
openclaw claws export incident-triage --out ./incident-triage-export --json
```

Das Ergebnis enthält `package.json`, kanonisches `CLAW.md` und verwaltete
Workspace-Begleitdateien. Es ist ein portables Claw-Paket und keine Sicherung der gesamten Instanz:
Nicht zugehörige Agenten, Anmeldedaten, Sitzungen und nicht verwaltete lokale Zustände sind ausgeschlossen.

## Befehlsreferenz

| Befehl                              | Zweck                                                       |
| ----------------------------------- | ----------------------------------------------------------- |
| `claws inspect <source>`            | Validiert ein Paketverzeichnis oder gruppiertes Manifest.   |
| `claws add <source>`                | Zeigt eine Vorschau an oder erstellt einen neuen Agenten und Workspace. |
| `claws status [claw-or-agent]`      | Meldet installierten Zustand, Eigentumsverhältnisse und Abweichungen. |
| `claws update <claw-or-agent>`      | Zeigt Änderungen aus der ausgewählten Quelle an oder wendet sie an. |
| `claws remove <claw-or-agent>`      | Zeigt die Entfernung an oder entfernt den Agenten und geeignete Ressourcen. |
| `claws export <agent> --out <path>` | Erstellt ein portables Paket aus einem installierten Agenten. |

Verwenden Sie `--json` für experimentelle maschinenlesbare Ausgaben.

## Siehe auch

- [Agenten](/de/cli/agents)
- [Skills](/de/tools/skills)
- [Plugins](/de/tools/plugin)
- [Cron-Jobs](/de/automation/cron-jobs)
- [MCP-Konfiguration](/de/gateway/configuration-reference#mcp)
