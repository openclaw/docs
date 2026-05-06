---
read_when:
    - Skills-Konfiguration hinzufügen oder ändern
    - Anpassen der gebündelten Allowlist oder des Installationsverhaltens
summary: Skills-Konfigurationsschema und Beispiele
title: Skills-Konfiguration
x-i18n:
    generated_at: "2026-05-06T07:07:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

Die meiste Konfiguration für das Laden/Installieren von Skills befindet sich unter `skills` in
`~/.openclaw/openclaw.json`. Agent-spezifische Sichtbarkeit von Skills befindet sich unter
`agents.defaults.skills` und `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Für integrierte Bildgenerierung/-bearbeitung bevorzugen Sie `agents.defaults.imageGenerationModel`
zusammen mit dem Core-Tool `image_generate`. `skills.entries.*` ist nur für benutzerdefinierte oder
Drittanbieter-Skill-Workflows vorgesehen.

Wenn Sie einen bestimmten Bild-Provider/ein bestimmtes Modell auswählen, konfigurieren Sie auch den
Auth-/API-Schlüssel dieses Providers. Typische Beispiele: `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für
`google/*`, `OPENAI_API_KEY` für `openai/*` und `FAL_KEY` für `fal/*`.

Beispiele:

- Native Einrichtung im Stil von Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native fal-Einrichtung: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Agent-Skill-Allowlists

Verwenden Sie die Agent-Konfiguration, wenn Sie dieselben Skill-Wurzeln für Maschine/Workspace möchten, aber
pro Agent einen anderen sichtbaren Skill-Satz.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Regeln:

- `agents.defaults.skills`: gemeinsame Basis-Allowlist für Agents, die
  `agents.list[].skills` auslassen.
- Lassen Sie `agents.defaults.skills` weg, damit Skills standardmäßig uneingeschränkt bleiben.
- `agents.list[].skills`: expliziter endgültiger Skill-Satz für diesen Agent; er wird nicht
  mit den Defaults zusammengeführt.
- `agents.list[].skills: []`: keine Skills für diesen Agent sichtbar machen.

## Felder

- Integrierte Skill-Wurzeln enthalten immer `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` und `<workspace>/skills`.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in der Liste zulässig (verwaltete, Agent- und Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche Skill-Verzeichnisse, die gescannt werden sollen (niedrigste Priorität).
- `load.watch`: Skill-Ordner beobachten und den Skills-Snapshot aktualisieren (Standard: true).
- `load.watchDebounceMs`: Entprellung für Skill-Watcher-Ereignisse in Millisekunden (Standard: 250).
- `install.preferBrew`: brew-Installer bevorzugen, wenn verfügbar (Standard: true).
- `install.nodeManager`: Node-Installer-Präferenz (`npm` | `pnpm` | `yarn` | `bun`, Standard: npm).
  Dies betrifft nur **Skill-Installationen**; die Gateway-Laufzeit sollte weiterhin Node sein
  (Bun wird für WhatsApp/Telegram nicht empfohlen).
  - `openclaw setup --node-manager` ist enger gefasst und akzeptiert derzeit `npm`,
    `pnpm` oder `bun`. Setzen Sie `skills.install.nodeManager: "yarn"` manuell, wenn Sie
    Yarn-gestützte Skill-Installationen möchten.
- `entries.<skillKey>`: Überschreibungen pro Skill.
- `agents.defaults.skills`: optionale Standard-Skill-Allowlist, die von Agents geerbt wird,
  die `agents.list[].skills` auslassen.
- `agents.list[].skills`: optionale endgültige Skill-Allowlist pro Agent; explizite
  Listen ersetzen geerbte Defaults, statt sie zusammenzuführen.

Felder pro Skill:

- `enabled`: auf `false` setzen, um einen Skill zu deaktivieren, selbst wenn er gebündelt/installiert ist.
- `env`: Umgebungsvariablen, die für den Agent-Lauf injiziert werden (nur wenn noch nicht gesetzt).
- `apiKey`: optionale Komfortfunktion für Skills, die eine primäre Umgebungsvariable deklarieren.
  Unterstützt Klartext-String oder SecretRef-Objekt (`{ source, provider, id }`).

## Hinweise

- Schlüssel unter `entries` werden standardmäßig dem Skill-Namen zugeordnet. Wenn ein Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen Schlüssel.
- Ladereihenfolge ist `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills →
  `skills.load.extraDirs`.
- Änderungen an Skills werden beim nächsten Agent-Turn übernommen, wenn der Watcher aktiviert ist.

### Sandboxed Skills und Umgebungsvariablen

Wenn eine Sitzung **sandboxed** ist, laufen Skill-Prozesse innerhalb des konfigurierten Sandbox-Backends. Die Sandbox erbt **nicht** das Host-`process.env`.

<Warning>
  Globale `env` und `skills.entries.<skill>.env`/`apiKey` gelten nur für **Host**-Läufe. Innerhalb einer Sandbox haben sie keine Wirkung, daher schlägt ein Skill, der von `GEMINI_API_KEY` abhängt, mit `apiKey not configured` fehl, sofern die Variable der Sandbox nicht separat bereitgestellt wird.
</Warning>

Verwenden Sie eine der folgenden Optionen:

- `agents.defaults.sandbox.docker.env` für das Docker-Backend (oder pro Agent `agents.list[].sandbox.docker.env`).
- Backen Sie die Umgebungsvariable in Ihr benutzerdefiniertes Sandbox-Image oder Ihre Remote-Sandbox-Umgebung ein.

## Verwandt

<CardGroup cols={2}>
  <Card title="Skills" href="/de/tools/skills" icon="puzzle-piece">
    Was Skills sind und wie sie geladen werden.
  </Card>
  <Card title="Creating skills" href="/de/tools/creating-skills" icon="hammer">
    Benutzerdefinierte Skill-Packs erstellen.
  </Card>
  <Card title="Slash commands" href="/de/tools/slash-commands" icon="terminal">
    Nativer Befehlskatalog und Chat-Anweisungen.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Schema für `skills` und `agents.skills`.
  </Card>
</CardGroup>
