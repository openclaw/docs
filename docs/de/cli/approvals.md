---
read_when:
    - Sie möchten Ausführungsgenehmigungen über die CLI bearbeiten
    - Sie müssen Zulassungslisten auf Gateway- oder Node-Hosts verwalten.
summary: CLI-Referenz für `openclaw approvals` und `openclaw exec-policy`
title: Genehmigungen
x-i18n:
    generated_at: "2026-07-12T01:27:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Verwalten Sie Ausführungsgenehmigungen für den **lokalen Host**, den **Gateway-Host** oder einen **Node-Host**. Ohne Zielflag lesen bzw. schreiben die Befehle die lokale Genehmigungsdatei auf dem Datenträger. Verwenden Sie `--gateway`, um das Gateway als Ziel festzulegen, oder `--node <id|name|ip>`, um einen bestimmten Node als Ziel festzulegen.

Alias: `openclaw exec-approvals`

Verwandte Themen: [Ausführungsgenehmigungen](/de/tools/exec-approvals), [Nodes](/de/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` ist der praktische, **ausschließlich lokale** Befehl, der die angeforderte `tools.exec.*`-Konfiguration und die lokale Genehmigungsdatei des Hosts in einem Schritt synchron hält:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Voreinstellungen (`yolo`, `cautious`, `deny-all`) wenden `host`, `security`, `ask` und `askFallback` gemeinsam an. `set` wendet nur die von Ihnen übergebenen Flags an; jeder akzeptierte Wert wird validiert (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Geltungsbereich:

- Aktualisiert die lokale Konfigurationsdatei und die lokale Genehmigungsdatei gemeinsam; überträgt die Richtlinie nicht an das Gateway oder einen Node-Host.
- `--host node` wird abgelehnt: Ausführungsgenehmigungen für Nodes werden zur Laufzeit vom Node abgerufen, daher kann das lokale `exec-policy` sie nicht synchronisieren. Verwenden Sie stattdessen `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` kennzeichnet Geltungsbereiche mit `host=node` zur Laufzeit als vom Node verwaltet, anstatt eine effektive Richtlinie aus der lokalen Genehmigungsdatei abzuleiten.

Verwenden Sie für Genehmigungen auf Remote-Hosts direkt `openclaw approvals set --gateway` oder `openclaw approvals set --node <id|name|ip>`.

## Häufig verwendete Befehle

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` zeigt die effektive Ausführungsrichtlinie für das Ziel: die angeforderte `tools.exec`-Richtlinie, die Richtlinie der Genehmigungsdatei des Hosts und das zusammengeführte effektive Ergebnis. Nodes mit einer hostnativen Richtlinie, wie etwa die Windows-Begleitanwendung, zeigen diese Richtlinie direkt an, anstatt die OpenClaw-Auswertungslogik für Genehmigungsdateien anzuwenden.

Bei dateibasierten Nodes erfordert die zusammengeführte Ansicht einen vom Host aufgelösten Richtlinien-Snapshot. Bei älteren Nodes wird die effektive Richtlinie als nicht verfügbar angezeigt, anstatt anzunehmen, dass die angeforderte Richtlinie des Gateways auch auf dem Host gilt.

<Note>
Sitzungsspezifische `/exec`-Überschreibungen sind nicht enthalten. Führen Sie `/exec` in der betreffenden Sitzung aus, um deren aktuelle Standardwerte zu prüfen.
</Note>

Rangfolge:

- Die Genehmigungsdatei des Hosts ist die maßgebliche, durchsetzbare Quelle.
- Die angeforderte `tools.exec`-Richtlinie kann die beabsichtigten Berechtigungen einschränken oder erweitern, das effektive Ergebnis wird jedoch aus den Hostregeln abgeleitet.
- `--node` kombiniert die Genehmigungsdatei des Node-Hosts mit der `tools.exec`-Richtlinie des Gateways (beide gelten zur Laufzeit).
- Wenn die Gateway-Konfiguration nicht verfügbar ist, greift die CLI auf den Genehmigungs-Snapshot des Nodes zurück und weist darauf hin, dass die endgültige Laufzeitrichtlinie nicht berechnet werden konnte.

## Genehmigungen aus einer Datei ersetzen

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` akzeptiert JSON5 und nicht nur striktes JSON. Verwenden Sie entweder `--file` oder `--stdin`, nicht beides.

Hostnative Windows-Nodes verwenden eine eigene Richtlinienstruktur:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

Die CLI liest zunächst den aktuellen Hash des Nodes und sendet ihn mit der Aktualisierung, sodass gleichzeitige lokale Änderungen abgelehnt statt überschrieben werden. `rules` ist erforderlich, da dieser Vorgang die vollständige Regelliste des Nodes ersetzt; `defaultAction` ist optional. Ein Node, der seine native Richtlinie als deaktiviert meldet, kann nicht remote konfiguriert werden; aktivieren oder konfigurieren Sie die Richtlinie zunächst auf diesem Host. Hostnative Richtlinien unterstützen die Hilfsbefehle `allowlist add|remove` nicht.

## Beispiel für „Nie nachfragen“ / YOLO

Setzen Sie die Standardwerte der Hostgenehmigungen für einen Host, der bei Ausführungsgenehmigungen nie anhalten soll, auf `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Verwenden Sie für Nodes, die eine OpenClaw-Genehmigungsdatei bereitstellen, denselben Inhalt mit `openclaw approvals set --node <id|name|ip> --stdin`. Hostnative Nodes benötigen die oben gezeigte, für ihren jeweiligen Eigentümer spezifische Struktur.

Dadurch wird nur die **Genehmigungsdatei des Hosts** geändert. Um auch die angeforderte OpenClaw-Richtlinie entsprechend auszurichten, legen Sie zusätzlich Folgendes fest:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` wird hier ausdrücklich angegeben, weil `host=auto` weiterhin „Sandbox, sofern verfügbar, andernfalls Gateway“ bedeutet: Bei YOLO geht es um Genehmigungen, nicht um das Routing. Verwenden Sie `gateway` (oder `/exec host=gateway`), wenn Sie die Ausführung auf dem Host auch bei konfigurierter Sandbox wünschen.

Ein ausgelassenes `askFallback` verwendet standardmäßig `deny`. Legen Sie beim Upgrade eines Hosts ohne Benutzeroberfläche, der das Verhalten ohne Rückfragen beibehalten soll, ausdrücklich `askFallback: "full"` fest.

Lokaler Kurzbefehl für dieselbe Absicht, ausschließlich auf dem lokalen Rechner:

```bash
openclaw exec-policy preset yolo
```

## Hilfsbefehle für die Zulassungsliste

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Allgemeine Optionen

`get`, `set` und `allowlist add|remove` unterstützen alle:

- `--node <id|name|ip>` (löst ID, Namen, IP-Adresse oder ID-Präfix auf; derselbe Auflösungsmechanismus wie bei `openclaw nodes`)
- `--gateway`
- gemeinsame Node-RPC-Optionen: `--url`, `--token`, `--timeout`, `--json`

Ohne Zielflag wird die lokale Genehmigungsdatei auf dem Datenträger verwendet.

`allowlist add|remove` unterstützt außerdem `--agent <id>` (standardmäßig `"*"`, sodass die Einstellung für alle Agenten gilt).

## Hinweise

- Der Node-Host muss `system.execApprovals.get/set` bereitstellen (macOS-App, monitorloser Node-Host oder Windows-Begleitanwendung).
- Genehmigungsdateien werden pro Host im OpenClaw-Statusverzeichnis gespeichert: `$OPENCLAW_STATE_DIR/exec-approvals.json` oder `~/.openclaw/exec-approvals.json`, wenn die Variable nicht gesetzt ist.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
