---
read_when:
    - Sie möchten Ausführungsgenehmigungen über die CLI bearbeiten
    - Sie müssen Zulassungslisten auf Gateway- oder Node-Hosts verwalten
    - Sie müssen eine ausstehende Genehmigung ohne Chat-Oberfläche auflisten oder bearbeiten
summary: CLI-Referenz für `openclaw approvals` und `openclaw exec-policy`
title: Genehmigungen
x-i18n:
    generated_at: "2026-07-24T03:41:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f8b6f198af718d7b058498dbb960a1eb68ced601e1cd9205070b7199688552d2
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Verwalten Sie Ausführungsgenehmigungen für den **lokalen Host**, den **Gateway-Host** oder einen **Node-Host**. Ohne Zielflag lesen bzw. schreiben Befehle die lokale Genehmigungsdatei auf dem Datenträger. Verwenden Sie `--gateway`, um das Gateway als Ziel festzulegen, oder `--node <id|name|ip>`, um einen bestimmten Node als Ziel festzulegen.

Alias: `openclaw exec-approvals`

Verwandte Themen: [Ausführungsgenehmigungen](/de/tools/exec-approvals), [Nodes](/de/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` ist der praktische, **ausschließlich lokale** Befehl, der die angeforderte `tools.exec.*`-Konfiguration und die lokale Host-Genehmigungsdatei in einem Schritt synchron hält:

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
- `--host node` wird abgelehnt: Ausführungsgenehmigungen für Nodes werden zur Laufzeit vom Node abgerufen, sodass die lokale `exec-policy` sie nicht synchronisieren kann. Verwenden Sie stattdessen `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` kennzeichnet `host=node`-Geltungsbereiche zur Laufzeit als vom Node verwaltet, anstatt eine effektive Richtlinie aus der lokalen Genehmigungsdatei abzuleiten.

Verwenden Sie für Genehmigungen auf Remote-Hosts direkt `openclaw approvals set --gateway` oder `openclaw approvals set --node <id|name|ip>`.

## Häufig verwendete Befehle

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals resolve <id> <allow-once|allow-always|deny>
```

`get` zeigt die effektive Ausführungsrichtlinie für das Ziel: die angeforderte `tools.exec`-Richtlinie, die Richtlinie der Host-Genehmigungsdatei und das zusammengeführte effektive Ergebnis. Nodes mit einer hostnativen Richtlinie, etwa die Windows-Begleitanwendung, zeigen diese Richtlinie direkt an, statt die Richtlinienlogik der OpenClaw-Genehmigungsdatei anzuwenden.

Für dateibasierte Nodes erfordert die zusammengeführte Ansicht einen vom Host aufgelösten Richtlinien-Snapshot. Bei älteren Nodes wird die effektive Richtlinie als nicht verfügbar angezeigt, statt anzunehmen, dass die angeforderte Richtlinie des Gateways auch auf dem Host gilt.

<Note>
Sitzungsspezifische `/exec`-Überschreibungen sind nicht enthalten. Führen Sie `/exec` in der betreffenden Sitzung aus, um deren aktuelle Standardwerte zu prüfen.
</Note>

Rangfolge:

- Die Host-Genehmigungsdatei ist die verbindliche maßgebliche Quelle.
- Die angeforderte `tools.exec`-Richtlinie kann die beabsichtigten Berechtigungen einschränken oder erweitern, das effektive Ergebnis wird jedoch aus den Hostregeln abgeleitet.
- `--node` kombiniert die Genehmigungsdatei des Node-Hosts mit der `tools.exec`-Richtlinie des Gateways (beide gelten zur Laufzeit).
- Wenn die Gateway-Konfiguration nicht verfügbar ist, greift die CLI auf den Genehmigungs-Snapshot des Nodes zurück und weist darauf hin, dass die endgültige Laufzeitrichtlinie nicht berechnet werden konnte.

## Ausstehende Genehmigungen

Listen Sie ausstehende Genehmigungen für Ausführungen, Plugins und OpenClaw-Systemagenten vom Gateway auf:

```bash
openclaw approvals pending
openclaw approvals pending --json
```

Die vollständige Auflistung und der entsprechende operatorweite `resolve`-Ablauf verwenden `operator.admin`, da Genehmigungsdatensätze andernfalls die Filterung nach Anforderndem und Prüfendem beibehalten. Die Auflösung fordert außerdem den dedizierten `operator.approvals`-Geltungsbereich an. Die standardmäßige CLI-Operatorberechtigung umfasst beide Geltungsbereiche; ein eingeschränkter Drittanbieter-Client sollte keine Administratorberechtigung anfordern, nur um diesen Befehl nachzubilden.

Die lesbare Ausgabe zeigt die Genehmigungsart, die Agenten-/Sitzungszuordnung, das Alter der Anfrage, die Zeit bis zum Ablauf, einen gekürzten Befehl oder eine gekürzte Zusammenfassung sowie ein Shell-neutrales `id64_<base64url>`-ID-Token. Auf die kompakte Tabelle folgt immer ein `Full request text`-Block mit sämtlichen vollständigen Token und einer verlustfrei maskierten Anfrage, sodass eine durch die Terminalbreite bedingte Kürzung weder ein Suffix noch das für die Auflösung erforderliche Token verbergen kann. Kopieren Sie das vollständige Token in `resolve`. Unsichere Terminalzeichen in anderen Feldern werden als sichtbare Unicode-Escapesequenzen dargestellt. Die JSON-Ausgabe gibt normalisierte Einträge unter `approvals` zurück und bewahrt die ursprünglichen Rohwerte für `id`, `summary`, `createdAtMs` und `expiresAtMs` für Skripte; Roh-IDs werden von `resolve` weiterhin akzeptiert, sofern sie nicht das reservierte Präfix für Anzeigetoken `id64_` verwenden.

Wenn ein angegebener `id64_`-Wert sowohl mit einer wörtlichen Roh-ID als auch mit dem dekodierten Anzeigetoken einer anderen Genehmigung übereinstimmt, lehnt die CLI ihn als mehrdeutig ab, statt die Auflösung der falschen Anfrage zu riskieren.

Lösen Sie eine Genehmigung anhand ihrer vollständigen ID auf:

```bash
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "Während der Wartung nicht erwartet"
```

Die CLI liest den einheitlichen Genehmigungsdatensatz, um dessen Art zu bestimmen, prüft die angeforderte Entscheidung anhand der für den Datensatz zulässigen Entscheidungen und ruft anschließend den einheitlichen Resolver auf. Eine erste erfolgreiche Entscheidung wird mit `0` beendet. Eine Wiederholung der aufgezeichneten Entscheidung wird ebenfalls mit `0` beendet und meldet `already resolved (same decision)`. Bei einer widersprüchlichen Entscheidung, einer fehlenden oder abgelaufenen Genehmigung oder einer für diese Genehmigungsart nicht verfügbaren Entscheidung wird eine eindeutige Fehlermeldung ausgegeben und der Vorgang mit einem von null verschiedenen Status beendet.

`--reason` fügt der CLI-Bestätigung eine lokale Anmerkung hinzu. Der aktuelle Gateway-Genehmigungsdatensatz besitzt kein Freitextfeld für den Auflösungsgrund, daher wird diese Anmerkung weder gespeichert noch an andere Genehmigungsoberflächen gesendet.

## Genehmigungen aus einer Datei ersetzen

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` akzeptiert JSON5, nicht nur striktes JSON. Verwenden Sie entweder `--file` oder `--stdin`, nicht beide.

Hostnative Windows-Nodes verwenden ihr eigenes Richtlinienformat:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

Die CLI liest zunächst den aktuellen Hash des Nodes und sendet ihn mit der Aktualisierung, sodass gleichzeitige lokale Änderungen abgelehnt statt überschrieben werden. `rules` ist erforderlich, da dieser Vorgang die vollständige Regelliste des Nodes ersetzt; `defaultAction` ist optional. Ein Node, der seine native Richtlinie als deaktiviert meldet, kann nicht remote konfiguriert werden; aktivieren oder konfigurieren Sie die Richtlinie zunächst auf diesem Host. Hostnative Richtlinien unterstützen die `allowlist add|remove`-Hilfsfunktionen nicht.

## Beispiel für „Nie nachfragen“ / YOLO

Setzen Sie die Standardwerte der Host-Genehmigungen auf `full` + `off` für einen Host, der niemals wegen Ausführungsgenehmigungen anhalten soll:

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

Verwenden Sie für Nodes, die eine OpenClaw-Genehmigungsdatei bereitstellen, denselben Inhalt mit `openclaw approvals set --node <id|name|ip> --stdin`. Hostnative Nodes erfordern ihr oben dargestelltes, ownerspezifisches Format.

Dadurch wird nur die **Host-Genehmigungsdatei** geändert. Um auch die angeforderte OpenClaw-Richtlinie abzugleichen, legen Sie Folgendes fest:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.mode full
```

`tools.exec.host=gateway` wird hier ausdrücklich angegeben, da `host=auto` weiterhin „Sandbox, sofern verfügbar, andernfalls Gateway“ bedeutet: Bei YOLO geht es um Genehmigungen, nicht um das Routing. Verwenden Sie `gateway` (oder `/exec host=gateway`), wenn Sie auch bei konfigurierter Sandbox eine Ausführung auf dem Host wünschen.

Ein ausgelassener `askFallback`-Wert verwendet standardmäßig `deny`. Legen Sie `askFallback: "full"` beim Upgrade eines Hosts ohne Benutzeroberfläche, der das Verhalten „Nie nachfragen“ beibehalten soll, ausdrücklich fest.

Lokale Kurzform für dieselbe Absicht, ausschließlich auf dem lokalen Computer:

```bash
openclaw exec-policy preset yolo
```

## Hilfsfunktionen für Zulassungslisten

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Allgemeine Optionen

`get`, `set` und `allowlist add|remove` unterstützen alle:

- `--node <id|name|ip>` (löst ID, Namen, IP-Adresse oder ID-Präfix auf; derselbe Resolver wie bei `openclaw nodes`)
- `--gateway`
- gemeinsame Node-RPC-Optionen: `--url`, `--token`, `--timeout`, `--json`

Ohne Zielflag wird die lokale Genehmigungsdatei auf dem Datenträger verwendet.

`allowlist add|remove` unterstützt außerdem `--agent <id>` (standardmäßig `"*"`, gilt für alle Agenten).

`pending` und `resolve` verwenden immer das Gateway, da ausstehende Anfragen einen aktiven Gateway-Zustand darstellen. Sie unterstützen die gemeinsamen Gateway-Verbindungsoptionen `--url`, `--token` und `--timeout`; `pending` unterstützt außerdem `--json`.

## Hinweise

- Der Node-Host muss `system.execApprovals.get/set` bekannt geben (macOS-App, Headless-Node-Host oder Windows-Begleitanwendung).
- Genehmigungsdateien werden pro Host im OpenClaw-Zustandsverzeichnis gespeichert: `$OPENCLAW_STATE_DIR/exec-approvals.json` oder `~/.openclaw/exec-approvals.json`, wenn die Variable nicht gesetzt ist.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
