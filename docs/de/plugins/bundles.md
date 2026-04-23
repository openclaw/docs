---
read_when:
    - Du möchtest ein mit Codex, Claude oder Cursor kompatibles Bundle installieren
    - Du musst verstehen, wie OpenClaw Bundle-Inhalte auf native Funktionen abbildet
    - Du debuggst Bundle-Erkennung oder fehlende Funktionen
summary: Codex-, Claude- und Cursor-Bundles als OpenClaw-Plugins installieren und verwenden
title: Plugin-Bundles
x-i18n:
    generated_at: "2026-04-23T06:30:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fec13cb1f807231c706318f3e81e27b350d5a0266821cb96c8494c45f01de0
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin-Bundles

OpenClaw kann Plugins aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese werden **Bundles** genannt — Inhalts- und Metadatenpakete, die
OpenClaw auf native Funktionen wie Skills, Hooks und MCP-Tools abbildet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugins. Native Plugins laufen
  in-process und können jede Funktion registrieren. Bundles sind Inhaltspakete mit
  selektiver Funktionsabbildung und einer engeren Vertrauensgrenze.
</Info>

## Warum Bundles existieren

Viele nützliche Plugins werden im Format von Codex, Claude oder Cursor veröffentlicht. Anstatt
von Autorinnen und Autoren zu verlangen, sie als native OpenClaw-Plugins neu zu schreiben, erkennt OpenClaw
diese Formate und bildet ihre unterstützten Inhalte auf den nativen Funktionssatz ab. Das bedeutet,
dass du ein Claude-Befehlspaket oder ein Codex-Skill-Bundle installieren
und sofort verwenden kannst.

## Ein Bundle installieren

<Steps>
  <Step title="Aus einem Verzeichnis, Archiv oder Marketplace installieren">
    ```bash
    # Lokales Verzeichnis
    openclaw plugins install ./my-bundle

    # Archiv
    openclaw plugins install ./my-bundle.tgz

    # Claude-Marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Erkennung prüfen">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles werden als `Format: bundle` mit einem Subtyp von `codex`, `claude` oder `cursor` angezeigt.

  </Step>

  <Step title="Neustarten und verwenden">
    ```bash
    openclaw gateway restart
    ```

    Abgebildete Funktionen (Skills, Hooks, MCP-Tools, LSP-Standards) sind in der nächsten Sitzung verfügbar.

  </Step>
</Steps>

## Was OpenClaw aus Bundles abbildet

Nicht jede Bundle-Funktion läuft heute in OpenClaw. Hier ist, was funktioniert und was
erkannt, aber noch nicht verdrahtet ist.

### Jetzt unterstützt

| Funktion      | Wie sie abgebildet wird                                                                    | Gilt für       |
| ------------- | ------------------------------------------------------------------------------------------ | -------------- |
| Skill-Inhalt  | Skill-Roots des Bundles werden als normale OpenClaw-Skills geladen                         | Alle Formate   |
| Befehle       | `commands/` und `.cursor/commands/` werden als Skill-Roots behandelt                       | Claude, Cursor |
| Hook-Pakete   | OpenClaw-artige Layouts mit `HOOK.md` + `handler.ts`                                       | Codex          |
| MCP-Tools     | MCP-Konfiguration des Bundles wird in eingebettete Pi-Einstellungen zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate   |
| LSP-Server    | Claude `.lsp.json` und im Manifest deklarierte `lspServers` werden in eingebettete Pi-LSP-Standards zusammengeführt | Claude         |
| Einstellungen | Claude `settings.json` wird als eingebettete Pi-Standards importiert                       | Claude         |

#### Skill-Inhalt

- Skill-Roots des Bundles werden als normale OpenClaw-Skill-Roots geladen
- Claude-Roots `commands` werden als zusätzliche Skill-Roots behandelt
- Cursor-Roots `.cursor/commands` werden als zusätzliche Skill-Roots behandelt

Das bedeutet, dass Markdown-Befehlsdateien von Claude über den normalen OpenClaw-Skill-
Loader funktionieren. Markdown-Befehle von Cursor funktionieren über denselben Pfad.

#### Hook-Pakete

- Hook-Roots des Bundles funktionieren **nur**, wenn sie das normale OpenClaw-Hook-Paket-
  Layout verwenden. Heute ist dies hauptsächlich der mit Codex kompatible Fall:
  - `HOOK.md`
  - `handler.ts` oder `handler.js`

#### MCP für Pi

- aktivierte Bundles können MCP-Serverkonfiguration beitragen
- OpenClaw führt MCP-Konfiguration aus Bundles in die effektiven eingebetteten Pi-Einstellungen als
  `mcpServers` zusammen
- OpenClaw stellt unterstützte Bundle-MCP-Tools während eingebetteter Pi-Agent-Turns bereit, indem
  stdio-Server gestartet oder Verbindungen zu HTTP-Servern hergestellt werden
- die Tool-Profile `coding` und `messaging` enthalten Bundle-MCP-Tools standardmäßig; verwende `tools.deny: ["bundle-mcp"]`, um sie für einen Agenten oder das Gateway zu deaktivieren
- projektlokale Pi-Einstellungen gelten weiterhin nach den Bundle-Standards, sodass Workspace-
  Einstellungen bei Bedarf Bundle-MCP-Einträge überschreiben können
- Tool-Kataloge von Bundle-MCP werden vor der Registrierung deterministisch sortiert, sodass
  Änderungen an der Upstream-Reihenfolge von `listTools()` keine Prompt-Cache-Tool-Blöcke durcheinanderbringen

##### Transporte

MCP-Server können stdio- oder HTTP-Transport verwenden:

**Stdio** startet einen Kindprozess:

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

**HTTP** verbindet sich standardmäßig über `sse` mit einem laufenden MCP-Server oder bei Anforderung über `streamable-http`:

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

- `transport` kann auf `"streamable-http"` oder `"sse"` gesetzt werden; wenn es weggelassen wird, verwendet OpenClaw `sse`
- nur URL-Schemata `http:` und `https:` sind erlaubt
- `headers`-Werte unterstützen `${ENV_VAR}`-Interpolation
- ein Servereintrag mit sowohl `command` als auch `url` wird abgelehnt
- URL-Anmeldedaten (userinfo und Query-Parameter) werden aus Tool-
  Beschreibungen und Logs redigiert
- `connectionTimeoutMs` überschreibt das Standard-Verbindungs-Timeout von 30 Sekunden für
  sowohl stdio- als auch HTTP-Transporte

##### Tool-Benennung

OpenClaw registriert Bundle-MCP-Tools mit providersicheren Namen im Format
`serverName__toolName`. Zum Beispiel wird ein Server mit dem Schlüssel `"vigil-harbor"`, der ein
Tool `memory_search` bereitstellt, als `vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt
- Serverpräfixe werden auf 30 Zeichen begrenzt
- vollständige Tool-Namen werden auf 64 Zeichen begrenzt
- leere Servernamen fallen auf `mcp` zurück
- kollidierende bereinigte Namen werden mit numerischen Suffixen unterschieden
- die endgültige sichtbare Tool-Reihenfolge ist nach sicherem Namen deterministisch, um wiederholte Pi-
  Turns cache-stabil zu halten
- Profilfilterung behandelt alle Tools von einem Bundle-MCP-Server als plugin-eigen
  für `bundle-mcp`, sodass Allowlists und Deny-Lists von Profilen entweder
  einzelne sichtbare Tool-Namen oder den Plugin-Schlüssel `bundle-mcp` enthalten können

#### Eingebettete Pi-Einstellungen

- Claude `settings.json` wird als Standard für eingebettete Pi-Einstellungen importiert, wenn das
  Bundle aktiviert ist
- OpenClaw bereinigt Shell-Override-Schlüssel, bevor es sie anwendet

Bereinigte Schlüssel:

- `shellPath`
- `shellCommandPrefix`

#### Eingebettetes Pi-LSP

- aktivierte Claude-Bundles können LSP-Serverkonfiguration beitragen
- OpenClaw lädt `.lsp.json` plus alle im Manifest deklarierten Pfade `lspServers`
- die LSP-Konfiguration des Bundles wird in die effektiven eingebetteten Pi-LSP-Standards zusammengeführt
- heute sind nur unterstützte stdio-gestützte LSP-Server ausführbar; nicht unterstützte
  Transporte erscheinen weiterhin in `openclaw plugins inspect <id>`

### Erkannt, aber nicht ausgeführt

Diese werden erkannt und in Diagnosen angezeigt, aber OpenClaw führt sie nicht aus:

- Claude `agents`, Automatisierung `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-Inline-/App-Metadaten über die Funktionsberichterstattung hinaus

## Bundle-Formate

<AccordionGroup>
  <Accordion title="Codex-Bundles">
    Marker: `.codex-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-Bundles passen am besten zu OpenClaw, wenn sie Skill-Roots und OpenClaw-artige
    Hook-Paket-Verzeichnisse (`HOOK.md` + `handler.ts`) verwenden.

  </Accordion>

  <Accordion title="Claude-Bundles">
    Zwei Erkennungsmodi:

    - **Manifestbasiert:** `.claude-plugin/plugin.json`
    - **Ohne Manifest:** Standard-Layout von Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-spezifisches Verhalten:

    - `commands/` wird als Skill-Inhalt behandelt
    - `settings.json` wird in eingebettete Pi-Einstellungen importiert (Shell-Override-Schlüssel werden bereinigt)
    - `.mcp.json` stellt unterstützte stdio-Tools für eingebettetes Pi bereit
    - `.lsp.json` plus im Manifest deklarierte `lspServers`-Pfade werden in eingebettete Pi-LSP-Standards geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - Benutzerdefinierte Komponentenpfade im Manifest sind additiv (sie erweitern Standardwerte, statt sie zu ersetzen)

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Marker: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` werden nur erkannt

  </Accordion>
</AccordionGroup>

## Erkennungspriorität

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder gültige `package.json` mit `openclaw.extensions` — wird als **natives Plugin** behandelt
2. Bundle-Marker (`.codex-plugin/`, `.claude-plugin/` oder Standard-Layout von Claude/Cursor) — wird als **Bundle** behandelt

Wenn ein Verzeichnis beides enthält, verwendet OpenClaw den nativen Pfad. Dies verhindert,
dass Pakete mit Doppelformat teilweise als Bundles installiert werden.

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugins:

- OpenClaw lädt keine beliebigen Laufzeitmodule aus Bundles in-process
- Pfade für Skills und Hook-Pakete müssen innerhalb des Plugin-Roots bleiben (grenzgeprüft)
- Einstellungsdateien werden mit denselben Grenzprüfungen gelesen
- Unterstützte stdio-MCP-Server können als Unterprozesse gestartet werden

Das macht Bundles standardmäßig sicherer, aber du solltest Drittanbieter-
Bundles für die Funktionen, die sie bereitstellen, dennoch als vertrauenswürdige Inhalte behandeln.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bundle wird erkannt, aber Funktionen laufen nicht">
    Führe `openclaw plugins inspect <id>` aus. Wenn eine Funktion aufgeführt, aber als
    nicht verdrahtet markiert ist, handelt es sich um eine Produktgrenze — nicht um eine defekte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien erscheinen nicht">
    Stelle sicher, dass das Bundle aktiviert ist und sich die Markdown-Dateien innerhalb eines erkannten
    `commands/`- oder `skills/`-Roots befinden.
  </Accordion>

  <Accordion title="Claude-Einstellungen werden nicht angewendet">
    Nur eingebettete Pi-Einstellungen aus `settings.json` werden unterstützt. OpenClaw behandelt
    Bundle-Einstellungen nicht als rohe Konfigurations-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` wird nur erkannt. Wenn du ausführbare Hooks brauchst, verwende das
    OpenClaw-Hook-Paket-Layout oder liefere ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugins installieren und konfigurieren](/de/tools/plugin)
- [Plugins erstellen](/de/plugins/building-plugins) — ein natives Plugin erstellen
- [Plugin-Manifest](/de/plugins/manifest) — natives Manifestschema
