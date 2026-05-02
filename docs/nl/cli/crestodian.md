---
read_when:
    - Je voert openclaw uit zonder commando en wilt Crestodian begrijpen
    - Je hebt een manier nodig om OpenClaw veilig zonder configuratie te inspecteren of te repareren
    - Je ontwerpt de reddingsmodus voor berichtkanalen of schakelt deze in
summary: CLI-referentie en beveiligingsmodel voor Crestodian, de configuratievrije, veilige installatie- en reparatiehulp
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T11:11:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian is OpenClaws lokale helper voor installatie, reparatie en configuratie. Het is
ontworpen om bereikbaar te blijven wanneer het normale agentpad defect is.

Als je `openclaw` zonder opdracht uitvoert, start Crestodian in een interactieve terminal.
Als je `openclaw crestodian` uitvoert, start dezelfde helper expliciet.

## Wat Crestodian toont

Bij het opstarten opent interactieve Crestodian dezelfde TUI-shell die wordt gebruikt door
`openclaw tui`, met een Crestodian-chatbackend. Het chatlog begint met een korte
begroeting:

- wanneer je Crestodian moet starten
- het model of deterministische plannerpad dat Crestodian daadwerkelijk gebruikt
- configuratiegeldigheid en de standaardagent
- Gateway-bereikbaarheid vanaf de eerste opstartprobe
- de volgende debugactie die Crestodian kan uitvoeren

Het dumpt geen geheimen en laadt geen CLI-opdrachten van plugins alleen om te starten. De TUI
biedt nog steeds de normale header, het chatlog, de statusregel, footer, autocomplete
en editorbediening.

Gebruik `status` voor de gedetailleerde inventaris met configuratiepad, docs-/bronpaden,
lokale CLI-probes, aanwezigheid van API-sleutels, agents, model en Gateway-details.

Crestodian gebruikt dezelfde OpenClaw-referentiedetectie als reguliere agents. In een Git-checkout
wijst het zichzelf naar lokale `docs/` en de lokale source tree. In een npm-package-installatie gebruikt het
de meegeleverde packagedocs en linkt het naar
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), met expliciete
richtlijnen om de bron te bekijken wanneer de docs niet genoeg zijn.

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
- registratie van Plugin-opdrachten niet beschikbaar is
- er nog geen agent is geconfigureerd

`openclaw --help` en `openclaw --version` gebruiken nog steeds de normale snelle paden.
Niet-interactieve `openclaw` sluit af met een kort bericht in plaats van roothelp af te drukken,
omdat het product zonder opdracht Crestodian is.

## Bewerkingen en goedkeuring

Crestodian gebruikt getypeerde bewerkingen in plaats van configuratie ad hoc te bewerken.

Alleen-lezen bewerkingen kunnen direct worden uitgevoerd:

- overzicht tonen
- agents weergeven
- geïnstalleerde plugins weergeven
- ClawHub-plugins zoeken
- model-/backendstatus tonen
- status- of healthchecks uitvoeren
- Gateway-bereikbaarheid controleren
- doctor uitvoeren zonder interactieve reparaties
- configuratie valideren
- het pad van het auditlog tonen

Persistente bewerkingen vereisen conversationele goedkeuring in interactieve modus, tenzij
je `--yes` doorgeeft voor een directe opdracht:

- configuratie schrijven
- `config set` uitvoeren
- ondersteunde SecretRef-waarden instellen via `config set-ref`
- setup-/onboardingbootstrap uitvoeren
- het standaardmodel wijzigen
- de Gateway starten, stoppen of herstarten
- agents aanmaken
- plugins installeren vanuit ClawHub of npm
- plugins verwijderen
- doctor-reparaties uitvoeren die configuratie of status herschrijven

Toegepaste schrijfacties worden vastgelegd in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Detectie wordt niet geaudit. Alleen toegepaste bewerkingen en schrijfacties worden gelogd.

`openclaw onboard --modern` start Crestodian als de moderne onboardingpreview.
Gewone `openclaw onboard` voert nog steeds klassieke onboarding uit.

## Setup-bootstrap

`setup` is de chat-first onboardingbootstrap. Het schrijft alleen via getypeerde
configuratiebewerkingen en vraagt eerst om goedkeuring.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Wanneer er geen model is geconfigureerd, selecteert setup de eerste bruikbare backend in deze
volgorde en vertelt het je wat is gekozen:

- bestaand expliciet model, als dat al is geconfigureerd
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Als er geen beschikbaar zijn, schrijft setup nog steeds de standaardwerkruimte en laat het
model oningesteld. Installeer of log in bij Codex/Claude Code, of stel
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` beschikbaar, en voer setup daarna opnieuw uit.

## Modelondersteunde planner

Crestodian start altijd in deterministische modus. Voor vage opdrachten die de
deterministische parser niet begrijpt, kan lokale Crestodian één begrensde
plannerbeurt uitvoeren via OpenClaws normale runtimepaden. Het gebruikt eerst het
geconfigureerde OpenClaw-model. Als er nog geen geconfigureerd model bruikbaar is, kan het
terugvallen op lokale runtimes die al op de machine aanwezig zijn:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` met `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

De modelondersteunde planner kan configuratie niet direct muteren. Het moet de
aanvraag vertalen naar een van Crestodians getypeerde opdrachten, waarna de normale goedkeurings-
en auditregels gelden. Crestodian drukt het gebruikte model en de geïnterpreteerde
opdracht af voordat het iets uitvoert. Configuratieloze fallback-plannerbeurten zijn
tijdelijk, tool-uitgeschakeld waar de runtime dat ondersteunt, en gebruiken een tijdelijke
werkruimte/sessie.

Reddingsmodus via berichtkanalen gebruikt de modelondersteunde planner niet. Externe
redding blijft deterministisch, zodat een defect of gecompromitteerd normaal agentpad niet
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

Nadat je bent overgeschakeld naar de normale TUI, gebruik je `/crestodian` om terug te keren naar Crestodian.
Je kunt een vervolgverzoek opnemen:

```text
/crestodian
/crestodian restart gateway
```

Agentwissels binnen de TUI laten een breadcrumb achter dat `/crestodian` beschikbaar is.

## Reddingsmodus via berichten

Reddingsmodus via berichten is het berichtkanaal-entrypoint voor Crestodian. Het is bedoeld voor
de situatie waarin je normale agent dood is, maar een vertrouwd kanaal zoals WhatsApp
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

Het aanmaken van agents kan ook worden ingepland vanuit de lokale prompt of reddingsmodus:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Externe reddingsmodus is een beheeroppervlak. Het moet worden behandeld als externe
configuratiereparatie, niet als normale chat.

Beveiligingscontract voor externe redding:

- Uitgeschakeld wanneer sandboxing actief is. Als een agent/sessie gesandboxed is,
  moet Crestodian externe redding weigeren en uitleggen dat lokale CLI-reparatie
  vereist is.
- De standaard effectieve status is `auto`: sta externe redding alleen toe in vertrouwde YOLO-
  werking, waarbij de runtime al ongesandboxde lokale bevoegdheid heeft.
- Vereis een expliciete eigenaaridentiteit. Redding mag geen wildcard-afzenderregels,
  open groepsbeleid, niet-geverifieerde webhooks of anonieme kanalen accepteren.
- Standaard alleen eigenaar-DM's. Groeps-/kanaalredding vereist expliciete opt-in.
- Plugin-zoekopdrachten en -lijsten zijn alleen-lezen. Plugin-installatie is standaard alleen lokaal
  omdat het uitvoerbare code downloadt. Plugin-verwijdering kan worden toegestaan als een
  goedgekeurde reparatiebewerking wanneer het reddingsbeleid persistente schrijfacties toestaat.
- Externe redding kan de lokale TUI niet openen of overschakelen naar een interactieve agent-
  sessie. Gebruik lokale `openclaw` voor agenthandoff.
- Persistente schrijfacties vereisen nog steeds goedkeuring, zelfs in reddingsmodus.
- Audit elke toegepaste reddingsbewerking. Redding via berichtkanalen registreert kanaal,
  account, afzender en bronadresmetadata. Configuratiemuterende bewerkingen registreren ook
  configuratiehashes voor en na.
- Echo nooit geheimen. SecretRef-inspectie moet beschikbaarheid rapporteren, geen
  waarden.
- Als de Gateway actief is, geef dan de voorkeur aan getypeerde Gateway-bewerkingen. Als de Gateway
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
- `false`: sta redding via berichtkanalen nooit toe.
- `true`: sta redding expliciet toe wanneer de eigenaar-/kanaalcontroles slagen. Dit
  mag de sandboxingweigering nog steeds niet omzeilen.

De standaard `"auto"` YOLO-houding is:

- sandboxmodus wordt herleid tot `off`
- `tools.exec.security` wordt herleid tot `full`
- `tools.exec.ask` wordt herleid tot `off`

Externe redding wordt gedekt door de Docker-lane:

```bash
pnpm test:docker:crestodian-rescue
```

Configuratieloze lokale plannerfallback wordt gedekt door:

```bash
pnpm test:docker:crestodian-planner
```

Een opt-in live smoke voor het kanaalopdrachtoppervlak controleert `/crestodian status` plus een
persistente goedkeuringsroundtrip via de rescue-handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Nieuwe configuratieloze setup via Crestodian wordt gedekt door:

```bash
pnpm test:docker:crestodian-first-run
```

Die lane begint met een lege statusdir, routeert kale `openclaw` naar Crestodian,
stelt het standaardmodel in, maakt een extra agent aan, configureert Discord via
een Plugin-activering plus token-SecretRef, valideert configuratie en controleert het audit-
log. QA Lab heeft ook een repo-backed scenario voor dezelfde Ring 0-flow:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/cli/doctor)
- [TUI](/nl/cli/tui)
- [Sandbox](/nl/cli/sandbox)
- [Beveiliging](/nl/cli/security)
