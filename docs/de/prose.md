---
read_when:
    - Sie möchten .prose-Workflow-Dateien ausführen oder schreiben
    - Sie möchten das OpenProse-Plugin aktivieren
    - Sie müssen verstehen, wie OpenProse OpenClaw-Primitiven zuordnet.
sidebarTitle: OpenProse
summary: OpenProse ist ein Markdown-zentriertes Workflow-Format für KI-Sitzungen mit mehreren Agenten. In OpenClaw wird es als Plugin mit dem Slash-Befehl /prose und einem Skills-Paket bereitgestellt.
title: OpenProse
x-i18n:
    generated_at: "2026-07-24T04:01:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse ist ein portables, Markdown-orientiertes Workflow-Format zur Orchestrierung von KI-
Sitzungen. In OpenClaw wird es als Plugin ausgeliefert, das ein OpenProse-Skill-
Paket und einen `/prose`-Slash-Befehl installiert. Programme befinden sich in `.prose`-Dateien und können
mehrere Sub-Agenten mit explizitem Kontrollfluss starten.

<CardGroup cols={3}>
  <Card title="Installieren" icon="download" href="#install">
    Aktivieren Sie das OpenProse-Plugin und starten Sie das Gateway neu.
  </Card>
  <Card title="Programm ausführen" icon="play" href="#slash-command">
    Verwenden Sie `/prose run`, um eine `.prose`-Datei oder ein Remote-Programm auszuführen.
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

    `open-prose` sollte als aktiviert angezeigt werden. Der Skill-Befehl `/prose` ist jetzt
    im Chat verfügbar.

  </Step>
</Steps>

Aus einem Repository-Checkout können Sie das Plugin direkt installieren:
`openclaw plugins install ./extensions/open-prose`

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

`/prose run <handle/slug>` wird zu `https://p.prose.md/<handle>/<slug>` aufgelöst.
Direkte URLs werden unverändert mit dem Tool `web_fetch` abgerufen.

Remote-Ausführungen auf oberster Ebene erfolgen explizit. Remote-Importe innerhalb eines `.prose`-Programms sind
transitive Codeabhängigkeiten: Bevor OpenProse ein Remote-Ziel `use` abruft,
zeigt es die aufgelöste Importliste an und verlangt, dass der Operator für diese Ausführung exakt mit
`approve remote prose imports` antwortet.

## Funktionsumfang

- Multi-Agent-Recherche und -Synthese mit expliziter Parallelität.
- Wiederholbare, genehmigungssichere Workflows (Code-Review, Vorfall-Triage, Content-Pipelines).
- Wiederverwendbare `.prose`-Programme, die Sie in unterstützten Agent-Laufzeitumgebungen ausführen können.

## Beispiel: parallele Recherche und Synthese

```prose
# Recherche und Synthese mit zwei parallel ausgeführten Agenten.

input topic: "Was sollen wir recherchieren?"

agent researcher:
  model: sonnet
  prompt: "Sie recherchieren gründlich und geben Quellen an."

agent writer:
  model: opus
  prompt: "Sie verfassen eine prägnante Zusammenfassung."

parallel:
  findings = session: researcher
    prompt: "Recherchieren Sie {topic}."
  draft = session: writer
    prompt: "Fassen Sie {topic} zusammen."

session "Führen Sie die Ergebnisse und den Entwurf zu einer endgültigen Antwort zusammen."
  context: { findings, draft }
```

## Zuordnung zur OpenClaw-Laufzeitumgebung

OpenProse-Programme werden OpenClaw-Grundelementen zugeordnet:

| OpenProse-Konzept              | OpenClaw-Tool                                   |
| ------------------------------ | ----------------------------------------------- |
| Sitzung starten / Task-Tool    | `sessions_spawn`                                |
| Datei lesen / schreiben        | `read` / `write`                                |
| Webabruf                      | `web_fetch` (`exec` + curl, wenn POST erforderlich ist) |

<Warning>
  Wenn Ihre Tool-Zulassungsliste `sessions_spawn`, `read`, `write` oder
  `web_fetch` blockiert, schlagen OpenProse-Programme fehl. Überprüfen Sie Ihre
  [Konfiguration der Tool-Zulassungsliste](/de/gateway/config-tools).
</Warning>

## Dateispeicherorte

OpenProse speichert den Zustand unter `.prose/` in Ihrem Workspace:

```text
.prose/
├── .env                      # Konfiguration (Schlüssel=Wert), z. B. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # Kopie des ausgeführten Programms
│       ├── state.md          # Ausführungszustand
│       ├── bindings/
│       ├── imports/          # verschachtelte Ausführungen von Remote-Programmen
│       └── agents/
└── agents/                   # projektbezogene persistente Agenten
```

Persistente Agenten auf Benutzerebene, die projektübergreifend gemeinsam genutzt werden, befinden sich unter:

```text
~/.prose/agents/
```

## Zustands-Backends

<AccordionGroup>
  <Accordion title="Dateisystem (Standard)">
    Der Zustand wird in `.prose/runs/...` im Workspace geschrieben. Es sind keine zusätzlichen
    Abhängigkeiten erforderlich.
  </Accordion>
  <Accordion title="im Kontext">
    Der transiente Zustand wird im Kontextfenster gehalten; wählen Sie ihn mit `--in-context` aus.
    Geeignet für kleine, kurzlebige Programme.
  </Accordion>
  <Accordion title="SQLite (experimentell)">
    Wählen Sie es mit `--state=sqlite` aus. Erfordert die Binärdatei `sqlite3` unter `PATH`
    (greift bei Fehlen auf das Dateisystem zurück); der Zustand wird in
    `.prose/runs/{id}/state.db` gespeichert.
  </Accordion>
  <Accordion title="Postgres (experimentell)">
    Wählen Sie es mit `--state=postgres` aus. Erfordert `psql` und eine Verbindungszeichenfolge in
    `OPENPROSE_POSTGRES_URL` (legen Sie sie in `.prose/.env` fest).

    <Warning>
      Postgres-Anmeldedaten gelangen in die Protokolle der Sub-Agenten. Verwenden Sie eine dedizierte
      Datenbank mit minimalen Berechtigungen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sicherheit

Behandeln Sie `.prose`-Dateien wie Code. Prüfen Sie sie vor der Ausführung, einschließlich Remote-
Importen vom Typ `use`. Anfragen vom Typ `/prose run https://...` auf oberster Ebene sind explizit, aber
transitive Remote-Importe erfordern vor dem Abruf oder der
Ausführung eine Genehmigung für jede Ausführung. Verwenden Sie OpenClaw-Tool-Zulassungslisten und Genehmigungsschranken, um Nebenwirkungen zu
kontrollieren. Für deterministische Workflows mit Genehmigungsschranken vergleichen Sie dies mit
[Lobster](/de/tools/lobster).

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills-Referenz" href="/de/tools/skills" icon="puzzle-piece">
    Wie das Skill-Paket von OpenProse geladen wird und welche Schranken gelten.
  </Card>
  <Card title="Sub-Agenten" href="/de/tools/subagents" icon="users">
    Die native Multi-Agent-Koordinationsschicht von OpenClaw.
  </Card>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="volume-high">
    Fügen Sie Ihren Workflows eine Audioausgabe hinzu.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Alle verfügbaren Chatbefehle einschließlich /prose.
  </Card>
</CardGroup>

Offizielle Website: [https://www.prose.md](https://www.prose.md)
