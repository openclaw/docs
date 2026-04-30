---
read_when:
    - Agent-runtime, workspace-bootstrap of sessiegedrag wijzigen
summary: Agent-runtime, werkruimtecontract en sessie-bootstrap
title: Agentruntime
x-i18n:
    generated_at: "2026-04-30T09:34:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw draait een **enkele ingebedde agent-runtime** — één agentproces per
Gateway, met een eigen werkruimte, bootstrapbestanden en sessieopslag. Deze pagina
behandelt dat runtimecontract: wat de werkruimte moet bevatten, welke bestanden
worden geïnjecteerd en hoe sessies daarmee bootstrappen.

## Werkruimte (vereist)

OpenClaw gebruikt één agent-werkruimtemap (`agents.defaults.workspace`) als de **enige** werkmap (`cwd`) van de agent voor hulpmiddelen en context.

Aanbevolen: gebruik `openclaw setup` om `~/.openclaw/openclaw.json` te maken als het ontbreekt en de werkruimtebestanden te initialiseren.

Volledige werkruimte-indeling + back-upgids: [Agent-werkruimte](/nl/concepts/agent-workspace)

Als `agents.defaults.sandbox` is ingeschakeld, kunnen niet-hoofdsessies dit overschrijven met
werkruimten per sessie onder `agents.defaults.sandbox.workspaceRoot` (zie
[Gateway-configuratie](/nl/gateway/configuration)).

## Bootstrapbestanden (geïnjecteerd)

Binnen `agents.defaults.workspace` verwacht OpenClaw deze door de gebruiker bewerkbare bestanden:

- `AGENTS.md` — werkinstructies + “geheugen”
- `SOUL.md` — persona, grenzen, toon
- `TOOLS.md` — door de gebruiker onderhouden toolnotities (bijv. `imsg`, `sag`, conventies)
- `BOOTSTRAP.md` — eenmalig eerste-uitvoeringsritueel (verwijderd na voltooiing)
- `IDENTITY.md` — agentnaam/vibe/emoji
- `USER.md` — gebruikersprofiel + gewenste aanspreekvorm

Bij de eerste beurt van een nieuwe sessie injecteert OpenClaw de inhoud van deze bestanden rechtstreeks in de agentcontext.

Lege bestanden worden overgeslagen. Grote bestanden worden ingekort en afgekapt met een markering zodat prompts compact blijven (lees het bestand voor de volledige inhoud).

Als een bestand ontbreekt, injecteert OpenClaw één markeringsregel voor “ontbrekend bestand” (en `openclaw setup` maakt een veilige standaardsjabloon).

`BOOTSTRAP.md` wordt alleen gemaakt voor een **gloednieuwe werkruimte** (geen andere bootstrapbestanden aanwezig). Als je het verwijdert nadat het ritueel is voltooid, hoort het bij latere herstarts niet opnieuw te worden gemaakt.

Stel dit in om het maken van bootstrapbestanden volledig uit te schakelen (voor vooraf gevulde werkruimten):

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ingebouwde hulpmiddelen

Kernhulpmiddelen (read/exec/edit/write en gerelateerde systeemhulpmiddelen) zijn altijd beschikbaar,
afhankelijk van het hulpmiddelbeleid. `apply_patch` is optioneel en wordt afgeschermd door
`tools.exec.applyPatch`. `TOOLS.md` bepaalt **niet** welke hulpmiddelen bestaan; het is
richtlijn voor hoe _jij_ ze gebruikt wilt hebben.

## Skills

OpenClaw laadt Skills vanaf deze locaties (hoogste prioriteit eerst):

- Werkruimte: `<workspace>/skills`
- Project-agent-Skills: `<workspace>/.agents/skills`
- Persoonlijke agent-Skills: `~/.agents/skills`
- Beheerd/lokaal: `~/.openclaw/skills`
- Gebundeld (meegeleverd met de installatie)
- Extra Skills-mappen: `skills.load.extraDirs`

Skills kunnen worden beperkt via configuratie/env (zie `skills` in [Gateway-configuratie](/nl/gateway/configuration)).

## Runtimegrenzen

De ingebedde agent-runtime is gebouwd op de Pi-agentkern (modellen, hulpmiddelen en
promptpipeline). Sessiebeheer, ontdekking, hulpmiddelbedrading en kanaalbezorging
zijn lagen van OpenClaw boven op die kern.

## Sessies

Sessietranscripten worden als JSONL opgeslagen op:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

De sessie-ID is stabiel en wordt door OpenClaw gekozen.
Verouderde sessiemappen van andere hulpmiddelen worden niet gelezen.

## Sturen tijdens streaming

Wanneer de wachtrijmodus `steer` is, worden inkomende berichten in de huidige uitvoering geïnjecteerd.
Sturing in de wachtrij wordt geleverd **nadat de huidige assistentbeurt klaar is
met het uitvoeren van zijn toolcalls**, vóór de volgende LLM-aanroep. Pi verwerkt alle
wachtende stuurberichten samen voor `steer`; verouderde `queue` verwerkt één bericht per
modelgrens. Sturing slaat resterende toolcalls uit het huidige
assistentbericht niet meer over.

Wanneer de wachtrijmodus `followup` of `collect` is, worden inkomende berichten vastgehouden totdat de
huidige beurt eindigt, waarna een nieuwe agentbeurt start met de payloads uit de wachtrij. Zie
[Wachtrij](/nl/concepts/queue) en [Stuurwachtrij](/nl/concepts/queue-steering) voor modus-
en grensgedrag.

Blokstreaming verzendt voltooide assistentblokken zodra ze klaar zijn; dit staat
**standaard uit** (`agents.defaults.blockStreamingDefault: "off"`).
Stem de grens af via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; standaard text_end).
Beheer zachte blokchunking met `agents.defaults.blockStreamingChunk` (standaard
800–1200 tekens; geeft de voorkeur aan alinea-afbrekingen, daarna nieuwe regels; zinnen als laatste).
Voeg gestreamde chunks samen met `agents.defaults.blockStreamingCoalesce` om
spam van losse regels te verminderen (samenvoegen op basis van inactiviteit vóór verzending). Niet-Telegram-kanalen vereisen
expliciet `*.blockStreaming: true` om blokantwoorden in te schakelen.
Uitgebreide tooloverzichten worden uitgezonden bij de start van een hulpmiddel (geen debounce); Control UI
streamt tooluitvoer via agentevents wanneer beschikbaar.
Meer details: [Streaming + chunking](/nl/concepts/streaming).

## Modelverwijzingen

Modelverwijzingen in configuratie (bijvoorbeeld `agents.defaults.model` en `agents.defaults.models`) worden geparsed door te splitsen op de **eerste** `/`.

- Gebruik `provider/model` bij het configureren van modellen.
- Als de model-ID zelf `/` bevat (OpenRouter-stijl), neem dan het providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke
  overeenkomst met een geconfigureerde provider voor die exacte model-ID, en valt pas daarna terug
  op de geconfigureerde standaardprovider. Als die provider het
  geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde
  provider/model in plaats van een verouderde standaard van een verwijderde provider te tonen.

## Configuratie (minimaal)

Stel minimaal het volgende in:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sterk aanbevolen)

---

_Volgende: [Groepschats](/nl/channels/group-messages)_ 🦞

## Gerelateerd

- [Agent-werkruimte](/nl/concepts/agent-workspace)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Sessiebeheer](/nl/concepts/session)
