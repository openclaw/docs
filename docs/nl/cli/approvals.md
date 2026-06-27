---
read_when:
    - Je wilt uitvoeringsgoedkeuringen vanuit de CLI bewerken
    - Je moet toelatingslijsten beheren op Gateway- of Node-hosts
summary: CLI-referentie voor `openclaw approvals` en `openclaw exec-policy`
title: Goedkeuringen
x-i18n:
    generated_at: "2026-06-27T17:18:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Beheer exec-goedkeuringen voor de **lokale host**, **Gateway-host** of een **Node-host**.
Standaard richten opdrachten zich op het lokale goedkeuringenbestand op schijf. Gebruik `--gateway` om de Gateway als doel te gebruiken, of `--node` om een specifieke Node als doel te gebruiken.

Alias: `openclaw exec-approvals`

Gerelateerd:

- Exec-goedkeuringen: [Exec-goedkeuringen](/nl/tools/exec-approvals)
- Nodes: [Nodes](/nl/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` is de lokale gemaksopdracht om de gevraagde
`tools.exec.*`-configuratie en het lokale goedkeuringenbestand van de host in één stap gelijk te houden.

Gebruik deze wanneer je het volgende wilt:

- het lokale aangevraagde beleid, het goedkeuringenbestand van de host en de effectieve samenvoeging inspecteren
- een lokale preset zoals YOLO of alles-weigeren toepassen
- lokale `tools.exec.*` en het lokale goedkeuringenbestand van de host synchroniseren

Voorbeelden:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Uitvoermodi:

- geen `--json`: drukt de door mensen leesbare tabelweergave af
- `--json`: drukt machineleesbare gestructureerde uitvoer af

Huidig bereik:

- `exec-policy` is **alleen lokaal**
- het werkt het lokale configuratiebestand en het lokale goedkeuringenbestand samen bij
- het pusht **geen** beleid naar de Gateway-host of een Node-host
- `--host node` wordt in deze opdracht geweigerd omdat exec-goedkeuringen voor Nodes tijdens runtime van de Node worden opgehaald en in plaats daarvan via op Nodes gerichte goedkeuringsopdrachten moeten worden beheerd
- `openclaw exec-policy show` markeert bereiken met `host=node` als door Nodes beheerd tijdens runtime in plaats van een effectief beleid af te leiden uit het lokale goedkeuringenbestand

Als je goedkeuringen voor externe hosts direct moet bewerken, blijf dan `openclaw approvals set --gateway`
of `openclaw approvals set --node <id|name|ip>` gebruiken.

## Veelgebruikte opdrachten

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` toont nu het effectieve exec-beleid voor lokale, Gateway- en Node-doelen:

- aangevraagd `tools.exec`-beleid
- beleid van het goedkeuringenbestand van de host
- effectief resultaat nadat prioriteitsregels zijn toegepast

De prioriteit is bewust gekozen:

- het goedkeuringenbestand van de host is de afdwingbare bron van waarheid
- het aangevraagde `tools.exec`-beleid kan de intentie beperken of verruimen, maar het effectieve resultaat wordt nog steeds afgeleid van de hostregels
- `--node` combineert het goedkeuringenbestand van de Node-host met het Gateway-`tools.exec`-beleid, omdat beide nog steeds tijdens runtime gelden
- als de Gateway-configuratie niet beschikbaar is, valt de CLI terug op de snapshot van Node-goedkeuringen en vermeldt deze dat het uiteindelijke runtimebeleid niet kon worden berekend

## Goedkeuringen vervangen vanuit een bestand

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accepteert JSON5, niet alleen strikte JSON. Gebruik `--file` of `--stdin`, niet beide.

## Voorbeeld voor "Nooit vragen" / YOLO

Voor een host die nooit moet stoppen op exec-goedkeuringen, stel je de standaardwaarden voor hostgoedkeuringen in op `full` + `off`:

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

Node-variant:

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

Dit wijzigt alleen het **goedkeuringenbestand van de host**. Stel ook het volgende in om het aangevraagde OpenClaw-beleid gelijk te houden:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Waarom `tools.exec.host=gateway` in dit voorbeeld:

- `host=auto` betekent nog steeds "sandbox wanneer beschikbaar, anders Gateway".
- YOLO gaat over goedkeuringen, niet over routering.
- Als je host-exec wilt, zelfs wanneer een sandbox is geconfigureerd, maak de hostkeuze dan expliciet met `gateway` of `/exec host=gateway`.

Weggelaten `askFallback` krijgt standaard `deny`. Stel `askFallback: "full"`
expliciet in wanneer je een host zonder UI upgradet die nooit-vragen-gedrag moet behouden.

Lokale snelkoppeling:

```bash
openclaw exec-policy preset yolo
```

Die lokale snelkoppeling werkt zowel de aangevraagde lokale `tools.exec.*`-configuratie als de
lokale standaardwaarden voor goedkeuringen samen bij. De intentie is gelijk aan de handmatige tweestaps
configuratie hierboven, maar alleen voor de lokale machine.

## Hulpfuncties voor allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Veelgebruikte opties

`get`, `set` en `allowlist add|remove` ondersteunen allemaal:

- `--node <id|name|ip>`
- `--gateway`
- gedeelde Node-RPC-opties: `--url`, `--token`, `--timeout`, `--json`

Opmerkingen over doelkeuze:

- geen doelvlaggen betekent het lokale goedkeuringenbestand op schijf
- `--gateway` richt zich op het goedkeuringenbestand van de Gateway-host
- `--node` richt zich op één Node-host na het oplossen van id, naam, IP of id-prefix

`allowlist add|remove` ondersteunt ook:

- `--agent <id>` (standaard `*`)

## Opmerkingen

- `--node` gebruikt dezelfde resolver als `openclaw nodes` (id, naam, ip of id-prefix).
- `--agent` heeft standaardwaarde `"*"`, wat van toepassing is op alle agents.
- De Node-host moet `system.execApprovals.get/set` adverteren (macOS-app of headless Node-host).
- Goedkeuringenbestanden worden per host opgeslagen in de OpenClaw-statusmap
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, of
  `~/.openclaw/exec-approvals.json` wanneer de variabele niet is ingesteld).

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
