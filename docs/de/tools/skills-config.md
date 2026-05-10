---
read_when:
    - Skills-Konfiguration hinzufügen oder ändern
    - Anpassen der gebündelten Allowlist oder des Installationsverhaltens
summary: Skills-Konfigurationsschema und Beispiele
title: Skills-Konfiguration
x-i18n:
    generated_at: "2026-05-10T19:55:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

Die meiste Konfiguration für den Skills-Loader und die Skills-Installation liegt unter `skills` in
`~/.openclaw/openclaw.json`. Agent-spezifische Skill-Sichtbarkeit liegt unter
`agents.defaults.skills` und `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
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

Für integrierte Bilderzeugung/-bearbeitung bevorzugen Sie `agents.defaults.imageGenerationModel`
zusammen mit dem zentralen Tool `image_generate`. `skills.entries.*` ist nur für benutzerdefinierte
oder Drittanbieter-Skill-Workflows vorgesehen.

Wenn Sie einen bestimmten Bild-Provider bzw. ein bestimmtes Modell auswählen, konfigurieren Sie auch den
Auth-/API-Schlüssel dieses Providers. Typische Beispiele: `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für
`google/*`, `OPENAI_API_KEY` für `openai/*` und `FAL_KEY` für `fal/*`.

Beispiele:

- Native Einrichtung im Nano-Banana-Pro-Stil: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native fal-Einrichtung: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Agent-Skill-Allowlists

Verwenden Sie die Agent-Konfiguration, wenn Sie dieselben Skill-Roots für Maschine/Workspace nutzen möchten, aber pro Agent
einen anderen sichtbaren Skill-Satz benötigen.

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

- `agents.defaults.skills`: gemeinsam genutzte Basis-Allowlist für Agenten, die
  `agents.list[].skills` weglassen.
- Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig uneingeschränkt zu lassen.
- `agents.list[].skills`: expliziter endgültiger Skill-Satz für diesen Agenten; er wird nicht
  mit Defaults zusammengeführt.
- `agents.list[].skills: []`: stellt diesem Agenten keine Skills bereit.

## Felder

- Integrierte Skill-Roots enthalten immer `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` und `<workspace>/skills`.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in der Liste zulässig (verwaltete, Agent- und Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche Skill-Verzeichnisse, die durchsucht werden sollen (niedrigste Priorität).
- `load.allowSymlinkTargets`: vertrauenswürdige reale Zielverzeichnisse, in die symbolisch verknüpfte
  Skill-Ordner aufgelöst werden dürfen, auch wenn der Symlink außerhalb dieses
  Ziel-Roots liegt. Verwenden Sie dies für beabsichtigte Layouts mit benachbarten Repos wie
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: Skill-Ordner beobachten und den Skills-Snapshot aktualisieren (Standard: true).
- `load.watchDebounceMs`: Entprellzeit für Skill-Watcher-Ereignisse in Millisekunden (Standard: 250).
- `install.preferBrew`: brew-Installer bevorzugen, wenn verfügbar (Standard: true).
- `install.nodeManager`: bevorzugter Node-Installer (`npm` | `pnpm` | `yarn` | `bun`, Standard: npm).
  Dies wirkt sich nur auf **Skill-Installationen** aus; die Gateway-Laufzeit sollte weiterhin Node sein
  (Bun wird für WhatsApp/Telegram nicht empfohlen).
  - `openclaw setup --node-manager` ist enger gefasst und akzeptiert derzeit `npm`,
    `pnpm` oder `bun`. Setzen Sie `skills.install.nodeManager: "yarn"` manuell, wenn Sie
    Yarn-gestützte Skill-Installationen möchten.
- `install.allowUploadedArchives`: vertrauenswürdigen `operator.admin`-Gateway-
  Clients erlauben, private ZIP-Archive zu installieren, die über `skills.upload.*`
  bereitgestellt wurden (Standard: false). Dies aktiviert nur den Pfad für hochgeladene Archive; normale ClawHub-
  Installationen benötigen dies nicht.
- `entries.<skillKey>`: Überschreibungen pro Skill.
- `agents.defaults.skills`: optionale Standard-Skill-Allowlist, die von Agenten geerbt wird,
  die `agents.list[].skills` weglassen.
- `agents.list[].skills`: optionale endgültige Skill-Allowlist pro Agent; explizite
  Listen ersetzen geerbte Defaults, statt sie zusammenzuführen.

## Per Symlink eingebundene benachbarte Repos

Standardmäßig ist jeder Skill-Root eine Begrenzung. Wenn ein Skill-Ordner unter
`~/.agents/skills` ein Symlink ist, der außerhalb von `~/.agents/skills` aufgelöst wird,
überspringt OpenClaw ihn und protokolliert `Skipping escaped skill path outside its configured
root`.

Behalten Sie das Symlink-Layout bei und erlauben Sie nur den vertrauenswürdigen Ziel-Root:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Mit dieser Konfiguration wird ein Symlink wie
`~/.agents/skills/manager -> ~/Projects/manager/skills` nach der
realpath-Auflösung akzeptiert. `extraDirs` durchsucht außerdem das benachbarte Repo direkt, während
`allowSymlinkTargets` den per Symlink eingebundenen Pfad für vorhandene Agent-Skill-
Layouts beibehält. Halten Sie Zieleinträge eng gefasst; verweisen Sie nicht auf breite Roots wie `~` oder
`~/Projects`, es sei denn, jeder Skill-Tree unter diesem Root ist vertrauenswürdig.

Felder pro Skill:

- `enabled`: auf `false` setzen, um einen Skill zu deaktivieren, selbst wenn er gebündelt/installiert ist.
- `env`: Umgebungsvariablen, die für den Agent-Lauf injiziert werden (nur wenn noch nicht gesetzt).
- `apiKey`: optionale Komfortfunktion für Skills, die eine primäre Umgebungsvariable deklarieren.
  Unterstützt Klartext-String oder SecretRef-Objekt (`{ source, provider, id }`).

## Hinweise

- Schlüssel unter `entries` werden standardmäßig dem Skill-Namen zugeordnet. Wenn ein Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen Schlüssel.
- Die Ladepriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills →
  `skills.load.extraDirs`.
- Änderungen an Skills werden beim nächsten Agent-Turn übernommen, wenn der Watcher aktiviert ist.

### Sandboxed Skills und Umgebungsvariablen

Wenn eine Sitzung **sandboxed** ist, laufen Skill-Prozesse innerhalb des konfigurierten Sandbox-Backends. Die Sandbox erbt **nicht** das Host-`process.env`.

<Warning>
  Globale `env` und `skills.entries.<skill>.env`/`apiKey` gelten nur für **Host**-Läufe. Innerhalb einer Sandbox haben sie keine Wirkung, sodass ein Skill, der von `GEMINI_API_KEY` abhängt, mit `apiKey not configured` fehlschlägt, sofern die Variable der Sandbox nicht separat übergeben wird.
</Warning>

Verwenden Sie eines von:

- `agents.defaults.sandbox.docker.env` für das Docker-Backend (oder pro Agent `agents.list[].sandbox.docker.env`).
- Backen Sie die Umgebungsvariablen in Ihr benutzerdefiniertes Sandbox-Image oder Ihre Remote-Sandbox-Umgebung ein.

## Verwandt

<CardGroup cols={2}>
  <Card title="Skills" href="/de/tools/skills" icon="puzzle-piece">
    Was Skills sind und wie sie geladen werden.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Benutzerdefinierte Skill-Pakete erstellen.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Nativer Befehlskatalog und Chat-Direktiven.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Schema für `skills` und `agents.skills`.
  </Card>
</CardGroup>
