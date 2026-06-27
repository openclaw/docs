---
read_when:
    - Sie möchten ein mit Codex, Claude oder Cursor kompatibles Bundle installieren
    - Sie müssen verstehen, wie OpenClaw Bundle-Inhalte nativen Funktionen zuordnet
    - Fehlersuche bei der Bundle-Erkennung oder fehlenden Fähigkeiten
summary: Codex-, Claude- und Cursor-Bundles als OpenClaw-Plugins installieren und verwenden
title: Plugin-Bundles
x-i18n:
    generated_at: "2026-06-27T17:44:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kann Plugins aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese heißen **Bundles** – Inhalts- und Metadatenpakete, die
OpenClaw nativen Funktionen wie Skills, Hooks und MCP-Tools zuordnet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugins. Native Plugins laufen
  im Prozess und können jede Capability registrieren. Bundles sind Inhaltspakete mit
  selektivem Feature-Mapping und einer engeren Vertrauensgrenze.
</Info>

## Warum es Bundles gibt

Viele nützliche Plugins werden im Codex-, Claude- oder Cursor-Format veröffentlicht. Anstatt
Autorinnen und Autoren zu verlangen, sie als native OpenClaw-Plugins neu zu schreiben, erkennt OpenClaw
diese Formate und ordnet ihre unterstützten Inhalte dem nativen Funktionsumfang zu. Das bedeutet, Sie können ein Claude-Befehlspaket oder ein Codex-Skill-Bundle installieren
und es sofort verwenden.

## Ein Bundle installieren

<Steps>
  <Step title="Aus einem Verzeichnis, Archiv oder Marketplace installieren">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
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

  <Step title="Neu starten und verwenden">
    ```bash
    openclaw gateway restart
    ```

    Zugeordnete Funktionen (Skills, Hooks, MCP-Tools, LSP-Standards) sind in der nächsten Sitzung verfügbar.

  </Step>
</Steps>

## Was OpenClaw aus Bundles zuordnet

Nicht jede Bundle-Funktion läuft heute in OpenClaw. Hier sehen Sie, was funktioniert und was
erkannt, aber noch nicht verdrahtet ist.

### Jetzt unterstützt

| Feature       | Wie es zugeordnet wird                                                                            | Gilt für       |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Skill-Inhalt  | Bundle-Skill-Roots werden als normale OpenClaw-Skills geladen                                     | Alle Formate   |
| Befehle       | `commands/` und `.cursor/commands/` werden als Skill-Roots behandelt                              | Claude, Cursor |
| Hook-Pakete   | OpenClaw-artige Layouts mit `HOOK.md` + `handler.ts`                                              | Codex          |
| MCP-Tools     | Bundle-MCP-Konfiguration wird in eingebettete OpenClaw-Einstellungen zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate   |
| LSP-Server    | Claude `.lsp.json` und im Manifest deklarierte `lspServers` werden in eingebettete OpenClaw-LSP-Standards zusammengeführt | Claude         |
| Einstellungen | Claude `settings.json` wird als eingebettete OpenClaw-Standardeinstellungen importiert            | Claude         |

#### Skill-Inhalt

- Bundle-Skill-Roots werden als normale OpenClaw-Skill-Roots geladen
- Claude-`commands`-Roots werden als zusätzliche Skill-Roots behandelt
- Cursor-`.cursor/commands`-Roots werden als zusätzliche Skill-Roots behandelt

Das bedeutet, dass Claude-Markdown-Befehlsdateien über den normalen OpenClaw-Skill-
Loader funktionieren. Cursor-Befehls-Markdown funktioniert über denselben Pfad.

#### Hook-Pakete

- Bundle-Hook-Roots funktionieren **nur**, wenn sie das normale OpenClaw-Hook-Paket-
  Layout verwenden. Heute ist dies hauptsächlich der Codex-kompatible Fall:
  - `HOOK.md`
  - `handler.ts` oder `handler.js`

#### MCP für eingebettetes OpenClaw

- aktivierte Bundles können MCP-Serverkonfiguration beitragen
- OpenClaw führt Bundle-MCP-Konfiguration in den wirksamen eingebetteten OpenClaw-Einstellungen als
  `mcpServers` zusammen
- OpenClaw stellt unterstützte Bundle-MCP-Tools während eingebetteter OpenClaw-Agent-Turns bereit, indem
  stdio-Server gestartet oder Verbindungen zu HTTP-Servern hergestellt werden
- die Tool-Profile `coding` und `messaging` enthalten Bundle-MCP-Tools standardmäßig;
  verwenden Sie `tools.deny: ["bundle-mcp"]`, um sich für einen Agent oder Gateway abzumelden
- projektlokale eingebettete Agent-Einstellungen gelten weiterhin nach den Bundle-Standards, sodass Workspace-
  Einstellungen Bundle-MCP-Einträge bei Bedarf überschreiben können
- Bundle-MCP-Toolkataloge werden vor der Registrierung deterministisch sortiert, sodass
  Änderungen der Upstream-Reihenfolge von `listTools()` die Prompt-Cache-Tool-Blöcke nicht durcheinanderbringen

##### Transporte

MCP-Server können stdio- oder HTTP-Transport verwenden:

**Stdio** startet einen Child-Prozess:

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

**HTTP** verbindet sich standardmäßig über `sse` mit einem laufenden MCP-Server oder auf Anforderung über `streamable-http`:

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

- `transport` kann auf `"streamable-http"` oder `"sse"` gesetzt werden; wenn es ausgelassen wird, verwendet OpenClaw `sse`
- `type: "http"` ist eine CLI-native Downstream-Form; verwenden Sie `transport: "streamable-http"` in der OpenClaw-Konfiguration. `openclaw mcp set` und `openclaw doctor --fix` normalisieren den gängigen Alias.
- nur URL-Schemata `http:` und `https:` sind erlaubt
- `headers`-Werte unterstützen `${ENV_VAR}`-Interpolation
- ein Servereintrag mit sowohl `command` als auch `url` wird abgelehnt
- URL-Anmeldedaten (userinfo und Query-Parameter) werden aus Tool-
  Beschreibungen und Logs entfernt
- `connectionTimeoutMs` überschreibt das standardmäßige Verbindungs-Timeout von 30 Sekunden für
  sowohl stdio- als auch HTTP-Transporte

##### Tool-Benennung

OpenClaw registriert Bundle-MCP-Tools mit Provider-sicheren Namen in der Form
`serverName__toolName`. Zum Beispiel wird ein Server mit dem Schlüssel `"vigil-harbor"`, der ein
`memory_search`-Tool bereitstellt, als `vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt
- Fragmente, die mit einem Nicht-Buchstaben beginnen würden, erhalten ein Buchstabenpräfix, sodass numerische
  Server-Schlüssel wie `12306` zu Provider-sicheren Tool-Präfixen werden
- Server-Präfixe sind auf 30 Zeichen begrenzt
- vollständige Tool-Namen sind auf 64 Zeichen begrenzt
- leere Servernamen fallen auf `mcp` zurück
- kollidierende bereinigte Namen werden mit numerischen Suffixen eindeutig gemacht
- die endgültige offengelegte Tool-Reihenfolge ist nach sicherem Namen deterministisch, um wiederholte eingebettete Agent-
  Turns cache-stabil zu halten
- Profilfilterung behandelt alle Tools eines Bundle-MCP-Servers als Plugin-eigen
  durch `bundle-mcp`, sodass Profil-Allowlists und Deny-Listen entweder
  einzelne offengelegte Tool-Namen oder den Plugin-Schlüssel `bundle-mcp` enthalten können

#### Eingebettete OpenClaw-Einstellungen

- Claude `settings.json` wird als eingebettete OpenClaw-Standardeinstellungen importiert, wenn das
  Bundle aktiviert ist
- OpenClaw bereinigt Shell-Override-Schlüssel, bevor es sie anwendet

Bereinigte Schlüssel:

- `shellPath`
- `shellCommandPrefix`

#### Eingebettetes OpenClaw-LSP

- aktivierte Claude-Bundles können LSP-Serverkonfiguration beitragen
- OpenClaw lädt `.lsp.json` plus alle im Manifest deklarierten `lspServers`-Pfade
- Bundle-LSP-Konfiguration wird in die wirksamen eingebetteten OpenClaw-LSP-Standards zusammengeführt
- nur unterstützte stdio-gestützte LSP-Server sind heute ausführbar; nicht unterstützte
  Transporte erscheinen weiterhin in `openclaw plugins inspect <id>`

### Erkannt, aber nicht ausgeführt

Diese werden erkannt und in Diagnosen angezeigt, aber OpenClaw führt sie nicht aus:

- Claude `agents`, `hooks.json`-Automatisierung, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-Inline-/App-Metadaten über Capability-Berichte hinaus

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
    - **Ohne Manifest:** Standard-Claude-Layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-spezifisches Verhalten:

    - `commands/` wird als Skill-Inhalt behandelt
    - `settings.json` wird in eingebettete OpenClaw-Einstellungen importiert (Shell-Override-Schlüssel werden bereinigt)
    - `.mcp.json` stellt unterstützte stdio-Tools für eingebettetes OpenClaw bereit
    - `.lsp.json` plus im Manifest deklarierte `lspServers`-Pfade werden in eingebettete OpenClaw-LSP-Standards geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - Benutzerdefinierte Komponentenpfade im Manifest sind additiv (sie erweitern Standards, ersetzen sie nicht)

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Marker: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` sind nur Erkennung

  </Accordion>
</AccordionGroup>

## Erkennungspriorität

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder gültiges `package.json` mit `openclaw.extensions` – wird als **natives Plugin** behandelt
2. Bundle-Marker (`.codex-plugin/`, `.claude-plugin/` oder Standard-Claude-/Cursor-Layout) – wird als **Bundle** behandelt

Wenn ein Verzeichnis beides enthält, verwendet OpenClaw den nativen Pfad. Dies verhindert,
dass Dual-Format-Pakete teilweise als Bundles installiert werden.

## Laufzeitabhängigkeiten und Bereinigung

- Kompatible Bundles von Drittanbietern erhalten keine `npm install`-Reparatur beim Start. Sie
  sollten über `openclaw plugins install` installiert werden und alles, was
  sie benötigen, im installierten Plugin-Verzeichnis mitliefern.
- OpenClaw-eigene gebündelte Plugins werden entweder schlank im Core ausgeliefert oder
  über den Plugin-Installer heruntergeladen. Der Gateway-Start führt für sie nie einen
  Package Manager aus.
- `openclaw doctor --fix` entfernt alte bereitgestellte Abhängigkeitsverzeichnisse und kann
  herunterladbare Plugins wiederherstellen, die im lokalen Plugin-Index fehlen, wenn
  die Konfiguration auf sie verweist.

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugins:

- OpenClaw lädt **keine** beliebigen Bundle-Laufzeitmodule im Prozess
- Skills und Hook-Paket-Pfade müssen innerhalb des Plugin-Roots bleiben (Boundary-geprüft)
- Einstellungsdateien werden mit denselben Boundary-Prüfungen gelesen
- Unterstützte stdio-MCP-Server können als Subprozesse gestartet werden

Das macht Bundles standardmäßig sicherer, aber Sie sollten Drittanbieter-
Bundles dennoch als vertrauenswürdigen Inhalt für die Funktionen behandeln, die sie bereitstellen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bundle wird erkannt, aber Capabilities laufen nicht">
    Führen Sie `openclaw plugins inspect <id>` aus. Wenn eine Capability aufgeführt, aber als
    nicht verdrahtet markiert ist, ist das eine Produktgrenze – keine fehlerhafte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien erscheinen nicht">
    Stellen Sie sicher, dass das Bundle aktiviert ist und die Markdown-Dateien sich innerhalb eines erkannten
    `commands/`- oder `skills/`-Roots befinden.
  </Accordion>

  <Accordion title="Claude-Einstellungen werden nicht angewendet">
    Nur eingebettete OpenClaw-Einstellungen aus `settings.json` werden unterstützt. OpenClaw behandelt
    Bundle-Einstellungen nicht als rohe Konfigurations-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` ist nur Erkennung. Wenn Sie ausführbare Hooks benötigen, verwenden Sie das
    OpenClaw-Hook-Paket-Layout oder liefern Sie ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugins installieren und konfigurieren](/de/tools/plugin)
- [Plugins erstellen](/de/plugins/building-plugins) – ein natives Plugin erstellen
- [Plugin-Manifest](/de/plugins/manifest) – natives Manifest-Schema
