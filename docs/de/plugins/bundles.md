---
read_when:
    - Sie möchten ein mit Codex, Claude oder Cursor kompatibles Bundle installieren
    - Sie müssen verstehen, wie OpenClaw Bundle-Inhalte nativen Funktionen zuordnet
    - Sie debuggen die Bundle-Erkennung oder fehlende Funktionen
summary: Codex-, Claude- und Cursor-Bundles als OpenClaw-Plugins installieren und verwenden
title: Plugin-Bundles
x-i18n:
    generated_at: "2026-04-30T07:04:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kann Plugins aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese werden **Bundles** genannt: Inhalts- und Metadatenpakete, die
OpenClaw auf native Funktionen wie Skills, Hooks und MCP-Tools abbildet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugins. Native Plugins laufen
  im Prozess und können jede Capability registrieren. Bundles sind Inhaltspakete mit
  selektiver Funktionsabbildung und einer engeren Vertrauensgrenze.
</Info>

## Warum Bundles existieren

Viele nützliche Plugins werden im Codex-, Claude- oder Cursor-Format veröffentlicht. Anstatt
Autorinnen und Autoren zu zwingen, sie als native OpenClaw-Plugins neu zu schreiben, erkennt OpenClaw
diese Formate und bildet ihre unterstützten Inhalte auf den nativen Funktionsumfang ab.
Das bedeutet, dass Sie ein Claude-Befehlspaket oder ein Codex-Skill-Bundle installieren
und sofort verwenden können.

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

  <Step title="Erkennung überprüfen">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles werden als `Format: bundle` mit einem Untertyp von `codex`, `claude` oder `cursor` angezeigt.

  </Step>

  <Step title="Neu starten und verwenden">
    ```bash
    openclaw gateway restart
    ```

    Abgebildete Funktionen (Skills, Hooks, MCP-Tools, LSP-Standards) sind in der nächsten Sitzung verfügbar.

  </Step>
</Steps>

## Was OpenClaw aus Bundles abbildet

Nicht jede Bundle-Funktion läuft heute in OpenClaw. Hier sehen Sie, was funktioniert und was
erkannt, aber noch nicht verdrahtet wird.

### Derzeit unterstützt

| Funktion       | Wie sie abgebildet wird                                                                                 | Gilt für       |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill-Inhalte | Bundle-Skill-Wurzeln werden als normale OpenClaw-Skills geladen                                           | Alle Formate    |
| Befehle      | `commands/` und `.cursor/commands/` werden als Skill-Wurzeln behandelt                                  | Claude, Cursor |
| Hook-Pakete    | OpenClaw-artige Layouts mit `HOOK.md` + `handler.ts`                                             | Codex          |
| MCP-Tools     | Bundle-MCP-Konfiguration wird in eingebettete Pi-Einstellungen zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate    |
| LSP-Server   | Claude `.lsp.json` und im Manifest deklarierte `lspServers` werden in eingebettete Pi-LSP-Standards zusammengeführt  | Claude         |
| Einstellungen      | Claude `settings.json` wird als eingebettete Pi-Standards importiert                                     | Claude         |

#### Skill-Inhalte

- Bundle-Skill-Wurzeln werden als normale OpenClaw-Skill-Wurzeln geladen
- Claude-`commands`-Wurzeln werden als zusätzliche Skill-Wurzeln behandelt
- Cursor-`.cursor/commands`-Wurzeln werden als zusätzliche Skill-Wurzeln behandelt

Das bedeutet, dass Claude-Markdown-Befehlsdateien über den normalen OpenClaw-Skill-
Loader funktionieren. Cursor-Befehls-Markdown funktioniert über denselben Pfad.

#### Hook-Pakete

- Bundle-Hook-Wurzeln funktionieren **nur**, wenn sie das normale OpenClaw-Hook-Pack-
  Layout verwenden. Heute ist dies hauptsächlich der Codex-kompatible Fall:
  - `HOOK.md`
  - `handler.ts` oder `handler.js`

#### MCP für Pi

- Aktivierte Bundles können MCP-Serverkonfiguration beitragen
- OpenClaw führt Bundle-MCP-Konfiguration in die wirksamen eingebetteten Pi-Einstellungen als
  `mcpServers` zusammen
- OpenClaw stellt unterstützte Bundle-MCP-Tools während eingebetteter Pi-Agent-Durchläufe bereit, indem
  stdio-Server gestartet oder Verbindungen zu HTTP-Servern hergestellt werden
- die Tool-Profile `coding` und `messaging` enthalten Bundle-MCP-Tools
  standardmäßig; verwenden Sie `tools.deny: ["bundle-mcp"]`, um sie für einen Agent oder ein Gateway
  auszuschließen
- projektlokale Pi-Einstellungen gelten weiterhin nach Bundle-Standards, sodass Workspace-
  Einstellungen Bundle-MCP-Einträge bei Bedarf überschreiben können
- Bundle-MCP-Toolkataloge werden vor der Registrierung deterministisch sortiert, sodass
  Änderungen an der Upstream-Reihenfolge von `listTools()` keine Prompt-Cache-Toolblöcke durcheinanderbringen

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

**HTTP** verbindet sich standardmäßig über `sse` mit einem laufenden MCP-Server oder über `streamable-http`, wenn dies angefordert wird:

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
- `type: "http"` ist eine CLI-native Downstream-Form; verwenden Sie `transport: "streamable-http"` in der OpenClaw-Konfiguration. `openclaw mcp set` und `openclaw doctor --fix` normalisieren den üblichen Alias.
- nur die URL-Schemata `http:` und `https:` sind erlaubt
- `headers`-Werte unterstützen `${ENV_VAR}`-Interpolation
- ein Servereintrag mit sowohl `command` als auch `url` wird abgelehnt
- URL-Anmeldedaten (Userinfo und Query-Parameter) werden aus Tool-
  Beschreibungen und Logs entfernt
- `connectionTimeoutMs` überschreibt das standardmäßige 30-Sekunden-Verbindungstimeout für
  sowohl stdio- als auch HTTP-Transporte

##### Tool-Benennung

OpenClaw registriert Bundle-MCP-Tools mit Provider-sicheren Namen in der Form
`serverName__toolName`. Zum Beispiel wird ein Server mit dem Schlüssel `"vigil-harbor"`, der ein
`memory_search`-Tool bereitstellt, als `vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt
- Serverpräfixe sind auf 30 Zeichen begrenzt
- vollständige Tool-Namen sind auf 64 Zeichen begrenzt
- leere Servernamen fallen auf `mcp` zurück
- kollidierende bereinigte Namen werden mit numerischen Suffixen eindeutig gemacht
- die endgültige offengelegte Tool-Reihenfolge ist nach sicherem Namen deterministisch, damit wiederholte Pi-
  Durchläufe cache-stabil bleiben
- Profilfilterung behandelt alle Tools eines Bundle-MCP-Servers als Plugin-eigen
  von `bundle-mcp`, sodass Profil-Allowlists und Deny-Listen entweder
  einzelne offengelegte Tool-Namen oder den Plugin-Schlüssel `bundle-mcp` enthalten können

#### Eingebettete Pi-Einstellungen

- Claude `settings.json` wird als standardmäßige eingebettete Pi-Einstellungen importiert, wenn das
  Bundle aktiviert ist
- OpenClaw bereinigt Shell-Override-Schlüssel, bevor sie angewendet werden

Bereinigte Schlüssel:

- `shellPath`
- `shellCommandPrefix`

#### Eingebettetes Pi-LSP

- Aktivierte Claude-Bundles können LSP-Serverkonfiguration beitragen
- OpenClaw lädt `.lsp.json` plus alle im Manifest deklarierten `lspServers`-Pfade
- Bundle-LSP-Konfiguration wird in die wirksamen eingebetteten Pi-LSP-Standards zusammengeführt
- nur unterstützte stdio-basierte LSP-Server sind heute ausführbar; nicht unterstützte
  Transporte erscheinen weiterhin in `openclaw plugins inspect <id>`

### Erkannt, aber nicht ausgeführt

Diese werden erkannt und in Diagnosen angezeigt, aber OpenClaw führt sie nicht aus:

- Claude `agents`, `hooks.json`-Automatisierung, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-Inline-/App-Metadaten über Capability-Berichte hinaus

## Bundle-Formate

<AccordionGroup>
  <Accordion title="Codex-Bundles">
    Markierungen: `.codex-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-Bundles passen am besten zu OpenClaw, wenn sie Skill-Wurzeln und OpenClaw-artige
    Hook-Pack-Verzeichnisse (`HOOK.md` + `handler.ts`) verwenden.

  </Accordion>

  <Accordion title="Claude-Bundles">
    Zwei Erkennungsmodi:

    - **Manifestbasiert:** `.claude-plugin/plugin.json`
    - **Ohne Manifest:** Standardmäßiges Claude-Layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-spezifisches Verhalten:

    - `commands/` wird als Skill-Inhalt behandelt
    - `settings.json` wird in eingebettete Pi-Einstellungen importiert (Shell-Override-Schlüssel werden bereinigt)
    - `.mcp.json` stellt unterstützte stdio-Tools für eingebettetes Pi bereit
    - `.lsp.json` plus im Manifest deklarierte `lspServers`-Pfade werden in eingebettete Pi-LSP-Standards geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - Benutzerdefinierte Komponentenpfade im Manifest sind additiv (sie erweitern Standards, ersetzen sie nicht)

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Markierungen: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` dienen nur der Erkennung

  </Accordion>
</AccordionGroup>

## Erkennungsreihenfolge

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder gültige `package.json` mit `openclaw.extensions` — wird als **natives Plugin** behandelt
2. Bundle-Markierungen (`.codex-plugin/`, `.claude-plugin/` oder standardmäßiges Claude-/Cursor-Layout) — werden als **Bundle** behandelt

Wenn ein Verzeichnis beides enthält, verwendet OpenClaw den nativen Pfad. Dadurch wird verhindert,
dass Dual-Format-Pakete teilweise als Bundles installiert werden.

## Laufzeitabhängigkeiten und Bereinigung

- Kompatible Drittanbieter-Bundles erhalten keine Startup-Reparatur per `npm install`. Sie
  sollten über `openclaw plugins install` installiert werden und alles mitliefern,
  was sie im installierten Plugin-Verzeichnis benötigen.
- Von OpenClaw besessene paketierte gebündelte Plugins haben eine enge Ausnahme: Wenn eines
  aktiviert ist, kann der Gateway-Start fehlende deklarierte Laufzeitabhängigkeiten
  vor dem Import reparieren. Betreiber können diese Phase mit
  `openclaw plugins deps` prüfen oder reparieren.
- Die Release-Pipeline ist weiterhin dafür verantwortlich, nach Möglichkeit eine vollständige gebündelte
  Abhängigkeitsnutzlast auszuliefern (siehe die Postpublish-Verifizierungsregel in
  [Release-Prozess](/de/reference/RELEASING)).

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugins:

- OpenClaw lädt **keine** beliebigen Bundle-Laufzeitmodule im Prozess
- Skills und Hook-Pack-Pfade müssen innerhalb der Plugin-Wurzel bleiben (grenzengeprüft)
- Einstellungsdateien werden mit denselben Grenzprüfungen gelesen
- Unterstützte stdio-MCP-Server können als Subprozesse gestartet werden

Dadurch sind Bundles standardmäßig sicherer, aber Sie sollten Drittanbieter-
Bundles dennoch als vertrauenswürdige Inhalte für die Funktionen behandeln, die sie bereitstellen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bundle wird erkannt, aber Capabilities werden nicht ausgeführt">
    Führen Sie `openclaw plugins inspect <id>` aus. Wenn eine Capability aufgeführt, aber als
    nicht verdrahtet markiert ist, ist das eine Produktgrenze — keine beschädigte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien werden nicht angezeigt">
    Stellen Sie sicher, dass das Bundle aktiviert ist und die Markdown-Dateien sich in einer erkannten
    `commands/`- oder `skills/`-Wurzel befinden.
  </Accordion>

  <Accordion title="Claude-Einstellungen werden nicht angewendet">
    Nur eingebettete Pi-Einstellungen aus `settings.json` werden unterstützt. OpenClaw behandelt
    Bundle-Einstellungen nicht als rohe Konfigurations-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` dient nur der Erkennung. Wenn Sie ausführbare Hooks benötigen, verwenden Sie das
    OpenClaw-Hook-Pack-Layout oder liefern Sie ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Plugins installieren und konfigurieren](/de/tools/plugin)
- [Plugins erstellen](/de/plugins/building-plugins) — ein natives Plugin erstellen
- [Plugin-Manifest](/de/plugins/manifest) — natives Manifest-Schema
