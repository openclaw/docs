---
read_when:
    - U wilt uitvoeringsgoedkeuringen bewerken vanuit de CLI
    - U moet toelatingslijsten beheren op Gateway- of Node-hosts
summary: CLI-referentie voor `openclaw approvals` en `openclaw exec-policy`
title: Goedkeuringen
x-i18n:
    generated_at: "2026-07-12T08:41:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Beheer uitvoeringsgoedkeuringen voor de **lokale host**, **Gateway-host** of een **Node-host**. Zonder doelvlag lezen/schrijven opdrachten het lokale goedkeuringsbestand op schijf. Gebruik `--gateway` om de Gateway als doel in te stellen, of `--node <id|name|ip>` om een specifieke Node als doel in te stellen.

Alias: `openclaw exec-approvals`

Gerelateerd: [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals), [Nodes](/nl/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` is de **uitsluitend lokale** gemaksopdracht waarmee de aangevraagde `tools.exec.*`-configuratie en het lokale goedkeuringsbestand voor de host in één stap worden gesynchroniseerd:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Voorinstellingen (`yolo`, `cautious`, `deny-all`) passen `host`, `security`, `ask` en `askFallback` samen toe. `set` past alleen de vlaggen toe die u doorgeeft; elke geaccepteerde waarde wordt gevalideerd (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Bereik:

- Werkt het lokale configuratiebestand en lokale goedkeuringsbestand samen bij; stuurt het beleid niet naar de Gateway of een Node-host.
- `--host node` wordt geweigerd: uitvoeringsgoedkeuringen voor Nodes worden tijdens runtime opgehaald bij de Node, waardoor lokale `exec-policy` deze niet kan synchroniseren. Gebruik in plaats daarvan `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` markeert bereiken met `host=node` tijdens runtime als beheerd door de Node, in plaats van een effectief beleid af te leiden uit het lokale goedkeuringsbestand.

Gebruik voor goedkeuringen van externe hosts rechtstreeks `openclaw approvals set --gateway` of `openclaw approvals set --node <id|name|ip>`.

## Veelgebruikte opdrachten

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` toont het effectieve uitvoeringsbeleid voor het doel: het aangevraagde `tools.exec`-beleid, het beleid uit het goedkeuringsbestand van de host en het samengevoegde effectieve resultaat. Nodes met een systeemeigen hostbeleid, zoals de Windows-begeleidende app, tonen dat beleid rechtstreeks in plaats van de beleidsberekening van het OpenClaw-goedkeuringsbestand toe te passen.

Voor Nodes met een bestandsgebaseerd beleid vereist de samengevoegde weergave een door de host opgeloste momentopname van het beleid. Bij oudere Nodes wordt het effectieve beleid als niet beschikbaar weergegeven, in plaats van aan te nemen dat het aangevraagde beleid van de Gateway ook op de host van toepassing is.

<Note>
`/exec`-overschrijvingen per sessie zijn niet inbegrepen. Voer `/exec` uit in de betreffende sessie om de huidige standaardwaarden te bekijken.
</Note>

Voorrangsvolgorde:

- Het goedkeuringsbestand van de host is de afdwingbare gezaghebbende bron.
- Het aangevraagde `tools.exec`-beleid kan de intentie beperken of verruimen, maar het effectieve resultaat wordt afgeleid van de hostregels.
- `--node` combineert het goedkeuringsbestand van de Node-host met het `tools.exec`-beleid van de Gateway (beide zijn tijdens runtime van toepassing).
- Als de Gateway-configuratie niet beschikbaar is, valt de CLI terug op de momentopname van de Node-goedkeuringen en vermeldt deze dat het uiteindelijke runtimebeleid niet kon worden berekend.

## Goedkeuringen vervangen vanuit een bestand

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accepteert JSON5, niet alleen strikte JSON. Gebruik `--file` of `--stdin`, maar niet beide.

Systeemeigen Windows-Nodes gebruiken hun eigen beleidsstructuur:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

De CLI leest eerst de huidige hash van de Node en verzendt deze met de update, zodat gelijktijdige lokale bewerkingen worden geweigerd in plaats van overschreven. `rules` is vereist omdat deze bewerking de volledige regellijst van de Node vervangt; `defaultAction` is optioneel. Een Node die meldt dat het systeemeigen beleid is uitgeschakeld, kan niet extern worden geconfigureerd; schakel het beleid eerst in of configureer het op die host. Systeemeigen hostbeleidsregels ondersteunen de helpers `allowlist add|remove` niet.

## Voorbeeld voor ‘nooit vragen’ / YOLO

Stel de standaardwaarden voor hostgoedkeuringen in op `full` + `off` voor een host die nooit mag stoppen voor uitvoeringsgoedkeuringen:

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

Gebruik voor Nodes die een OpenClaw-goedkeuringsbestand beschikbaar stellen dezelfde inhoud met `openclaw approvals set --node <id|name|ip> --stdin`. Systeemeigen host-Nodes vereisen de hierboven getoonde eigenaarspecifieke structuur.

Dit wijzigt alleen het **goedkeuringsbestand van de host**. Stel ook het volgende in om het aangevraagde OpenClaw-beleid hiermee in lijn te houden:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` wordt hier expliciet gebruikt omdat `host=auto` nog steeds ‘sandbox indien beschikbaar, anders Gateway’ betekent: YOLO gaat over goedkeuringen, niet over routering. Gebruik `gateway` (of `/exec host=gateway`) wanneer u uitvoering op de host wilt, zelfs als er een sandbox is geconfigureerd.

Een weggelaten `askFallback` krijgt standaard de waarde `deny`. Stel `askFallback: "full"` expliciet in bij het upgraden van een host zonder gebruikersinterface die het gedrag zonder vragen moet behouden.

Lokale snelkoppeling voor dezelfde intentie, uitsluitend op de lokale machine:

```bash
openclaw exec-policy preset yolo
```

## Helpers voor de toestemmingslijst

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Algemene opties

`get`, `set` en `allowlist add|remove` ondersteunen allemaal:

- `--node <id|name|ip>` (herkent id, naam, IP-adres of id-voorvoegsel; dezelfde resolver als `openclaw nodes`)
- `--gateway`
- gedeelde RPC-opties voor Nodes: `--url`, `--token`, `--timeout`, `--json`

Zonder doelvlag wordt het lokale goedkeuringsbestand op schijf gebruikt.

`allowlist add|remove` ondersteunt ook `--agent <id>` (standaardwaarde is `"*"`, van toepassing op alle agents).

## Opmerkingen

- De Node-host moet `system.execApprovals.get/set` beschikbaar stellen (macOS-app, headless Node-host of Windows-begeleidende app).
- Goedkeuringsbestanden worden per host opgeslagen in de OpenClaw-statusmap: `$OPENCLAW_STATE_DIR/exec-approvals.json`, of `~/.openclaw/exec-approvals.json` wanneer de variabele niet is ingesteld.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)
