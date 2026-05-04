---
read_when:
    - Agentruntime, werkruimte-bootstrap of sessiegedrag wijzigen
summary: Agentruntime, werkruimtecontract en sessie-initialisatie
title: Agent-runtime
x-i18n:
    generated_at: "2026-05-04T02:22:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw voert een **enkele ingebedde agent-runtime** uit: één agentproces per
Gateway, met een eigen werkruimte, bootstrapbestanden en sessieopslag. Deze pagina
behandelt dat runtimecontract: wat de werkruimte moet bevatten, welke bestanden
worden geïnjecteerd en hoe sessies ermee opstarten.

## Werkruimte (vereist)

OpenClaw gebruikt één agent-werkruimtemap (`agents.defaults.workspace`) als de **enige** werkmap (`cwd`) van de agent voor tools en context.

Aanbevolen: gebruik `openclaw setup` om `~/.openclaw/openclaw.json` aan te maken als die ontbreekt en de werkruimtebestanden te initialiseren.

Volledige werkruimte-indeling + back-upgids: [Agentwerkruimte](/nl/concepts/agent-workspace)

Als `agents.defaults.sandbox` is ingeschakeld, kunnen niet-hoofdsessies dit overschrijven met
werkruimten per sessie onder `agents.defaults.sandbox.workspaceRoot` (zie
[Gateway-configuratie](/nl/gateway/configuration)).

## Bootstrapbestanden (geïnjecteerd)

Binnen `agents.defaults.workspace` verwacht OpenClaw deze door de gebruiker bewerkbare bestanden:

- `AGENTS.md` — operationele instructies + “geheugen”
- `SOUL.md` — persona, grenzen, toon
- `TOOLS.md` — door de gebruiker onderhouden toolnotities (bijv. `imsg`, `sag`, conventies)
- `BOOTSTRAP.md` — eenmalig ritueel voor de eerste uitvoering (verwijderd na voltooiing)
- `IDENTITY.md` — agentnaam/sfeer/emoji
- `USER.md` — gebruikersprofiel + gewenste aanspreekvorm

Bij de eerste beurt van een nieuwe sessie injecteert OpenClaw de inhoud van deze bestanden in de Project Context van de systeemprompt.

Lege bestanden worden overgeslagen. Grote bestanden worden ingekort en afgekapt met een markering zodat prompts beknopt blijven (lees het bestand voor de volledige inhoud).

Als een bestand ontbreekt, injecteert OpenClaw één markeringsregel voor “ontbrekend bestand” (en `openclaw setup` maakt een veilige standaardsjabloon aan).

`BOOTSTRAP.md` wordt alleen aangemaakt voor een **gloednieuwe werkruimte** (waar geen andere bootstrapbestanden aanwezig zijn). Zolang het in behandeling is, houdt OpenClaw het in Project Context en voegt het bootstrapbegeleiding voor het initiële ritueel toe aan de systeemprompt, in plaats van het naar het gebruikersbericht te kopiëren. Als je het verwijdert nadat je het ritueel hebt voltooid, zou het bij latere herstarts niet opnieuw moeten worden aangemaakt.

Stel dit in om het aanmaken van bootstrapbestanden volledig uit te schakelen (voor vooraf gevulde werkruimten):

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ingebouwde tools

Kerntools (read/exec/edit/write en gerelateerde systeemtools) zijn altijd beschikbaar,
afhankelijk van het toolbeleid. `apply_patch` is optioneel en wordt beheerd door
`tools.exec.applyPatch`. `TOOLS.md` bepaalt **niet** welke tools bestaan; het is
begeleiding voor hoe _jij_ wilt dat ze worden gebruikt.

## Skills

OpenClaw laadt Skills vanaf deze locaties (hoogste prioriteit eerst):

- Werkruimte: `<workspace>/skills`
- Project-agent-Skills: `<workspace>/.agents/skills`
- Persoonlijke agent-Skills: `~/.agents/skills`
- Beheerd/lokaal: `~/.openclaw/skills`
- Meegeleverd (geleverd met de installatie)
- Extra Skills-mappen: `skills.load.extraDirs`

Skills kunnen worden begrensd door configuratie/env (zie `skills` in [Gateway-configuratie](/nl/gateway/configuration)).

## Runtimegrenzen

De ingebedde agent-runtime is gebouwd op de Pi-agentkern (modellen, tools en
promptpipeline). Sessiebeheer, detectie, toolkoppeling en kanaallevering
zijn OpenClaw-lagen boven op die kern.

## Sessies

Sessietranscripten worden als JSONL opgeslagen op:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

De sessie-ID is stabiel en wordt gekozen door OpenClaw.
Verouderde sessiemappen van andere tools worden niet gelezen.

## Sturen tijdens streamen

Wanneer de wachtrijmodus `steer` is, worden inkomende berichten geïnjecteerd in de huidige uitvoering.
Sturen in de wachtrij wordt geleverd **nadat de huidige assistentbeurt klaar is
met het uitvoeren van zijn toolaanroepen**, vóór de volgende LLM-aanroep. Pi verwerkt alle wachtende
stuurberichten samen voor `steer`; verouderde `queue` verwerkt één bericht per
modelgrens. Sturen slaat niet langer resterende toolaanroepen uit het huidige
assistentbericht over.

Wanneer de wachtrijmodus `followup` of `collect` is, worden inkomende berichten vastgehouden tot de
huidige beurt eindigt, waarna een nieuwe agentbeurt start met de payloads uit de wachtrij. Zie
[Wachtrij](/nl/concepts/queue) en [Stuurwachtrij](/nl/concepts/queue-steering) voor modus-
en grensgedrag.

Blokstreaming verstuurt voltooide assistentblokken zodra ze klaar zijn; het staat
**standaard uit** (`agents.defaults.blockStreamingDefault: "off"`).
Stem de grens af via `agents.defaults.blockStreamingBreak` (`text_end` versus `message_end`; standaard text_end).
Beheer zachte blokchunking met `agents.defaults.blockStreamingChunk` (standaard
800-1200 tekens; geeft de voorkeur aan alinea-einden, daarna nieuwe regels; zinnen als laatste).
Voeg gestreamde chunks samen met `agents.defaults.blockStreamingCoalesce` om
spam op losse regels te verminderen (samenvoegen op basis van inactiviteit vóór verzending). Niet-Telegram-kanalen vereisen
expliciet `*.blockStreaming: true` om blokantwoorden in te schakelen.
Uitgebreide toolsamenvattingen worden bij de start van de tool verzonden (geen debounce); Control UI
streamt tooluitvoer via agentevents wanneer beschikbaar.
Meer details: [Streamen + chunking](/nl/concepts/streaming).

## Modelrefs

Modelrefs in configuratie (bijvoorbeeld `agents.defaults.model` en `agents.defaults.models`) worden geparsed door te splitsen op de **eerste** `/`.

- Gebruik `provider/model` bij het configureren van modellen.
- Als de model-ID zelf `/` bevat (OpenRouter-stijl), neem dan het providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke
  geconfigureerde-provider-match voor die exacte model-ID, en pas daarna valt het terug
  op de geconfigureerde standaardprovider. Als die provider het
  geconfigureerde standaardmodel niet langer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde
  provider/het eerste geconfigureerde model in plaats van een verouderde standaard van een verwijderde provider te tonen.

## Configuratie (minimaal)

Stel minimaal in:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sterk aanbevolen)

---

_Volgende: [Groepschats](/nl/channels/group-messages)_ 🦞

## Gerelateerd

- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Sessiebeheer](/nl/concepts/session)
