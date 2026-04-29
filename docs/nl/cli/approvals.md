---
read_when:
    - Je wilt uitvoeringsgoedkeuringen bewerken vanuit de CLI
    - U moet toegangslijsten beheren op Gateway- of Node-hosts
summary: CLI-referentie voor `openclaw approvals` en `openclaw exec-policy`
title: Goedkeuringen
x-i18n:
    generated_at: "2026-04-29T22:30:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Beheer exec-goedkeuringen voor de **lokale host**, **Gateway-host** of een **Node-host**.
Standaard richten opdrachten zich op het lokale goedkeuringenbestand op schijf. Gebruik `--gateway` om de Gateway als doel te kiezen, of `--node` om een specifieke Node als doel te kiezen.

Alias: `openclaw exec-approvals`

Gerelateerd:

- Exec-goedkeuringen: [Exec-goedkeuringen](/nl/tools/exec-approvals)
- Nodes: [Nodes](/nl/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` is de lokale gemaksopdracht om de gevraagde
`tools.exec.*`-configuratie en het lokale goedkeuringenbestand van de host in een stap op elkaar afgestemd te houden.

Gebruik deze wanneer je het volgende wilt:

- het lokale gevraagde beleid, het goedkeuringenbestand van de host en de effectieve samenvoeging inspecteren
- een lokale preset toepassen, zoals YOLO of alles-weigeren
- lokale `tools.exec.*` en lokale `~/.openclaw/exec-approvals.json` synchroniseren

Voorbeelden:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Uitvoermodi:

- geen `--json`: drukt de voor mensen leesbare tabelweergave af
- `--json`: drukt machineleesbare gestructureerde uitvoer af

Huidig bereik:

- `exec-policy` is **alleen lokaal**
- het werkt het lokale configuratiebestand en het lokale goedkeuringenbestand samen bij
- het pusht beleid **niet** naar de Gateway-host of een Node-host
- `--host node` wordt in deze opdracht geweigerd omdat exec-goedkeuringen voor Nodes tijdens runtime van de Node worden opgehaald en in plaats daarvan moeten worden beheerd via goedkeuringsopdrachten die op Nodes zijn gericht
- `openclaw exec-policy show` markeert `host=node`-scopes als beheerd door de Node tijdens runtime, in plaats van een effectief beleid af te leiden uit het lokale goedkeuringenbestand

Als je goedkeuringen voor externe hosts rechtstreeks moet bewerken, blijf dan `openclaw approvals set --gateway`
of `openclaw approvals set --node <id|name|ip>` gebruiken.

## Algemene opdrachten

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` toont nu het effectieve exec-beleid voor lokale, Gateway- en Node-doelen:

- gevraagd `tools.exec`-beleid
- beleid uit het goedkeuringenbestand van de host
- effectief resultaat nadat voorrangsregels zijn toegepast

Voorrang is bewust gekozen:

- het goedkeuringenbestand van de host is de afdwingbare bron van waarheid
- gevraagd `tools.exec`-beleid kan intentie beperken of verruimen, maar het effectieve resultaat wordt nog steeds afgeleid uit de hostregels
- `--node` combineert het goedkeuringenbestand van de Node-host met het Gateway-`tools.exec`-beleid, omdat beide nog steeds van toepassing zijn tijdens runtime
- als de Gateway-configuratie niet beschikbaar is, valt de CLI terug op de snapshot van Node-goedkeuringen en meldt dat het uiteindelijke runtimebeleid niet kon worden berekend

## Goedkeuringen vervangen vanuit een bestand

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accepteert JSON5, niet alleen strikt JSON. Gebruik `--file` of `--stdin`, niet beide.

## Voorbeeld "Nooit vragen" / YOLO

Voor een host die nooit mag stoppen op exec-goedkeuringen, stel je de standaardwaarden voor hostgoedkeuringen in op `full` + `off`:

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

Dit wijzigt alleen het **goedkeuringenbestand van de host**. Om het gevraagde OpenClaw-beleid afgestemd te houden, stel je ook het volgende in:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Waarom `tools.exec.host=gateway` in dit voorbeeld:

- `host=auto` betekent nog steeds "sandbox wanneer beschikbaar, anders Gateway".
- YOLO gaat over goedkeuringen, niet over routering.
- Als je host-exec wilt, zelfs wanneer een sandbox is geconfigureerd, maak de hostkeuze dan expliciet met `gateway` of `/exec host=gateway`.

Dit komt overeen met het huidige YOLO-gedrag voor hoststandaarden. Maak het strenger als je goedkeuringen wilt.

Lokale snelkoppeling:

```bash
openclaw exec-policy preset yolo
```

Die lokale snelkoppeling werkt zowel de gevraagde lokale `tools.exec.*`-configuratie als de
lokale goedkeuringsstandaarden samen bij. Deze is qua intentie gelijkwaardig aan de handmatige tweestapsconfiguratie hierboven, maar alleen voor de lokale machine.

## Allowlist-helpers

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Algemene opties

`get`, `set` en `allowlist add|remove` ondersteunen allemaal:

- `--node <id|name|ip>`
- `--gateway`
- gedeelde Node-RPC-opties: `--url`, `--token`, `--timeout`, `--json`

Opmerkingen over doelkeuze:

- geen doelvlaggen betekent het lokale goedkeuringenbestand op schijf
- `--gateway` richt zich op het goedkeuringenbestand van de Gateway-host
- `--node` richt zich op een Node-host na het oplossen van id, naam, IP of id-prefix

`allowlist add|remove` ondersteunt ook:

- `--agent <id>` (standaard `*`)

## Opmerkingen

- `--node` gebruikt dezelfde resolver als `openclaw nodes` (id, naam, ip of id-prefix).
- `--agent` gebruikt standaard `"*"`, wat van toepassing is op alle agents.
- De Node-host moet `system.execApprovals.get/set` adverteren (macOS-app of headless Node-host).
- Goedkeuringenbestanden worden per host opgeslagen op `~/.openclaw/exec-approvals.json`.

## Gerelateerd

- [CLI-naslag](/nl/cli)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
