---
read_when:
    - Sie möchten .prose-Workflow-Dateien ausführen oder schreiben
    - Sie möchten das OpenProse-Plugin aktivieren
    - Sie müssen verstehen, wie OpenProse OpenClaw-Primitiven zuordnet
sidebarTitle: OpenProse
summary: OpenProse ist ein Markdown-first-Workflow-Format für Multi-Agent-KI-Sitzungen. In OpenClaw wird es als Plugin mit einem Slash-Befehl `/prose` und einem Skill-Paket ausgeliefert.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:01:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse ist ein portables, Markdown-orientiertes Workflow-Format zur Orchestrierung von KI-Sitzungen. In OpenClaw wird es als Plugin ausgeliefert, das ein OpenProse-Skill-Paket und einen Slash-Befehl `/prose` installiert. Programme liegen in `.prose`-Dateien und können mehrere Sub-Agents mit explizitem Kontrollfluss starten.

<CardGroup cols={3}>
  <Card title="Installieren" icon="download" href="#install">
    Aktivieren Sie das OpenProse-Plugin und starten Sie den Gateway neu.
  </Card>
  <Card title="Ein Programm ausführen" icon="play" href="#slash-command">
    Verwenden Sie `/prose run`, um eine `.prose`-Datei oder ein entferntes Programm auszuführen.
  </Card>
  <Card title="Programme schreiben" icon="pencil" href="#example">
    Erstellen Sie Multi-Agent-Workflows mit parallelen und sequenziellen Schritten.
  </Card>
</CardGroup>

## Installieren

<Steps>
  <Step title="Das Plugin aktivieren">
    Gebündelte Plugins sind standardmäßig deaktiviert. Aktivieren Sie OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Den Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Überprüfen">
    ```bash
    openclaw plugins list | grep prose
    ```

    Sie sollten sehen, dass `open-prose` aktiviert ist. Der Skill-Befehl `/prose` ist jetzt im Chat verfügbar.

  </Step>
</Steps>

Für einen lokalen Checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Slash-Befehl

OpenProse registriert `/prose` als vom Benutzer aufrufbaren Skill-Befehl:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` wird zu `https://p.prose.md/<handle>/<slug>` aufgelöst. Direkte URLs werden unverändert mit dem Tool `web_fetch` abgerufen.

Remote-Ausführungen auf oberster Ebene sind explizit. Remote-Importe innerhalb eines `.prose`-Programms sind transitive Code-Abhängigkeiten: Bevor OpenProse ein entferntes `use`-Ziel abruft, zeigt es die aufgelöste Importliste an und verlangt, dass der Operator für diesen Lauf genau mit `approve remote prose imports` antwortet.

## Was es kann

- Multi-Agent-Recherche und -Synthese mit expliziter Parallelität.
- Wiederholbare, genehmigungssichere Workflows (Code-Review, Vorfalltriage, Content-Pipelines).
- Wiederverwendbare `.prose`-Programme, die Sie über unterstützte Agent-Runtimes hinweg ausführen können.

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

## OpenClaw-Runtime-Zuordnung

OpenProse-Programme werden auf OpenClaw-Primitiven abgebildet:

| OpenProse-Konzept        | OpenClaw-Tool    |
| ------------------------ | ---------------- |
| Sitzung starten / Task-Tool | `sessions_spawn` |
| Datei lesen / schreiben  | `read` / `write` |
| Web-Abruf                | `web_fetch`      |

<Warning>
  Wenn Ihre Tool-Allowlist `sessions_spawn`, `read`, `write` oder `web_fetch` blockiert, schlagen OpenProse-Programme fehl. Prüfen Sie Ihre [Tool-Allowlist-Konfiguration](/de/gateway/config-tools).
</Warning>

## Dateispeicherorte

OpenProse speichert Zustand unter `.prose/` in Ihrem Workspace:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Persistente Agents auf Benutzerebene liegen unter:

```text
~/.prose/agents/
```

## Zustands-Backends

<AccordionGroup>
  <Accordion title="Dateisystem (Standard)">
    Zustand wird im Workspace nach `.prose/runs/...` geschrieben. Es sind keine zusätzlichen Abhängigkeiten erforderlich.
  </Accordion>
  <Accordion title="im Kontext">
    Flüchtiger Zustand wird im Kontextfenster gehalten. Geeignet für kleine, kurzlebige Programme.
  </Accordion>
  <Accordion title="sqlite (experimentell)">
    Erfordert das Binary `sqlite3` auf `PATH`.
  </Accordion>
  <Accordion title="postgres (experimentell)">
    Erfordert `psql` und eine Verbindungszeichenfolge.

    <Warning>
      Postgres-Anmeldedaten fließen in Sub-Agent-Protokolle ein. Verwenden Sie eine dedizierte Datenbank mit minimalen Berechtigungen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sicherheit

Behandeln Sie `.prose`-Dateien wie Code. Prüfen Sie sie vor der Ausführung, einschließlich entfernter `use`-Importe. Anfragen der obersten Ebene wie `/prose run https://...` sind explizit, aber transitive Remote-Importe erfordern vor dem Abruf oder der Ausführung eine Genehmigung pro Lauf. Verwenden Sie OpenClaw-Tool-Allowlists und Genehmigungs-Gates, um Seiteneffekte zu steuern. Für deterministische, genehmigungsgesteuerte Workflows vergleichen Sie dies mit [Lobster](/de/tools/lobster).

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills-Referenz" href="/de/tools/skills" icon="puzzle-piece">
    Wie das Skill-Paket von OpenProse geladen wird und welche Gates gelten.
  </Card>
  <Card title="Subagents" href="/de/tools/subagents" icon="users">
    Die native Multi-Agent-Koordinierungsebene von OpenClaw.
  </Card>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="volume-high">
    Fügen Sie Ihren Workflows Audioausgabe hinzu.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Alle verfügbaren Chat-Befehle einschließlich /prose.
  </Card>
</CardGroup>

Offizielle Website: [https://www.prose.md](https://www.prose.md)
