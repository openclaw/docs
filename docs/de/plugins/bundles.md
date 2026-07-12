---
read_when:
    - Sie möchten ein mit Codex, Claude oder Cursor kompatibles Paket installieren
    - Sie müssen verstehen, wie OpenClaw Bundle-Inhalte nativen Funktionen zuordnet
    - Sie beheben Probleme bei der Bundle-Erkennung oder bei fehlenden Funktionen
summary: Codex-, Claude- und Cursor-Bundles als OpenClaw-Plugins installieren und verwenden
title: Plugin-Pakete
x-i18n:
    generated_at: "2026-07-12T01:52:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kann Plugins aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese werden als **Bundles** bezeichnet – Inhalts- und Metadatenpakete,
die OpenClaw nativen Funktionen wie Skills, Hooks und MCP-Tools zuordnet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugins. Native Plugins werden
  prozessintern ausgeführt und können beliebige Funktionen registrieren. Bundles sind
  Inhaltspakete mit selektiver Funktionszuordnung und einer engeren Vertrauensgrenze.
</Info>

## Warum es Bundles gibt

Viele nützliche Plugins werden im Format von Codex, Claude oder Cursor veröffentlicht.
Anstatt von Autoren zu verlangen, sie als native OpenClaw-Plugins neu zu schreiben,
erkennt OpenClaw diese Formate und ordnet ihre unterstützten Inhalte dem nativen
Funktionsumfang zu. Sie können ein Claude-Befehlspaket oder ein Codex-Skill-Bundle
installieren und sofort verwenden.

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

    `<source>` ist ein lokaler Marketplace-Pfad bzw. ein lokales Marketplace-Repository oder eine Git-/GitHub-Quelle.

  </Step>

  <Step title="Erkennung überprüfen">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles zeigen `Format: bundle` sowie einen Wert `Bundle format:` mit `codex`,
    `claude` oder `cursor` an.

  </Step>

  <Step title="Neu starten und verwenden">
    ```bash
    openclaw gateway restart
    ```

    Zugeordnete Funktionen (Skills, Hooks, MCP-Tools und LSP-Standardwerte) sind in der nächsten Sitzung verfügbar.

  </Step>
</Steps>

## Was OpenClaw aus Bundles zuordnet

Derzeit werden nicht alle Bundle-Funktionen in OpenClaw ausgeführt. Nachfolgend
sehen Sie, was funktioniert und was zwar erkannt, aber noch nicht eingebunden wird.

### Derzeit unterstützt

| Funktion       | Zuordnung                                                                                              | Gilt für       |
| -------------- | ------------------------------------------------------------------------------------------------------ | -------------- |
| Skill-Inhalte  | Bundle-Skill-Stammverzeichnisse werden als normale OpenClaw-Skills geladen                             | Alle Formate   |
| Befehle        | `commands/` und `.cursor/commands/` werden als Skill-Stammverzeichnisse behandelt                      | Claude, Cursor |
| Hook-Pakete    | OpenClaw-Layouts im Stil von `HOOK.md` + `handler.ts`                                                  | Codex          |
| MCP-Tools      | Die MCP-Konfiguration des Bundles wird mit den eingebetteten OpenClaw-Einstellungen zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate   |
| LSP-Server     | Claude-`.lsp.json` und im Manifest deklarierte `lspServers` werden mit den eingebetteten OpenClaw-LSP-Standardwerten zusammengeführt | Claude         |
| Einstellungen  | Claude-`settings.json` wird als eingebettete OpenClaw-Standardwerte importiert                         | Claude         |

#### Skill-Inhalte

- Bundle-Skill-Stammverzeichnisse werden als normale OpenClaw-Skill-Stammverzeichnisse geladen.
- Claude-`commands/`-Stammverzeichnisse werden als zusätzliche Skill-Stammverzeichnisse behandelt.
- Cursor-`.cursor/commands/`-Stammverzeichnisse werden als zusätzliche Skill-Stammverzeichnisse behandelt.

Claude-Markdown-Befehlsdateien und Cursor-Befehls-Markdown funktionieren beide über
den normalen OpenClaw-Skill-Loader.

#### Hook-Pakete

Bundle-Hook-Stammverzeichnisse funktionieren **nur**, wenn sie das normale
OpenClaw-Hook-Paketlayout verwenden: `HOOK.md` sowie `handler.ts` oder `handler.js`.
Derzeit trifft dies hauptsächlich auf den Codex-kompatiblen Fall zu.

#### MCP für eingebettetes OpenClaw

- Aktivierte Bundles können MCP-Serverkonfigurationen bereitstellen.
- OpenClaw führt die MCP-Konfiguration des Bundles als `mcpServers` mit den
  effektiven eingebetteten OpenClaw-Einstellungen zusammen.
- OpenClaw stellt unterstützte Bundle-MCP-Tools während der Ausführungen des
  eingebetteten OpenClaw-Agenten bereit, indem es stdio-Server startet oder
  Verbindungen zu HTTP-Servern herstellt.
- Die Tool-Profile `coding` und `messaging` enthalten Bundle-MCP-Tools
  standardmäßig; verwenden Sie `tools.deny: ["bundle-mcp"]`, um sie für einen
  Agenten oder Gateway zu deaktivieren.
- Projektlokale Einstellungen für eingebettete Agenten werden weiterhin nach
  den Bundle-Standardwerten angewendet, sodass Workspace-Einstellungen
  Bundle-MCP-Einträge bei Bedarf überschreiben können.
- Bundle-MCP-Toolkataloge werden vor der Registrierung deterministisch sortiert,
  damit Änderungen der vorgelagerten `listTools()`-Reihenfolge nicht ständig
  die Tool-Blöcke des Prompt-Caches ändern.

##### Transporte

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

**HTTP** stellt eine Verbindung zu einem laufenden MCP-Server her und verwendet
standardmäßig `sse`, sofern nicht `streamable-http` angefordert wird:

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
- `type: "http"` ist eine CLI-native nachgelagerte Struktur; verwenden Sie `transport: "streamable-http"` in der OpenClaw-Konfiguration. `openclaw mcp set` und `openclaw doctor --fix` normalisieren den gängigen Alias.
- Nur die URL-Schemata `http:` und `https:` sind zulässig.
- Werte in `headers` unterstützen die Interpolation mit `${ENV_VAR}`.
- Ein Servereintrag, der sowohl `command` als auch `url` enthält, wird abgelehnt.
- URL-Anmeldedaten (Benutzerinformationen und Abfrageparameter) werden in
  Tool-Beschreibungen und Protokollen unkenntlich gemacht.
- `connectionTimeoutMs` überschreibt das standardmäßige Verbindungszeitlimit von
  30 Sekunden sowohl für stdio- als auch für HTTP-Transporte. Das
  Anforderungszeitlimit beträgt standardmäßig 60 Sekunden und kann mit
  `requestTimeoutMs` überschrieben werden.

##### Tool-Benennung

OpenClaw registriert Bundle-MCP-Tools mit Provider-kompatiblen Namen im Format
`serverName__toolName`. Beispielsweise wird ein Server mit dem Schlüssel
`"vigil-harbor"`, der ein Tool namens `memory_search` bereitstellt, als
`vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt.
- Fragmente, die mit einem Nichtbuchstaben beginnen würden, erhalten ein
  Buchstabenpräfix, sodass numerische Serverschlüssel wie `12306`
  Provider-kompatible Tool-Präfixe erhalten.
- Serverpräfixe sind auf 30 Zeichen begrenzt.
- Vollständige Tool-Namen sind auf 64 Zeichen begrenzt.
- Leere Servernamen verwenden ersatzweise `mcp`.
- Kollidierende bereinigte Namen werden durch numerische Suffixe unterschieden.
- Die endgültige Reihenfolge der bereitgestellten Tools ist anhand des sicheren
  Namens deterministisch, sodass wiederholte Ausführungen des eingebetteten
  Agenten cache-stabil bleiben.
- Bei der Profilfilterung werden alle Tools eines Bundle-MCP-Servers als Eigentum
  des Plugins `bundle-mcp` behandelt, sodass Zulassungs- und Sperrlisten von
  Profilen entweder auf einzelne bereitgestellte Tool-Namen oder auf den
  Plugin-Schlüssel `bundle-mcp` verweisen können.

#### Eingebettete OpenClaw-Einstellungen

Claude-`settings.json` wird bei aktiviertem Bundle als Standardeinstellung für
eingebettetes OpenClaw importiert. OpenClaw bereinigt Shell-Überschreibungsschlüssel,
bevor sie angewendet werden:

- `shellPath`
- `shellCommandPrefix`

#### Eingebettetes OpenClaw-LSP

- Aktivierte Claude-Bundles können LSP-Serverkonfigurationen bereitstellen.
- OpenClaw lädt `.lsp.json` sowie alle im Manifest deklarierten `lspServers`-Pfade.
- Die LSP-Konfiguration des Bundles wird mit den effektiven eingebetteten
  OpenClaw-LSP-Standardwerten zusammengeführt.
- Derzeit können nur unterstützte stdio-basierte LSP-Server ausgeführt werden;
  nicht unterstützte Transporte werden weiterhin in `openclaw plugins inspect <id>`
  angezeigt.

### Erkannt, aber nicht ausgeführt

Diese Elemente werden erkannt und in der Diagnose angezeigt, aber nicht von OpenClaw ausgeführt:

- Claude-`agents`, Automatisierung über `hooks/hooks.json`, `outputStyles`
- Cursor-`.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-`.app.json`-Metadaten über die Funktionsmeldung hinaus

## Bundle-Formate

<AccordionGroup>
  <Accordion title="Codex-Bundles">
    Kennzeichnungen: `.codex-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-Bundles eignen sich am besten für OpenClaw, wenn sie
    Skill-Stammverzeichnisse und Hook-Paketverzeichnisse im OpenClaw-Stil
    (`HOOK.md` + `handler.ts`) verwenden.

  </Accordion>

  <Accordion title="Claude-Bundles">
    Zwei Erkennungsmodi:

    - **Manifestbasiert:** `.claude-plugin/plugin.json`
    - **Ohne Manifest:** Claude-Standardlayout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-spezifisches Verhalten:

    - `commands/` wird als Skill-Inhalt behandelt
    - `settings.json` wird in die eingebetteten OpenClaw-Einstellungen importiert (Shell-Überschreibungsschlüssel werden bereinigt)
    - `.mcp.json` stellt dem eingebetteten OpenClaw unterstützte stdio-Tools bereit
    - `.lsp.json` sowie im Manifest deklarierte `lspServers`-Pfade werden in die eingebetteten OpenClaw-LSP-Standardwerte geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - Benutzerdefinierte Komponentenpfade im Manifest sind additiv; sie erweitern die Standardwerte, anstatt sie zu ersetzen

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Kennzeichnungen: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` werden nur erkannt

  </Accordion>
</AccordionGroup>

## Erkennungsreihenfolge

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder eine gültige `package.json` mit `openclaw.extensions` – wird als **natives Plugin** behandelt
2. Bundle-Kennzeichnungen (`.codex-plugin/`, `.claude-plugin/` oder das standardmäßige Claude-/Cursor-Layout) – werden als **Bundle** behandelt

Wenn ein Verzeichnis beides enthält, verwendet OpenClaw den nativen Pfad. Dadurch
wird verhindert, dass Pakete mit zwei Formaten teilweise als Bundles installiert werden.

## Laufzeitabhängigkeiten und Bereinigung

- Kompatible Drittanbieter-Bundles erhalten beim Start keine Reparatur durch
  `npm install`. Sie sollten über `openclaw plugins install` installiert werden
  und alles Benötigte im installierten Plugin-Verzeichnis enthalten.
- OpenClaw-eigene gebündelte Plugins werden entweder schlank im Kern ausgeliefert
  oder können über das Plugin-Installationsprogramm heruntergeladen werden. Beim
  Start des Gateways wird für sie niemals ein Paketmanager ausgeführt.
- `openclaw doctor --fix` entfernt veraltete lokale Installationsdatensätze
  gebündelter Plugins und kann herunterladbare Plugins wiederherstellen, die im
  lokalen Plugin-Index fehlen, wenn die Konfiguration weiterhin auf sie verweist.

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugins:

- OpenClaw lädt **keine** beliebigen Bundle-Laufzeitmodule prozessintern.
- Pfade für Skills und Hook-Pakete müssen innerhalb des Plugin-Stammverzeichnisses bleiben (Grenzprüfung).
- Einstellungsdateien werden mit denselben Grenzprüfungen gelesen.
- Unterstützte stdio-MCP-Server können als Unterprozesse gestartet werden.

Dadurch sind Bundles standardmäßig sicherer. Dennoch sollten Sie Drittanbieter-Bundles
für die Funktionen, die sie bereitstellen, als vertrauenswürdige Inhalte behandeln.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Das Bundle wird erkannt, aber Funktionen werden nicht ausgeführt">
    Führen Sie `openclaw plugins inspect <id>` aus. Wenn eine Funktion aufgeführt,
    aber als nicht eingebunden gekennzeichnet ist, handelt es sich um eine
    Produktbeschränkung und nicht um eine fehlerhafte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien werden nicht angezeigt">
    Stellen Sie sicher, dass das Bundle aktiviert ist und sich die Markdown-Dateien
    in einem erkannten `commands/`- oder `skills/`-Stammverzeichnis befinden.
  </Accordion>

  <Accordion title="Claude-Einstellungen werden nicht angewendet">
    Es werden nur eingebettete OpenClaw-Einstellungen aus `settings.json` unterstützt.
    OpenClaw behandelt Bundle-Einstellungen nicht als direkte Konfigurations-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` wird nur erkannt. Wenn Sie ausführbare Hooks benötigen,
    verwenden Sie das OpenClaw-Hook-Paketlayout oder liefern Sie ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Plugins installieren und konfigurieren](/de/tools/plugin)
- [Plugins erstellen](/de/plugins/building-plugins) – ein natives Plugin erstellen
- [Plugin-Manifest](/de/plugins/manifest) – natives Manifestschema
