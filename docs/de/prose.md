---
read_when:
    - Sie möchten `.prose`-Workflow-Dateien ausführen oder schreiben
    - Sie möchten das OpenProse-Plugin aktivieren
    - Sie müssen verstehen, wie OpenProse auf OpenClaw-Grundbausteine abgebildet wird
sidebarTitle: OpenProse
summary: OpenProse ist ein Markdown-basiertes Workflow-Format für KI-Sitzungen mit mehreren Agenten. In OpenClaw wird es als Plugin mit dem Slash-Befehl /prose und einem Skills-Paket bereitgestellt.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T02:03:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse ist ein portables, Markdown-zentriertes Workflow-Format zur Orchestrierung von KI-Sitzungen. In OpenClaw wird es als Plugin ausgeliefert, das ein OpenProse-Skill-Paket und den Slash-Befehl `/prose` installiert. Programme befinden sich in `.prose`-Dateien und können mehrere Unteragenten mit explizitem Kontrollfluss starten.

<CardGroup cols={3}>
  <Card title="Installieren" icon="download" href="#install">
    Aktivieren Sie das OpenProse-Plugin und starten Sie den Gateway neu.
  </Card>
  <Card title="Programm ausführen" icon="play" href="#slash-command">
    Verwenden Sie `/prose run`, um eine `.prose`-Datei oder ein entferntes Programm auszuführen.
  </Card>
  <Card title="Programme schreiben" icon="pencil" href="#example-parallel-research-and-synthesis">
    Erstellen Sie Multi-Agent-Workflows mit parallelen und sequenziellen Schritten.
  </Card>
</CardGroup>

## Installation

<Steps>
  <Step title="Plugin aktivieren">
    OpenProse ist enthalten, aber standardmäßig deaktiviert. Aktivieren Sie es:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Überprüfen">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` sollte als aktiviert angezeigt werden. Der Skill-Befehl `/prose` ist jetzt im Chat verfügbar.

  </Step>
</Steps>

Aus einem ausgecheckten Repository können Sie das Plugin direkt installieren:
`openclaw plugins install ./extensions/open-prose`

## Slash-Befehl

OpenProse registriert `/prose` als einen vom Benutzer aufrufbaren Skill-Befehl:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` wird zu `https://p.prose.md/<handle>/<slug>` aufgelöst.
Direkte URLs werden unverändert mit dem Tool `web_fetch` abgerufen.

Entfernte Ausführungen auf oberster Ebene erfolgen explizit. Entfernte Importe innerhalb eines `.prose`-Programms sind transitive Code-Abhängigkeiten: Bevor OpenProse ein entferntes `use`-Ziel abruft, zeigt es die aufgelöste Importliste an und verlangt, dass der Betreiber für diese Ausführung exakt mit `approve remote prose imports` antwortet.

## Funktionsumfang

- Multi-Agent-Recherche und -Synthese mit expliziter Parallelität.
- Wiederholbare, durch Genehmigungen abgesicherte Workflows (Code-Review, Vorfalltriage, Inhaltspipelines).
- Wiederverwendbare `.prose`-Programme, die Sie in unterstützten Agent-Laufzeitumgebungen ausführen können.

## Beispiel: parallele Recherche und Synthese

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## Zuordnung zur OpenClaw-Laufzeit

OpenProse-Programme werden OpenClaw-Primitiven zugeordnet:

| OpenProse-Konzept                  | OpenClaw-Tool                                    |
| ---------------------------------- | ------------------------------------------------ |
| Sitzung starten / Task-Tool        | `sessions_spawn`                                 |
| Datei lesen / schreiben            | `read` / `write`                                 |
| Webabruf                           | `web_fetch` (`exec` + curl, wenn POST nötig ist) |

<Warning>
  Wenn Ihre Tool-Zulassungsliste `sessions_spawn`, `read`, `write` oder `web_fetch` blockiert, schlagen OpenProse-Programme fehl. Prüfen Sie Ihre [Konfiguration der Tool-Zulassungsliste](/de/gateway/config-tools).
</Warning>

## Dateispeicherorte

OpenProse speichert den Zustand unter `.prose/` in Ihrem Arbeitsbereich:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Benutzerbezogene persistente Agenten, die projektübergreifend gemeinsam genutzt werden, befinden sich unter:

```text
~/.prose/agents/
```

## Zustands-Backends

<AccordionGroup>
  <Accordion title="Dateisystem (Standard)">
    Der Zustand wird im Arbeitsbereich unter `.prose/runs/...` gespeichert. Es sind keine zusätzlichen Abhängigkeiten erforderlich.
  </Accordion>
  <Accordion title="Im Kontext">
    Der transiente Zustand wird im Kontextfenster gehalten; wählen Sie dies mit `--in-context` aus. Geeignet für kleine, kurzlebige Programme.
  </Accordion>
  <Accordion title="SQLite (experimentell)">
    Wählen Sie dies mit `--state=sqlite` aus. Erfordert die Binärdatei `sqlite3` in `PATH` (greift bei deren Fehlen auf das Dateisystem zurück); der Zustand wird unter `.prose/runs/{id}/state.db` gespeichert.
  </Accordion>
  <Accordion title="Postgres (experimentell)">
    Wählen Sie dies mit `--state=postgres` aus. Erfordert `psql` und eine Verbindungszeichenfolge in `OPENPROSE_POSTGRES_URL` (legen Sie sie in `.prose/.env` fest).

    <Warning>
      Postgres-Zugangsdaten werden in die Protokolle der Unteragenten übernommen. Verwenden Sie eine dedizierte Datenbank mit minimalen Berechtigungen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sicherheit

Behandeln Sie `.prose`-Dateien wie Code. Prüfen Sie sie vor der Ausführung, einschließlich entfernter `use`-Importe. Anfragen der obersten Ebene mit `/prose run https://...` erfolgen explizit, transitive entfernte Importe erfordern jedoch vor dem Abruf oder der Ausführung eine Genehmigung für jede einzelne Ausführung. Verwenden Sie OpenClaw-Tool-Zulassungslisten und Genehmigungsschranken, um Nebeneffekte zu kontrollieren. Vergleichen Sie für deterministische, genehmigungspflichtige Workflows mit [Lobster](/de/tools/lobster).

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills-Referenz" href="/de/tools/skills" icon="puzzle-piece">
    Wie das Skill-Paket von OpenProse geladen wird und welche Einschränkungen gelten.
  </Card>
  <Card title="Unteragenten" href="/de/tools/subagents" icon="users">
    Die native Multi-Agent-Koordinationsschicht von OpenClaw.
  </Card>
  <Card title="Text-zu-Sprache" href="/de/tools/tts" icon="volume-high">
    Fügen Sie Ihren Workflows eine Audioausgabe hinzu.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Alle verfügbaren Chatbefehle einschließlich `/prose`.
  </Card>
</CardGroup>

Offizielle Website: [https://www.prose.md](https://www.prose.md)
