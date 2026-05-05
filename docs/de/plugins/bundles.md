---
read_when:
    - Sie möchten ein Codex-, Claude- oder Cursor-kompatibles Bundle installieren
    - Sie müssen verstehen, wie OpenClaw Bundle-Inhalte nativen Funktionen zuordnet.
    - Sie debuggen die Bundle-Erkennung oder fehlende Funktionen
summary: Codex-, Claude- und Cursor-Pakete als OpenClaw-Plugins installieren und verwenden
title: Plugin-Bundles
x-i18n:
    generated_at: "2026-05-05T01:47:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kann Plugins aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese heißen **Bundles**: Inhalts- und Metadatenpakete, die
OpenClaw nativen Funktionen wie Skills, Hooks und MCP-Tools zuordnet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugins. Native Plugins laufen
  im Prozess und können jede Fähigkeit registrieren. Bundles sind Inhaltspakete mit
  selektiver Funktionszuordnung und einer engeren Vertrauensgrenze.
</Info>

## Warum es Bundles gibt

Viele nützliche Plugins werden im Codex-, Claude- oder Cursor-Format veröffentlicht. Statt
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

### Derzeit unterstützt

| Funktion      | Zuordnung                                                                                   | Gilt für       |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill-Inhalt  | Bundle-Skill-Roots werden als normale OpenClaw-Skills geladen                               | Alle Formate   |
| Befehle       | `commands/` und `.cursor/commands/` werden als Skill-Roots behandelt                        | Claude, Cursor |
| Hook-Pakete   | OpenClaw-artige Layouts mit `HOOK.md` + `handler.ts`                                        | Codex          |
| MCP-Tools     | Bundle-MCP-Konfiguration wird in eingebettete Pi-Einstellungen zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate   |
| LSP-Server    | Claude-`.lsp.json` und im Manifest deklarierte `lspServers` werden in eingebettete Pi-LSP-Standards zusammengeführt | Claude         |
| Einstellungen | Claude-`settings.json` wird als eingebettete Pi-Standards importiert                        | Claude         |

#### Skill-Inhalt

- Bundle-Skill-Roots werden als normale OpenClaw-Skill-Roots geladen
- Claude-`commands`-Roots werden als zusätzliche Skill-Roots behandelt
- Cursor-`.cursor/commands`-Roots werden als zusätzliche Skill-Roots behandelt

Das bedeutet, Claude-Markdown-Befehlsdateien funktionieren über den normalen OpenClaw-Skill-
Loader. Cursor-Befehls-Markdown funktioniert über denselben Pfad.

#### Hook-Pakete

- Bundle-Hook-Roots funktionieren **nur**, wenn sie das normale OpenClaw-Hook-Paket-
  Layout verwenden. Heute ist dies hauptsächlich der Codex-kompatible Fall:
  - `HOOK.md`
  - `handler.ts` oder `handler.js`

#### MCP für Pi

- aktivierte Bundles können MCP-Serverkonfiguration beitragen
- OpenClaw führt die Bundle-MCP-Konfiguration als `mcpServers` in die wirksamen eingebetteten Pi-Einstellungen zusammen
- OpenClaw stellt unterstützte Bundle-MCP-Tools während eingebetteter Pi-Agent-Turns bereit, indem es stdio-Server startet oder sich mit HTTP-Servern verbindet
- die Tool-Profile `coding` und `messaging` enthalten Bundle-MCP-Tools standardmäßig; verwenden Sie `tools.deny: ["bundle-mcp"]`, um sie für einen Agent oder Gateway auszuschließen
- projektlokale Pi-Einstellungen gelten weiterhin nach Bundle-Standards, sodass Workspace-
  Einstellungen Bundle-MCP-Einträge bei Bedarf überschreiben können
- Bundle-MCP-Tool-Kataloge werden vor der Registrierung deterministisch sortiert, sodass
  Änderungen der Upstream-`listTools()`-Reihenfolge Prompt-Cache-Tool-Blöcke nicht unnötig verändern

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

- `transport` kann auf `"streamable-http"` oder `"sse"` gesetzt werden; wenn ausgelassen, verwendet OpenClaw `sse`
- `type: "http"` ist eine CLI-native Downstream-Form; verwenden Sie `transport: "streamable-http"` in der OpenClaw-Konfiguration. `openclaw mcp set` und `openclaw doctor --fix` normalisieren den gängigen Alias.
- nur URL-Schemas `http:` und `https:` sind erlaubt
- `headers`-Werte unterstützen `${ENV_VAR}`-Interpolation
- ein Servereintrag mit sowohl `command` als auch `url` wird abgelehnt
- URL-Zugangsdaten (userinfo und query params) werden in Tool-
  Beschreibungen und Logs geschwärzt
- `connectionTimeoutMs` überschreibt das standardmäßige Verbindungs-Timeout von 30 Sekunden für
  stdio- und HTTP-Transporte

##### Tool-Benennung

OpenClaw registriert Bundle-MCP-Tools mit Provider-sicheren Namen in der Form
`serverName__toolName`. Beispielsweise wird ein Server mit dem Schlüssel `"vigil-harbor"`, der ein
`memory_search`-Tool bereitstellt, als `vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt
- Serverpräfixe sind auf 30 Zeichen begrenzt
- vollständige Tool-Namen sind auf 64 Zeichen begrenzt
- leere Servernamen fallen auf `mcp` zurück
- kollidierende bereinigte Namen werden mit numerischen Suffixen eindeutig gemacht
- die endgültig bereitgestellte Tool-Reihenfolge ist nach sicherem Namen deterministisch, um wiederholte Pi-
  Turns cache-stabil zu halten
- Profilfilterung behandelt alle Tools von einem Bundle-MCP-Server als Plugin-eigen
  von `bundle-mcp`, sodass Profil-Allowlists und -Deny-Listen entweder
  einzelne bereitgestellte Tool-Namen oder den Plugin-Schlüssel `bundle-mcp` enthalten können

#### Eingebettete Pi-Einstellungen

- Claude-`settings.json` wird als standardmäßige eingebettete Pi-Einstellungen importiert, wenn das
  Bundle aktiviert ist
- OpenClaw bereinigt Shell-Override-Schlüssel, bevor sie angewendet werden

Bereinigte Schlüssel:

- `shellPath`
- `shellCommandPrefix`

#### Eingebettetes Pi-LSP

- aktivierte Claude-Bundles können LSP-Serverkonfiguration beitragen
- OpenClaw lädt `.lsp.json` plus alle im Manifest deklarierten `lspServers`-Pfade
- Bundle-LSP-Konfiguration wird in die wirksamen eingebetteten Pi-LSP-Standards zusammengeführt
- nur unterstützte stdio-gestützte LSP-Server sind heute ausführbar; nicht unterstützte
  Transporte werden weiterhin in `openclaw plugins inspect <id>` angezeigt

### Erkannt, aber nicht ausgeführt

Diese werden erkannt und in Diagnosen angezeigt, aber OpenClaw führt sie nicht aus:

- Claude-`agents`, `hooks.json`-Automatisierung, `outputStyles`
- Cursor-`.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-Inline-/App-Metadaten über Fähigkeitsberichte hinaus

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
    - `settings.json` wird in eingebettete Pi-Einstellungen importiert (Shell-Override-Schlüssel werden bereinigt)
    - `.mcp.json` stellt unterstützte stdio-Tools für eingebettetes Pi bereit
    - `.lsp.json` plus im Manifest deklarierte `lspServers`-Pfade werden in eingebettete Pi-LSP-Standards geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - benutzerdefinierte Komponentenpfade im Manifest sind additiv (sie erweitern Standards, ersetzen sie nicht)

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Marker: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` dienen nur zur Erkennung

  </Accordion>
</AccordionGroup>

## Erkennungspriorität

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder gültige `package.json` mit `openclaw.extensions` — wird als **natives Plugin** behandelt
2. Bundle-Marker (`.codex-plugin/`, `.claude-plugin/` oder Standard-Claude-/Cursor-Layout) — wird als **Bundle** behandelt

Wenn ein Verzeichnis beides enthält, verwendet OpenClaw den nativen Pfad. Dies verhindert,
dass Pakete mit zwei Formaten teilweise als Bundles installiert werden.

## Laufzeitabhängigkeiten und Bereinigung

- Drittanbieter-kompatible Bundles erhalten keine Start-`npm install`-Reparatur. Sie
  sollten über `openclaw plugins install` installiert werden und alles, was sie benötigen,
  im installierten Plugin-Verzeichnis mitliefern.
- OpenClaw-eigene gebündelte Plugins werden entweder schlank im Kern ausgeliefert oder
  über den Plugin-Installer herunterladbar gemacht. Der Gateway-Start führt für sie niemals einen
  Paketmanager aus.
- `openclaw doctor --fix` entfernt veraltete bereitgestellte Abhängigkeitsverzeichnisse und kann
  herunterladbare Plugins wiederherstellen, die im lokalen Plugin-Index fehlen, wenn
  die Konfiguration auf sie verweist.

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugins:

- OpenClaw lädt keine beliebigen Bundle-Laufzeitmodule im Prozess
- Skills und Hook-Paket-Pfade müssen innerhalb des Plugin-Roots bleiben (Grenze wird geprüft)
- Einstellungsdateien werden mit denselben Grenzprüfungen gelesen
- unterstützte stdio-MCP-Server können als Subprozesse gestartet werden

Dadurch sind Bundles standardmäßig sicherer, aber Sie sollten Drittanbieter-
Bundles weiterhin als vertrauenswürdigen Inhalt für die Funktionen behandeln, die sie bereitstellen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bundle wird erkannt, aber Fähigkeiten werden nicht ausgeführt">
    Führen Sie `openclaw plugins inspect <id>` aus. Wenn eine Fähigkeit aufgeführt, aber als
    nicht verdrahtet markiert ist, ist das eine Produktgrenze und keine fehlerhafte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien erscheinen nicht">
    Stellen Sie sicher, dass das Bundle aktiviert ist und die Markdown-Dateien innerhalb eines erkannten
    `commands/`- oder `skills/`-Roots liegen.
  </Accordion>

  <Accordion title="Claude-Einstellungen werden nicht angewendet">
    Es werden nur eingebettete Pi-Einstellungen aus `settings.json` unterstützt. OpenClaw behandelt
    Bundle-Einstellungen nicht als rohe Konfigurations-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` dient nur zur Erkennung. Wenn Sie ausführbare Hooks benötigen, verwenden Sie das
    OpenClaw-Hook-Paket-Layout oder liefern Sie ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugins installieren und konfigurieren](/de/tools/plugin)
- [Plugins erstellen](/de/plugins/building-plugins) — ein natives Plugin erstellen
- [Plugin-Manifest](/de/plugins/manifest) — natives Manifest-Schema
