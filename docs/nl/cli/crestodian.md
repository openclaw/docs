---
read_when:
    - Je voert openclaw na de installatie zonder commando uit en wilt Crestodian begrijpen
    - Je hebt een configless-veilige manier nodig om OpenClaw te inspecteren of te repareren
    - U ontwerpt of schakelt de reddingsmodus voor berichtkanalen in
summary: CLI-referentie en beveiligingsmodel voor Crestodian, de configuratieloze veilige installatie- en reparatiehulp
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:18:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian is OpenClaw's lokale helper voor installatie, reparatie en configuratie. Deze is
ontworpen om bereikbaar te blijven wanneer het normale agentpad kapot is.

Als je `openclaw` zonder opdracht uitvoert, start eerst de klassieke onboarding wanneer het
actieve configuratiebestand ontbreekt of geen door de gebruiker gemaakte instellingen bevat (leeg of
alleen metadata). Nadat een configuratiebestand door de gebruiker gemaakte instellingen bevat, start
`openclaw` zonder opdracht Crestodian in een interactieve terminal. Met
`openclaw crestodian` start je dezelfde helper expliciet.

## Wat Crestodian toont

Bij het opstarten opent interactieve Crestodian dezelfde TUI-shell die door
`openclaw tui` wordt gebruikt, met een Crestodian-chatbackend. Het chatlog begint met een korte
begroeting:

- wanneer je Crestodian moet starten
- het model of het deterministische plannerpad dat Crestodian daadwerkelijk gebruikt
- configuratiegeldigheid en de standaardagent
- Gateway-bereikbaarheid vanaf de eerste opstartprobe
- de volgende debugactie die Crestodian kan uitvoeren

Het dumpt geen geheimen en laadt geen Plugin-CLI-opdrachten alleen om te starten. De TUI
biedt nog steeds de normale koptekst, chatlog, statusregel, voettekst, automatisch aanvullen
en editorbesturingen.

Gebruik `status` voor de gedetailleerde inventaris met configuratiepad, docs-/bronpaden,
lokale CLI-probes, aanwezigheid van API-sleutels, agents, model en Gateway-details.

Crestodian gebruikt dezelfde OpenClaw-referentiedetectie als reguliere agents. In een Git-checkout
wijst het zichzelf naar lokale `docs/` en de lokale broncodeboom. In een npm-package-installatie
gebruikt het de gebundelde packagedocs en linkt het naar
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), met expliciete
aanwijzingen om de broncode te bekijken wanneer de docs niet genoeg zijn.

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
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Veilig opstarten

Het opstartpad van Crestodian is bewust klein. Het kan draaien wanneer:

- `openclaw.json` ontbreekt
- `openclaw.json` ongeldig is
- de Gateway offline is
- Plugin-opdrachtregistratie niet beschikbaar is
- er nog geen agent is geconfigureerd

`openclaw --help` en `openclaw --version` gebruiken nog steeds de normale snelle paden.
Niet-interactieve kale `openclaw` sluit af met een kort bericht in plaats van
root-help af te drukken. Bij een nieuwe installatie verwijst het bericht naar niet-interactieve onboarding;
na installatie verwijst het naar eenmalige Crestodian-opdrachten.

## Bewerkingen en goedkeuring

Crestodian gebruikt getypte bewerkingen in plaats van configuratie ad hoc te bewerken.

Alleen-lezen bewerkingen kunnen direct worden uitgevoerd:

- overzicht tonen
- agents tonen
- geïnstalleerde Plugins tonen
- ClawHub-Plugins zoeken
- model-/backendstatus tonen
- status- of healthchecks uitvoeren
- Gateway-bereikbaarheid controleren
- doctor uitvoeren zonder interactieve reparaties
- configuratie valideren
- auditlogpad tonen

Persistente bewerkingen vereisen conversationele goedkeuring in interactieve modus, tenzij
je `--yes` doorgeeft voor een directe opdracht:

- configuratie schrijven
- `config set` uitvoeren
- ondersteunde SecretRef-waarden instellen via `config set-ref`
- setup-/onboarding-bootstrap uitvoeren
- het standaardmodel wijzigen
- de Gateway starten, stoppen of herstarten
- agents maken
- Plugins installeren vanuit ClawHub of npm
- Plugins verwijderen
- doctor-reparaties uitvoeren die configuratie of status herschrijven

Toegepaste schrijfacties worden vastgelegd in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Detectie wordt niet geaudit. Alleen toegepaste bewerkingen en schrijfacties worden gelogd.

`openclaw onboard --modern` start Crestodian als de moderne onboardingpreview.
Gewone `openclaw onboard` voert nog steeds klassieke onboarding uit.

## Setup-bootstrap

`setup` is de chat-first onboarding-bootstrap. Het schrijft alleen via getypte
configuratiebewerkingen en vraagt eerst om goedkeuring.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Wanneer er geen model is geconfigureerd, selecteert setup de eerste bruikbare backend in deze
volgorde en vertelt het wat het heeft gekozen:

- bestaand expliciet model, als dat al is geconfigureerd
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` via de Codex app-server-harness

Als er geen beschikbaar zijn, schrijft setup nog steeds de standaardwerkruimte en laat het
model oningesteld. Installeer of log in bij Codex/Claude Code, of stel
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` beschikbaar, en voer setup daarna opnieuw uit.

## Modelondersteunde planner

Crestodian start altijd in deterministische modus. Voor vage opdrachten die de
deterministische parser niet begrijpt, kan lokale Crestodian één begrensde
plannerbeurt doen via OpenClaw's normale runtimepaden. Het gebruikt eerst het
geconfigureerde OpenClaw-model. Als er nog geen geconfigureerd model bruikbaar is, kan het
terugvallen op lokale runtimes die al op de machine aanwezig zijn:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- Codex app-server-harness: `openai/gpt-5.5`

De modelondersteunde planner kan configuratie niet rechtstreeks muteren. Hij moet het
verzoek vertalen naar een van Crestodian's getypte opdrachten; daarna gelden de normale goedkeurings-
en auditregels. Crestodian drukt het gebruikte model en de geïnterpreteerde
opdracht af voordat het iets uitvoert. Configuratieloze fallback-plannerbeurten zijn
tijdelijk, tool-uitgeschakeld waar de runtime dat ondersteunt, en gebruiken een tijdelijke
werkruimte/sessie.

Reddingsmodus voor berichtkanalen gebruikt de modelondersteunde planner niet. Redding op afstand
blijft deterministisch zodat een kapot of gecompromitteerd normaal agentpad niet
als configuratie-editor kan worden gebruikt.

## Overschakelen naar een agent

Gebruik een selector in natuurlijke taal om Crestodian te verlaten en de normale TUI te openen:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` en `openclaw terminal` openen nog steeds rechtstreeks de normale
agent-TUI. Ze starten Crestodian niet.

Nadat je bent overgeschakeld naar de normale TUI, gebruik je `/crestodian` om terug te keren naar Crestodian.
Je kunt een vervolgverzoek opnemen:

```text
/crestodian
/crestodian restart gateway
```

Agentwissels binnen de TUI laten een aanwijzing achter dat `/crestodian` beschikbaar is.

## Reddingsmodus voor berichten

Reddingsmodus voor berichten is het berichtkanaal-entrypoint voor Crestodian. Het is bedoeld voor
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

Agentaanmaak kan ook vanuit de lokale prompt of reddingsmodus in de wachtrij worden gezet:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Reddingsmodus op afstand is een beheerdersoppervlak. Het moet worden behandeld als
configuratiereparatie op afstand, niet als normale chat.

Beveiligingscontract voor redding op afstand:

- Uitgeschakeld wanneer sandboxing actief is. Als een agent/sessie in een sandbox draait,
  moet Crestodian redding op afstand weigeren en uitleggen dat lokale CLI-reparatie
  vereist is.
- Standaard effectieve status is `auto`: sta redding op afstand alleen toe in vertrouwde YOLO-
  uitvoering, waar de runtime al niet-gesandboxte lokale autoriteit heeft.
- Vereis een expliciete eigenaaridentiteit. Redding mag geen wildcard-afzenderregels,
  open groepsbeleid, niet-geverifieerde webhooks of anonieme kanalen accepteren.
- Standaard alleen eigenaar-DM's. Redding in groepen/kanalen vereist expliciete opt-in.
- Plugin zoeken en tonen zijn alleen-lezen. Plugin-installatie is standaard alleen lokaal
  omdat het uitvoerbare code downloadt. Plugin-verwijdering kan worden toegestaan als een
  goedgekeurde reparatiebewerking wanneer reddingsbeleid persistente schrijfacties toestaat.
- Redding op afstand kan de lokale TUI niet openen of overschakelen naar een interactieve agent-
  sessie. Gebruik lokale `openclaw` voor agentoverdracht.
- Persistente schrijfacties vereisen nog steeds goedkeuring, ook in reddingsmodus.
- Audit elke toegepaste reddingsbewerking. Redding via berichtkanalen legt kanaal-,
  account-, afzender- en bronadresmetadata vast. Configuratiemuterende bewerkingen leggen ook
  configuratiehashes voor en na vast.
- Echo nooit geheimen. SecretRef-inspectie moet beschikbaarheid rapporteren, geen
  waarden.
- Als de Gateway actief is, geef dan de voorkeur aan getypte Gateway-bewerkingen. Als de Gateway
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

- `"auto"`: standaard. Alleen toestaan wanneer de effectieve runtime YOLO is en
  sandboxing uit staat.
- `false`: redding via berichtkanalen nooit toestaan.
- `true`: redding expliciet toestaan wanneer de eigenaar-/kanaalcontroles slagen. Dit
  mag nog steeds de sandboxingweigering niet omzeilen.

De standaard `"auto"` YOLO-houding is:

- sandboxmodus wordt opgelost naar `off`
- `tools.exec.security` wordt opgelost naar `full`
- `tools.exec.ask` wordt opgelost naar `off`

Redding op afstand wordt gedekt door de Docker-lane:

```bash
pnpm test:docker:crestodian-rescue
```

Configuratieloze lokale planner-fallback wordt gedekt door:

```bash
pnpm test:docker:crestodian-planner
```

Een opt-in live kanaalrooktest voor het opdrachtoppervlak controleert `/crestodian status` plus een
persistente goedkeuringsroundtrip via de reddingshandler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Configuratieloze setup via expliciete Crestodian-opdrachten wordt gedekt door:

```bash
pnpm test:docker:crestodian-first-run
```

Die lane start met een lege statusmap, verifieert het moderne onboard-Crestodian-
entrypoint, stelt het standaardmodel in, maakt een extra agent, configureert
Discord via Plugin-inschakeling plus token-SecretRef, valideert configuratie en
controleert het auditlog. QA Lab heeft ook een repo-ondersteund scenario voor dezelfde Ring 0-
flow:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/cli/doctor)
- [TUI](/nl/cli/tui)
- [Sandbox](/nl/cli/sandbox)
- [Beveiliging](/nl/cli/security)
