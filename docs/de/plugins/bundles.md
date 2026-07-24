---
read_when:
    - Sie möchten ein mit Codex, Claude oder Cursor kompatibles Bundle installieren
    - Sie müssen verstehen, wie OpenClaw Bundle-Inhalte nativen Funktionen zuordnet
    - Sie debuggen die Bundle-Erkennung oder fehlende Funktionen
summary: Codex-, Claude- und Cursor-Bundles als OpenClaw-Plugins installieren und verwenden
title: Plugin-Pakete
x-i18n:
    generated_at: "2026-07-24T04:31:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kann Plugins aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese werden als **Bundles** bezeichnet – Inhalts- und Metadatenpakete, die
OpenClaw nativen Funktionen wie Skills, Hooks und MCP-Tools zuordnet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugins. Native Plugins werden
  prozessintern ausgeführt und können beliebige Fähigkeiten registrieren. Bundles sind Inhaltspakete mit
  selektiver Funktionszuordnung und einer engeren Vertrauensgrenze.
</Info>

## Warum es Bundles gibt

Viele nützliche Plugins werden im Codex-, Claude- oder Cursor-Format veröffentlicht. Anstatt
von Autoren zu verlangen, sie als native OpenClaw-Plugins neu zu schreiben, erkennt OpenClaw
diese Formate und ordnet ihre unterstützten Inhalte dem nativen Funktionsumfang
zu. Sie können ein Claude-Befehlspaket oder ein Codex-Skill-Bundle installieren und es
sofort verwenden.

## Ein Bundle installieren

<Steps>
  <Step title="Aus einem Verzeichnis, Archiv oder Marketplace installieren">
    ```bash
    # Lokales Verzeichnis
    openclaw plugins install ./my-bundle

    # Archiv
    openclaw plugins install ./my-bundle.tgz

    # Claude-Marketplace
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` ist ein lokaler Marketplace-Pfad bzw. ein lokales Repository oder eine Git-/GitHub-Quelle.

  </Step>

  <Step title="Erkennung überprüfen">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles zeigen `Format: bundle` sowie einen `Bundle format:`-Wert von `codex`,
    `claude` oder `cursor` an.

  </Step>

  <Step title="Neu starten und verwenden">
    ```bash
    openclaw gateway restart
    ```

    Zugeordnete Funktionen (Skills, Hooks, MCP-Tools, LSP-Standardwerte) sind in der nächsten Sitzung verfügbar.

  </Step>
</Steps>

## Was OpenClaw aus Bundles zuordnet

Derzeit werden nicht alle Bundle-Funktionen in OpenClaw ausgeführt. Nachfolgend ist aufgeführt, was funktioniert und was
erkannt, aber noch nicht angebunden wird.

### Derzeit unterstützt

| Funktion      | Zuordnung                                                                                         | Gilt für       |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Skill-Inhalte | Bundle-Skill-Wurzeln werden als normale OpenClaw-Skills geladen                                   | Alle Formate   |
| Befehle       | `commands/` und `.cursor/commands/` werden als Skill-Wurzeln behandelt                      | Claude, Cursor |
| Hook-Pakete   | OpenClaw-artige Layouts mit `HOOK.md` + `handler.ts`                               | Codex          |
| MCP-Tools     | Bundle-MCP-Konfiguration wird mit eingebetteten OpenClaw-Einstellungen zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate |
| LSP-Server    | Claude-`.lsp.json` und im Manifest deklarierte `lspServers` werden mit den eingebetteten OpenClaw-LSP-Standardwerten zusammengeführt | Claude |
| Einstellungen | Claude-`settings.json` wird als eingebettete OpenClaw-Standardwerte importiert                 | Claude         |

#### Skill-Inhalte

- Bundle-Skill-Wurzeln werden als normale OpenClaw-Skill-Wurzeln geladen.
- Claude-`commands/`-Wurzeln werden als zusätzliche Skill-Wurzeln behandelt.
- Cursor-`.cursor/commands/`-Wurzeln werden als zusätzliche Skill-Wurzeln behandelt.

Claude-Markdown-Befehlsdateien und Cursor-Befehls-Markdown funktionieren beide über den
normalen OpenClaw-Skill-Loader.

#### Hook-Pakete

Bundle-Hook-Wurzeln funktionieren **nur**, wenn sie das normale OpenClaw-Hook-Paket-
Layout verwenden: `HOOK.md` plus `handler.ts` oder `handler.js`. Derzeit ist dies hauptsächlich
bei Codex-kompatiblen Bundles der Fall.

#### MCP für eingebettetes OpenClaw

- Aktivierte Bundles können MCP-Serverkonfigurationen bereitstellen.
- OpenClaw führt die Bundle-MCP-Konfiguration als `mcpServers` mit den effektiven
  eingebetteten OpenClaw-Einstellungen zusammen.
- OpenClaw stellt unterstützte Bundle-MCP-Tools während eingebetteter OpenClaw-Agenten-
  Durchläufe bereit, indem es stdio-Server startet oder Verbindungen zu HTTP-Servern herstellt.
- Die Tool-Profile `coding` und `messaging` enthalten standardmäßig Bundle-MCP-Tools;
  verwenden Sie `tools.deny: ["bundle-mcp"]`, um sie für einen Agenten oder Gateway zu deaktivieren.
- Projektlokale Einstellungen für eingebettete Agenten werden weiterhin nach den Bundle-Standardwerten angewendet, sodass
  Workspace-Einstellungen Bundle-MCP-Einträge bei Bedarf überschreiben können.
- Bundle-MCP-Toolkataloge werden vor der Registrierung deterministisch sortiert, sodass
  Änderungen an der Reihenfolge von `listTools()` im Upstream die Tool-Blöcke des Prompt-Caches nicht ständig verändern.

##### Transportarten

MCP-Server können stdio- oder HTTP-Transport verwenden.

**Stdio** startet einen untergeordneten Prozess:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** stellt eine Verbindung zu einem laufenden MCP-Server her und verwendet standardmäßig `sse`, sofern nicht
`streamable-http` angefordert wird:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` akzeptiert `"streamable-http"` oder `"sse"`; bei Auslassung wird standardmäßig `sse` verwendet.
- `type: "http"` ist eine CLI-native Downstream-Struktur; verwenden Sie `transport: "streamable-http"` in der OpenClaw-Konfiguration. `openclaw mcp set` und `openclaw doctor --fix` normalisieren den gebräuchlichen Alias.
- Es sind nur die URL-Schemata `http:` und `https:` zulässig.
- `headers`-Werte unterstützen die Interpolation von `${ENV_VAR}`.
- Ein Servereintrag, der sowohl `command` als auch `url` enthält, wird abgelehnt.
- URL-Anmeldedaten (Benutzerinformationen und Abfrageparameter) werden in Tool-
  Beschreibungen und Protokollen unkenntlich gemacht.
- `connectionTimeoutMs` überschreibt das standardmäßige Verbindungszeitlimit von 30 Sekunden für
  sowohl stdio- als auch HTTP-Transporte. Das Anforderungszeitlimit beträgt standardmäßig 60 Sekunden und
  kann mit `requestTimeoutMs` überschrieben werden.

##### Tool-Benennung

OpenClaw registriert Bundle-MCP-Tools mit Provider-sicheren Namen im Format
`serverName__toolName`. Beispielsweise wird ein Server mit dem Schlüssel `"vigil-harbor"`, der ein
`memory_search`-Tool bereitstellt, als `vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt.
- Fragmente, die mit einem Nichtbuchstaben beginnen würden, erhalten ein Buchstabenpräfix, sodass numerische
  Serverschlüssel wie `12306` zu Provider-sicheren Tool-Präfixen werden.
- Serverpräfixe sind auf 30 Zeichen begrenzt.
- Vollständige Tool-Namen sind auf 64 Zeichen begrenzt.
- Leere Servernamen verwenden ersatzweise `mcp`.
- Kollidierende bereinigte Namen werden durch numerische Suffixe eindeutig gemacht.
- Die endgültige Reihenfolge der bereitgestellten Tools wird deterministisch nach sicherem Namen festgelegt, sodass wiederholte
  Durchläufe eingebetteter Agenten cache-stabil bleiben.
- Bei der Profilfilterung werden alle Tools eines Bundle-MCP-Servers als
  Plugin-eigen unter `bundle-mcp` behandelt, sodass Zulassungs-/Sperrlisten von Profilen
  entweder einzelne bereitgestellte Tool-Namen oder den Plugin-Schlüssel `bundle-mcp` referenzieren können.

#### Einstellungen für eingebettetes OpenClaw

Claude-`settings.json` wird bei aktiviertem Bundle als Standardeinstellung für eingebettetes OpenClaw
importiert. OpenClaw bereinigt Schlüssel für Shell-Überschreibungen, bevor sie angewendet
werden:

- `shellPath`
- `shellCommandPrefix`

#### LSP für eingebettetes OpenClaw

- Aktivierte Claude-Bundles können LSP-Serverkonfigurationen bereitstellen.
- OpenClaw lädt `.lsp.json` sowie alle im Manifest deklarierten `lspServers`-Pfade.
- Die Bundle-LSP-Konfiguration wird mit den effektiven LSP-Standardwerten des eingebetteten OpenClaw
  zusammengeführt.
- Derzeit können nur unterstützte stdio-basierte LSP-Server ausgeführt werden; nicht unterstützte
  Transportarten werden weiterhin in `openclaw plugins inspect <id>` angezeigt.

### Erkannt, aber nicht ausgeführt

Diese werden erkannt und in der Diagnose angezeigt, aber von OpenClaw nicht ausgeführt:

- Claude-`agents`, `hooks/hooks.json`-Automatisierung, `outputStyles`
- Cursor-`.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-`.app.json`-Metadaten über die Meldung von Fähigkeiten hinaus

## Bundle-Formate

<AccordionGroup>
  <Accordion title="Codex-Bundles">
    Markierungen: `.codex-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-Bundles passen am besten zu OpenClaw, wenn sie Skill-Wurzeln und OpenClaw-artige
    Hook-Paket-Verzeichnisse (`HOOK.md` + `handler.ts`) verwenden.

  </Accordion>

  <Accordion title="Claude-Bundles">
    Zwei Erkennungsmodi:

    - **Manifestbasiert:** `.claude-plugin/plugin.json`
    - **Ohne Manifest:** Claude-Standardlayout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-spezifisches Verhalten:

    - `commands/` wird als Skill-Inhalt behandelt
    - `settings.json` wird in die Einstellungen für eingebettetes OpenClaw importiert (Schlüssel für Shell-Überschreibungen werden bereinigt)
    - `.mcp.json` stellt unterstützte stdio-Tools für eingebettetes OpenClaw bereit
    - `.lsp.json` sowie im Manifest deklarierte `lspServers`-Pfade werden in die LSP-Standardwerte des eingebetteten OpenClaw geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - Benutzerdefinierte Komponentenpfade im Manifest sind additiv; sie erweitern die Standardwerte, statt sie zu ersetzen

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Markierungen: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` werden nur erkannt

  </Accordion>
</AccordionGroup>

## Erkennungsreihenfolge

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder ein gültiges `package.json` mit `openclaw.extensions` – wird als **natives Plugin** behandelt
2. Bundle-Markierungen (`.codex-plugin/`, `.claude-plugin/` oder Claude-/Cursor-Standardlayout) – wird als **Bundle** behandelt

Wenn ein Verzeichnis beide Formate enthält, verwendet OpenClaw den nativen Pfad. Dadurch wird verhindert,
dass Pakete mit zwei Formaten teilweise als Bundles installiert werden.

## Laufzeitabhängigkeiten und Bereinigung

- Kompatible Bundles von Drittanbietern erhalten beim Start keine `npm install`-Reparatur. Sie
  sollten über `openclaw plugins install` installiert werden und alles, was
  sie benötigen, im installierten Plugin-Verzeichnis mitliefern.
- OpenClaw-eigene gebündelte Plugins werden entweder schlank im Kern ausgeliefert oder
  können über das Plugin-Installationsprogramm heruntergeladen werden. Beim Start des Gateway wird für sie niemals ein
  Paketmanager ausgeführt.
- `openclaw doctor --fix` entfernt veraltete lokale Installationsdatensätze gebündelter Plugins
  und kann herunterladbare Plugins wiederherstellen, die im lokalen Plugin-
  Index fehlen, wenn die Konfiguration weiterhin auf sie verweist.

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugins:

- OpenClaw lädt **keine** beliebigen Bundle-Laufzeitmodule prozessintern.
- Pfade für Skills und Hook-Pakete müssen innerhalb der Plugin-Wurzel bleiben (Grenzprüfung).
- Einstellungsdateien werden mit denselben Grenzprüfungen gelesen.
- Unterstützte stdio-MCP-Server können als Unterprozesse gestartet werden.

Dadurch sind Bundles standardmäßig sicherer, dennoch sollten Sie Bundles von Drittanbietern
für die Funktionen, die sie bereitstellen, als vertrauenswürdige Inhalte behandeln.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bundle wird erkannt, aber Funktionen werden nicht ausgeführt">
    Führen Sie `openclaw plugins inspect <id>` aus. Wenn eine Funktion aufgeführt, aber als
    nicht angebunden gekennzeichnet ist, handelt es sich um eine Produktbeschränkung und nicht um eine fehlerhafte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien werden nicht angezeigt">
    Stellen Sie sicher, dass das Bundle aktiviert ist und sich die Markdown-Dateien in einem erkannten
    `commands/`- oder `skills/`-Stammverzeichnis befinden.
  </Accordion>

  <Accordion title="Claude-Einstellungen werden nicht angewendet">
    Es werden nur eingebettete OpenClaw-Einstellungen aus `settings.json` unterstützt. OpenClaw behandelt
    Bundle-Einstellungen nicht als unverarbeitete Konfigurations-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` dient nur der Erkennung. Wenn Sie ausführbare Hooks benötigen, verwenden Sie das
    OpenClaw-Hook-Paketlayout oder liefern Sie ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Plugins installieren und konfigurieren](/de/tools/plugin)
- [Plugins erstellen](/de/plugins/building-plugins) - ein natives Plugin erstellen
- [Plugin-Manifest](/de/plugins/manifest) - natives Manifest-Schema
