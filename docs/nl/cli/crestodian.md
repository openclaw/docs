---
read_when:
    - Je voert openclaw zonder commando uit en wilt Crestodian begrijpen
    - Je hebt een veilige manier zonder configuratie nodig om OpenClaw te inspecteren of te repareren
    - Je ontwerpt of activeert de reddingsmodus voor berichtkanalen
summary: CLI-referentie en beveiligingsmodel voor Crestodian, de installatie- en herstelhelper die veilig werkt zonder configuratie
title: Crestodian
x-i18n:
    generated_at: "2026-04-29T22:31:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian is OpenClaw's lokale hulp voor installatie, reparatie en configuratie. Het is
ontworpen om bereikbaar te blijven wanneer het normale agentpad kapot is.

Als je `openclaw` zonder opdracht uitvoert, start Crestodian in een interactieve terminal.
Als je `openclaw crestodian` uitvoert, start dezelfde helper expliciet.

## Wat Crestodian toont

Bij het opstarten opent interactieve Crestodian dezelfde TUI-shell die wordt gebruikt door
`openclaw tui`, met een Crestodian-chatbackend. Het chatlog begint met een korte
begroeting:

- wanneer Crestodian te starten
- het model of het deterministische plannerpad dat Crestodian daadwerkelijk gebruikt
- configuratiegeldigheid en de standaardagent
- Gateway-bereikbaarheid vanaf de eerste opstartprobe
- de volgende debugactie die Crestodian kan uitvoeren

Het dumpt geen geheimen en laadt geen Plugin-CLI-opdrachten alleen maar om te starten. De TUI
biedt nog steeds de normale koptekst, het chatlog, de statusregel, voettekst, autocomplete
en editorbesturing.

Gebruik `status` voor de gedetailleerde inventaris met configuratiepad, documentatie-/bronpaden,
lokale CLI-probes, aanwezigheid van API-sleutels, agents, model en Gateway-details.

Crestodian gebruikt dezelfde OpenClaw-referentiedetectie als reguliere agents. In een Git-checkout
wijst het zichzelf naar lokale `docs/` en de lokale broncodeboom. In een npm-pakketinstallatie gebruikt het
de gebundelde pakketdocumentatie en linkt naar
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), met expliciete
richtlijnen om de broncode te controleren wanneer de documentatie niet genoeg is.

## Voorbeelden

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Binnen de Crestodian-TUI:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Veilig opstarten

Het opstartpad van Crestodian is bewust klein. Het kan worden uitgevoerd wanneer:

- `openclaw.json` ontbreekt
- `openclaw.json` ongeldig is
- de Gateway offline is
- registratie van Plugin-opdrachten niet beschikbaar is
- er nog geen agent is geconfigureerd

`openclaw --help` en `openclaw --version` gebruiken nog steeds de normale snelle paden.
Niet-interactieve `openclaw` sluit af met een kort bericht in plaats van root-help af te drukken,
omdat het product zonder opdracht Crestodian is.

## Bewerkingen en goedkeuring

Crestodian gebruikt getypeerde bewerkingen in plaats van ad-hoc configuratie te bewerken.

Alleen-lezen bewerkingen kunnen direct worden uitgevoerd:

- overzicht tonen
- agents weergeven
- model-/backendstatus tonen
- status- of healthchecks uitvoeren
- Gateway-bereikbaarheid controleren
- doctor uitvoeren zonder interactieve reparaties
- configuratie valideren
- het auditlogpad tonen

Persistente bewerkingen vereisen gesprekstoestemming in interactieve modus, tenzij
je `--yes` meegeeft voor een directe opdracht:

- configuratie schrijven
- `config set` uitvoeren
- ondersteunde SecretRef-waarden instellen via `config set-ref`
- installatie-/onboarding-bootstrap uitvoeren
- het standaardmodel wijzigen
- de Gateway starten, stoppen of herstarten
- agents maken
- doctor-reparaties uitvoeren die configuratie of status herschrijven

Toegepaste schrijfbewerkingen worden vastgelegd in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Detectie wordt niet geaudit. Alleen toegepaste bewerkingen en schrijfbewerkingen worden gelogd.

`openclaw onboard --modern` start Crestodian als de moderne onboarding-preview.
Gewoon `openclaw onboard` voert nog steeds klassieke onboarding uit.

## Installatie-bootstrap

`setup` is de chat-first onboarding-bootstrap. Het schrijft alleen via getypeerde
configuratiebewerkingen en vraagt eerst om goedkeuring.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Wanneer er geen model is geconfigureerd, selecteert setup de eerste bruikbare backend in deze
volgorde en vertelt welke is gekozen:

- bestaand expliciet model, als dat al is geconfigureerd
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Als er geen beschikbaar zijn, schrijft setup nog steeds de standaardwerkruimte en laat het
model niet ingesteld. Installeer of log in bij Codex/Claude Code, of stel
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` beschikbaar, en voer setup daarna opnieuw uit.

## Modelondersteunde Planner

Crestodian start altijd in deterministische modus. Voor vage opdrachten die de
deterministische parser niet begrijpt, kan lokale Crestodian één begrensde
plannerbeurt maken via OpenClaw's normale runtimepaden. Het gebruikt eerst het
geconfigureerde OpenClaw-model. Als er nog geen geconfigureerd model bruikbaar is, kan het
terugvallen op lokale runtimes die al op de machine aanwezig zijn:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server-harnas: `openai/gpt-5.5` met `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

De modelondersteunde planner kan configuratie niet rechtstreeks muteren. Het moet de
aanvraag vertalen naar een van Crestodian's getypeerde opdrachten, waarna de normale regels voor
goedkeuring en audit van toepassing zijn. Crestodian drukt het gebruikte model en de geïnterpreteerde
opdracht af voordat het iets uitvoert. Plannerbeurten met fallback zonder configuratie zijn
tijdelijk, tool-uitgeschakeld waar de runtime dat ondersteunt, en gebruiken een tijdelijke
werkruimte/sessie.

Rescuemodus via berichtenkanalen gebruikt de modelondersteunde planner niet. Remote
rescue blijft deterministisch zodat een kapot of gecompromitteerd normaal agentpad niet
kan worden gebruikt als configuratie-editor.

## Overschakelen naar een agent

Gebruik een natuurlijke-taalselector om Crestodian te verlaten en de normale TUI te openen:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` en `openclaw terminal` openen nog steeds direct de normale
agent-TUI. Ze starten Crestodian niet.

Na overschakelen naar de normale TUI gebruik je `/crestodian` om terug te keren naar Crestodian.
Je kunt een vervolgverzoek opnemen:

```text
/crestodian
/crestodian restart gateway
```

Agentwissels binnen de TUI laten een spoor achter dat `/crestodian` beschikbaar is.

## Rescuemodus via berichten

Rescuemodus via berichten is het berichtenkanaal-entrypoint voor Crestodian. Het is bedoeld voor
het geval waarin je normale agent dood is, maar een vertrouwd kanaal zoals WhatsApp
nog steeds opdrachten ontvangt.

Ondersteunde tekstopdracht:

- `/crestodian <request>`

Operatorflow:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Agentcreatie kan ook vanuit de lokale prompt of rescuemodus in de wachtrij worden gezet:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Remote rescuemodus is een adminoppervlak. Het moet worden behandeld als externe configuratie-
reparatie, niet als normale chat.

Beveiligingscontract voor remote rescue:

- Uitgeschakeld wanneer sandboxing actief is. Als een agent/sessie gesandboxt is,
  moet Crestodian remote rescue weigeren en uitleggen dat lokale CLI-reparatie
  vereist is.
- Standaard effectieve status is `auto`: sta remote rescue alleen toe in vertrouwde YOLO-
  werking, waar de runtime al ongesandboxte lokale bevoegdheid heeft.
- Vereis een expliciete eigenaaridentiteit. Rescue mag geen wildcard-afzenderregels,
  open groepsbeleid, niet-geverifieerde webhooks of anonieme kanalen accepteren.
- Standaard alleen eigenaar-DM's. Rescue in groepen/kanalen vereist expliciete opt-in.
- Remote rescue kan de lokale TUI niet openen of overschakelen naar een interactieve agent-
  sessie. Gebruik lokale `openclaw` voor agentoverdracht.
- Persistente schrijfbewerkingen vereisen nog steeds goedkeuring, zelfs in rescuemodus.
- Audit elke toegepaste rescuebewerking. Rescue via berichtenkanalen registreert kanaal,
  account, afzender en bronadresmetadata. Configuratiemuterende bewerkingen registreren ook
  configuratiehashes vóór en na.
- Echo nooit geheimen. SecretRef-inspectie moet beschikbaarheid rapporteren, niet
  waarden.
- Als de Gateway actief is, geef de voorkeur aan getypeerde Gateway-bewerkingen. Als de Gateway
  dood is, gebruik dan alleen het minimale lokale reparatieoppervlak dat niet afhankelijk is van de
  normale agentloop.

Configuratievorm:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` moet accepteren:

- `"auto"`: standaard. Sta alleen toe wanneer de effectieve runtime YOLO is en
  sandboxing uit staat.
- `false`: sta rescue via berichtenkanalen nooit toe.
- `true`: sta rescue expliciet toe wanneer de eigenaar-/kanaalcontroles slagen. Dit
  mag nog steeds de sandboxing-weigering niet omzeilen.

De standaard `"auto"` YOLO-houding is:

- sandboxmodus wordt herleid tot `off`
- `tools.exec.security` wordt herleid tot `full`
- `tools.exec.ask` wordt herleid tot `off`

Remote rescue wordt gedekt door de Docker-lane:

```bash
pnpm test:docker:crestodian-rescue
```

Lokale plannerfallback zonder configuratie wordt gedekt door:

```bash
pnpm test:docker:crestodian-planner
```

Een opt-in live kanaal-commandosurface-smoke controleert `/crestodian status` plus een
persistente goedkeuringsroundtrip via de rescuehandler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Verse installatie zonder configuratie via Crestodian wordt gedekt door:

```bash
pnpm test:docker:crestodian-first-run
```

Die lane begint met een lege statusmap, routeert kale `openclaw` naar Crestodian,
stelt het standaardmodel in, maakt een extra agent, configureert Discord via
een Plugin-inschakeling plus token-SecretRef, valideert configuratie en controleert het auditlog.
QA Lab heeft ook een repo-gebonden scenario voor dezelfde Ring 0-flow:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/cli/doctor)
- [TUI](/nl/cli/tui)
- [Sandbox](/nl/cli/sandbox)
- [Beveiliging](/nl/cli/security)
