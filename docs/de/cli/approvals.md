---
read_when:
    - Sie möchten Ausführungsgenehmigungen über die CLI bearbeiten.
    - Sie müssen Zulassungslisten auf Gateway- oder Node-Hosts verwalten.
summary: CLI-Referenz für `openclaw approvals` und `openclaw exec-policy`
title: Genehmigungen
x-i18n:
    generated_at: "2026-04-23T06:25:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Verwalten Sie Ausführungsgenehmigungen für den **lokalen Host**, den **Gateway-Host** oder einen **Node-Host**.
Standardmäßig zielen Befehle auf die lokale Genehmigungsdatei auf dem Datenträger. Verwenden Sie `--gateway`, um das Gateway anzusprechen, oder `--node`, um eine bestimmte Node anzusprechen.

Alias: `openclaw exec-approvals`

Verwandt:

- Ausführungsgenehmigungen: [Ausführungsgenehmigungen](/de/tools/exec-approvals)
- Nodes: [Nodes](/de/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` ist der lokale Komfortbefehl, um die angeforderte
Konfiguration `tools.exec.*` und die Genehmigungsdatei des lokalen Hosts in einem Schritt synchron zu halten.

Verwenden Sie ihn, wenn Sie Folgendes möchten:

- die lokal angeforderte Richtlinie, die Genehmigungsdatei des Hosts und die effektive Zusammenführung prüfen
- ein lokales Preset wie YOLO oder deny-all anwenden
- lokales `tools.exec.*` und lokales `~/.openclaw/exec-approvals.json` synchronisieren

Beispiele:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Ausgabemodi:

- ohne `--json`: gibt die menschenlesbare Tabellenansicht aus
- `--json`: gibt maschinenlesbare strukturierte Ausgabe aus

Aktueller Geltungsbereich:

- `exec-policy` ist **nur lokal**
- es aktualisiert die lokale Konfigurationsdatei und die lokale Genehmigungsdatei gemeinsam
- es überträgt die Richtlinie **nicht** an den Gateway-Host oder einen Node-Host
- `--host node` wird in diesem Befehl abgelehnt, weil Ausführungsgenehmigungen von Nodes zur Laufzeit von der Node abgerufen werden und stattdessen über gegen Nodes gerichtete Genehmigungsbefehle verwaltet werden müssen
- `openclaw exec-policy show` kennzeichnet `host=node`-Bereiche als zur Laufzeit Node-verwaltet, statt eine effektive Richtlinie aus der lokalen Genehmigungsdatei abzuleiten

Wenn Sie Genehmigungen für entfernte Hosts direkt bearbeiten müssen, verwenden Sie weiterhin `openclaw approvals set --gateway`
oder `openclaw approvals set --node <id|name|ip>`.

## Häufige Befehle

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` zeigt jetzt die effektive Ausführungsrichtlinie für lokale, Gateway- und Node-Ziele an:

- angeforderte Richtlinie `tools.exec`
- Richtlinie der Genehmigungsdatei des Hosts
- effektives Ergebnis nach Anwendung der Vorrangregeln

Die Vorrangregeln sind beabsichtigt:

- die Genehmigungsdatei des Hosts ist die durchsetzbare maßgebliche Quelle
- die angeforderte Richtlinie `tools.exec` kann die Absicht einschränken oder erweitern, aber das effektive Ergebnis wird weiterhin aus den Host-Regeln abgeleitet
- `--node` kombiniert die Genehmigungsdatei des Node-Hosts mit der Richtlinie `tools.exec` des Gateways, weil beide zur Laufzeit weiterhin gelten
- wenn die Gateway-Konfiguration nicht verfügbar ist, greift die CLI auf den Genehmigungs-Schnappschuss der Node zurück und vermerkt, dass die endgültige Laufzeitrichtlinie nicht berechnet werden konnte

## Genehmigungen aus einer Datei ersetzen

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` akzeptiert JSON5, nicht nur striktes JSON. Verwenden Sie entweder `--file` oder `--stdin`, nicht beides.

## Beispiel „Nie nachfragen“ / YOLO

Für einen Host, der wegen Ausführungsgenehmigungen nie anhalten soll, setzen Sie die Standardwerte der Host-Genehmigungen auf `full` + `off`:

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

Node-Variante:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
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

Dies ändert nur die **Host-Genehmigungsdatei**. Um die angeforderte OpenClaw-Richtlinie synchron zu halten, setzen Sie außerdem:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Warum `tools.exec.host=gateway` in diesem Beispiel:

- `host=auto` bedeutet weiterhin „Sandbox, wenn verfügbar, sonst Gateway“.
- Bei YOLO geht es um Genehmigungen, nicht um Weiterleitung.
- Wenn Sie Host-Ausführung möchten, auch wenn eine Sandbox konfiguriert ist, machen Sie die Host-Auswahl explizit mit `gateway` oder `/exec host=gateway`.

Dies entspricht dem aktuellen YOLO-Verhalten mit Host-Standardwerten. Verschärfen Sie es, wenn Sie Genehmigungen möchten.

Lokale Abkürzung:

```bash
openclaw exec-policy preset yolo
```

Diese lokale Abkürzung aktualisiert sowohl die angeforderte lokale Konfiguration `tools.exec.*` als auch die
lokalen Genehmigungsstandardwerte zusammen. Sie ist von der Absicht her gleichwertig mit der oben beschriebenen manuellen Einrichtung in zwei Schritten, aber nur für den lokalen Rechner.

## Hilfen für Zulassungslisten

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Häufige Optionen

`get`, `set` und `allowlist add|remove` unterstützen alle:

- `--node <id|name|ip>`
- `--gateway`
- gemeinsame Node-RPC-Optionen: `--url`, `--token`, `--timeout`, `--json`

Hinweise zur Zielauswahl:

- ohne Ziel-Flags ist die lokale Genehmigungsdatei auf dem Datenträger gemeint
- `--gateway` zielt auf die Genehmigungsdatei des Gateway-Hosts
- `--node` zielt nach der Auflösung von ID, Name, IP oder ID-Präfix auf einen Node-Host

`allowlist add|remove` unterstützt außerdem:

- `--agent <id>` (Standard ist `*`)

## Hinweise

- `--node` verwendet denselben Resolver wie `openclaw nodes` (ID, Name, IP oder ID-Präfix).
- `--agent` hat standardmäßig den Wert `"*"`, was für alle Agents gilt.
- Der Node-Host muss `system.execApprovals.get/set` ankündigen (macOS-App oder Headless-Node-Host).
- Genehmigungsdateien werden pro Host unter `~/.openclaw/exec-approvals.json` gespeichert.
