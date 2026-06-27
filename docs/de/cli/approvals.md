---
read_when:
    - Sie möchten Exec-Genehmigungen über die CLI bearbeiten
    - Sie müssen Allowlists auf Gateway- oder Node-Hosts verwalten.
summary: CLI-Referenz für `openclaw approvals` und `openclaw exec-policy`
title: Genehmigungen
x-i18n:
    generated_at: "2026-06-27T17:17:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Verwalten Sie Exec-Genehmigungen für den **lokalen Host**, den **Gateway-Host** oder einen **Node-Host**.
Standardmäßig richten sich Befehle an die lokale Genehmigungsdatei auf dem Datenträger. Verwenden Sie `--gateway`, um den Gateway anzusteuern, oder `--node`, um einen bestimmten Node anzusteuern.

Alias: `openclaw exec-approvals`

Verwandt:

- Exec-Genehmigungen: [Exec-Genehmigungen](/de/tools/exec-approvals)
- Nodes: [Nodes](/de/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` ist der lokale Komfortbefehl, um die angeforderte
`tools.exec.*`-Konfiguration und die Genehmigungsdatei des lokalen Hosts in einem Schritt synchron zu halten.

Verwenden Sie ihn, wenn Sie Folgendes möchten:

- die lokal angeforderte Richtlinie, die Host-Genehmigungsdatei und die effektive Zusammenführung prüfen
- ein lokales Preset wie YOLO oder deny-all anwenden
- lokale `tools.exec.*`-Werte und die Genehmigungsdatei des lokalen Hosts synchronisieren

Beispiele:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Ausgabemodi:

- kein `--json`: gibt die menschenlesbare Tabellenansicht aus
- `--json`: gibt maschinenlesbare strukturierte Ausgabe aus

Aktueller Geltungsbereich:

- `exec-policy` ist **nur lokal**
- aktualisiert die lokale Konfigurationsdatei und die lokale Genehmigungsdatei gemeinsam
- überträgt die Richtlinie **nicht** an den Gateway-Host oder einen Node-Host
- `--host node` wird in diesem Befehl abgelehnt, weil Node-Exec-Genehmigungen zur Laufzeit vom Node abgerufen werden und stattdessen über Node-spezifische Genehmigungsbefehle verwaltet werden müssen
- `openclaw exec-policy show` markiert `host=node`-Geltungsbereiche zur Laufzeit als Node-verwaltet, statt eine effektive Richtlinie aus der lokalen Genehmigungsdatei abzuleiten

Wenn Sie Genehmigungen für entfernte Hosts direkt bearbeiten müssen, verwenden Sie weiterhin `openclaw approvals set --gateway`
oder `openclaw approvals set --node <id|name|ip>`.

## Häufige Befehle

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` zeigt jetzt die effektive Exec-Richtlinie für lokale, Gateway- und Node-Ziele an:

- angeforderte `tools.exec`-Richtlinie
- Richtlinie der Host-Genehmigungsdatei
- effektives Ergebnis nach Anwendung der Vorrangregeln

Der Vorrang ist beabsichtigt:

- die Host-Genehmigungsdatei ist die durchsetzbare Quelle der Wahrheit
- die angeforderte `tools.exec`-Richtlinie kann die Absicht einschränken oder erweitern, aber das effektive Ergebnis wird weiterhin aus den Host-Regeln abgeleitet
- `--node` kombiniert die Genehmigungsdatei des Node-Hosts mit der Gateway-`tools.exec`-Richtlinie, weil beide zur Laufzeit weiterhin gelten
- wenn die Gateway-Konfiguration nicht verfügbar ist, fällt die CLI auf den Node-Genehmigungs-Snapshot zurück und merkt an, dass die endgültige Laufzeitrichtlinie nicht berechnet werden konnte

## Genehmigungen aus einer Datei ersetzen

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` akzeptiert JSON5, nicht nur striktes JSON. Verwenden Sie entweder `--file` oder `--stdin`, nicht beides.

## Beispiel für „Nie nachfragen“ / YOLO

Für einen Host, der nie wegen Exec-Genehmigungen anhalten soll, setzen Sie die Standardwerte der Host-Genehmigungen auf `full` + `off`:

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

- `host=auto` bedeutet weiterhin „Sandbox, wenn verfügbar, andernfalls Gateway“.
- Bei YOLO geht es um Genehmigungen, nicht um Routing.
- Wenn Sie Host-Exec auch dann verwenden möchten, wenn eine Sandbox konfiguriert ist, machen Sie die Host-Auswahl mit `gateway` oder `/exec host=gateway` explizit.

Ein ausgelassenes `askFallback` verwendet standardmäßig `deny`. Setzen Sie `askFallback: "full"`
explizit, wenn Sie einen Host ohne UI aktualisieren, der das Verhalten „nie nachfragen“ beibehalten soll.

Lokale Abkürzung:

```bash
openclaw exec-policy preset yolo
```

Diese lokale Abkürzung aktualisiert sowohl die angeforderte lokale `tools.exec.*`-Konfiguration als auch die
lokalen Genehmigungsstandardwerte gemeinsam. Sie entspricht in der Absicht der manuellen zweistufigen
Einrichtung oben, gilt aber nur für den lokalen Computer.

## Allowlist-Hilfsbefehle

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

- keine Ziel-Flags bedeuten die lokale Genehmigungsdatei auf dem Datenträger
- `--gateway` richtet sich an die Genehmigungsdatei des Gateway-Hosts
- `--node` richtet sich nach Auflösung von ID, Name, IP oder ID-Präfix an einen Node-Host

`allowlist add|remove` unterstützt außerdem:

- `--agent <id>` (standardmäßig `*`)

## Hinweise

- `--node` verwendet denselben Resolver wie `openclaw nodes` (ID, Name, IP oder ID-Präfix).
- `--agent` ist standardmäßig `"*"`, was für alle Agenten gilt.
- Der Node-Host muss `system.execApprovals.get/set` ankündigen (macOS-App oder Headless-Node-Host).
- Genehmigungsdateien werden pro Host im OpenClaw-State-Verzeichnis gespeichert
  (`$OPENCLAW_STATE_DIR/exec-approvals.json` oder
  `~/.openclaw/exec-approvals.json`, wenn die Variable nicht gesetzt ist).

## Verwandt

- [CLI-Referenz](/de/cli)
- [Exec-Genehmigungen](/de/tools/exec-approvals)
