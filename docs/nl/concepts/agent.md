---
read_when:
    - Agentruntime, initialisatie van de werkruimte of sessiegedrag wijzigen
summary: Agentruntime, werkruimtecontract en sessie-initialisatie
title: Uitvoeringsomgeving voor agents
x-i18n:
    generated_at: "2026-05-06T09:07:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw voert een **enkele ingesloten agentruntime** uit - één agentproces per
Gateway, met een eigen werkruimte, bootstrapbestanden en sessieopslag. Deze pagina
behandelt dat runtimecontract: wat de werkruimte moet bevatten, welke bestanden
worden geïnjecteerd en hoe sessies daartegen bootstrappen.

## Werkruimte (vereist)

OpenClaw gebruikt één agentwerkruimtemap (`agents.defaults.workspace`) als de **enige** werkmap (`cwd`) van de agent voor tools en context.

Aanbevolen: gebruik `openclaw setup` om `~/.openclaw/openclaw.json` aan te maken als die ontbreekt en de werkruimtebestanden te initialiseren.

Volledige werkruimte-indeling + back-uphandleiding: [Agentwerkruimte](/nl/concepts/agent-workspace)

Als `agents.defaults.sandbox` is ingeschakeld, kunnen niet-hoofdsessies dit overschrijven met
werkruimtes per sessie onder `agents.defaults.sandbox.workspaceRoot` (zie
[Gateway-configuratie](/nl/gateway/configuration)).

## Bootstrapbestanden (geïnjecteerd)

Binnen `agents.defaults.workspace` verwacht OpenClaw deze door de gebruiker bewerkbare bestanden:

- `AGENTS.md` - bedieningsinstructies + "geheugen"
- `SOUL.md` - persona, grenzen, toon
- `TOOLS.md` - door de gebruiker onderhouden toolnotities (bijv. `imsg`, `sag`, conventies)
- `BOOTSTRAP.md` - eenmalig ritueel bij eerste uitvoering (verwijderd na voltooiing)
- `IDENTITY.md` - agentnaam/sfeer/emoji
- `USER.md` - gebruikersprofiel + gewenste aanspreekvorm

Bij de eerste beurt van een nieuwe sessie injecteert OpenClaw de inhoud van deze bestanden in de Projectcontext van de systeemprompt.

Lege bestanden worden overgeslagen. Grote bestanden worden ingekort en afgekapt met een marker zodat prompts compact blijven (lees het bestand voor de volledige inhoud).

Als een bestand ontbreekt, injecteert OpenClaw één markerregel "ontbrekend bestand" (en `openclaw setup` maakt een veilige standaardsjabloon aan).

`BOOTSTRAP.md` wordt alleen aangemaakt voor een **gloednieuwe werkruimte** (geen andere bootstrapbestanden aanwezig). Zolang het in behandeling is, houdt OpenClaw het in de Projectcontext en voegt het bootstrapbegeleiding aan de systeemprompt toe voor het eerste ritueel, in plaats van het naar het gebruikersbericht te kopiëren. Als je het verwijdert nadat je het ritueel hebt voltooid, zou het bij latere herstarts niet opnieuw moeten worden aangemaakt.

Stel het volgende in om het aanmaken van bootstrapbestanden volledig uit te schakelen (voor vooraf gevulde werkruimtes):

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ingebouwde tools

Kerntools (read/exec/edit/write en gerelateerde systeemtools) zijn altijd beschikbaar,
afhankelijk van het toolbeleid. `apply_patch` is optioneel en wordt afgeschermd door
`tools.exec.applyPatch`. `TOOLS.md` bepaalt **niet** welke tools bestaan; het is
begeleiding voor hoe _jij_ wilt dat ze worden gebruikt.

## Skills

OpenClaw laadt Skills uit deze locaties (hoogste prioriteit eerst):

- Werkruimte: `<workspace>/skills`
- Projectagentskills: `<workspace>/.agents/skills`
- Persoonlijke agentskills: `~/.agents/skills`
- Beheerd/lokaal: `~/.openclaw/skills`
- Gebundeld (meegeleverd met de installatie)
- Extra skillmappen: `skills.load.extraDirs`

Skills kunnen worden afgeschermd via configuratie/env (zie `skills` in [Gateway-configuratie](/nl/gateway/configuration)).

## Runtimegrenzen

De ingesloten agentruntime is gebouwd op de Pi-agentkern (modellen, tools en
promptpipeline). Sessiebeheer, ontdekking, toolbedrading en kanaalaflevering
zijn lagen die OpenClaw bovenop die kern beheert.

## Sessies

Sessietranscripten worden opgeslagen als JSONL op:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

De sessie-ID is stabiel en wordt gekozen door OpenClaw.
Verouderde sessiemappen van andere tools worden niet gelezen.

## Sturen tijdens streaming

Wanneer de wachtrijmodus `steer` is, worden inkomende berichten in de huidige uitvoering geïnjecteerd.
Sturing in de wachtrij wordt geleverd **nadat de huidige assistentbeurt klaar is
met het uitvoeren van zijn toolaanroepen**, vóór de volgende LLM-aanroep. Pi verwerkt alle wachtende
sturingsberichten tegelijk voor `steer`; verouderde `queue` verwerkt één bericht per
modelgrens. Sturing slaat de resterende toolaanroepen uit het huidige
assistentbericht niet meer over.

Wanneer de wachtrijmodus `followup` of `collect` is, worden inkomende berichten vastgehouden totdat de
huidige beurt eindigt, waarna een nieuwe agentbeurt begint met de payloads uit de wachtrij. Zie
[Wachtrij](/nl/concepts/queue) en [Sturingswachtrij](/nl/concepts/queue-steering) voor modus-
en grensgedrag.

Blokstreaming verzendt voltooide assistentblokken zodra ze klaar zijn; dit staat
**standaard uit** (`agents.defaults.blockStreamingDefault: "off"`).
Stem de grens af via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; standaard is text_end).
Beheer zachte bloksegmentering met `agents.defaults.blockStreamingChunk` (standaard
800-1200 tekens; geeft de voorkeur aan alinea-einden, daarna nieuwe regels; zinnen als laatste).
Voeg gestreamde segmenten samen met `agents.defaults.blockStreamingCoalesce` om
spam op losse regels te verminderen (samenvoegen op basis van inactiviteit vóór verzending). Niet-Telegram-kanalen vereisen
expliciet `*.blockStreaming: true` om blokantwoorden in te schakelen.
Uitgebreide toolsamenvattingen worden bij de start van een tool uitgezonden (geen debounce); de Control UI
streamt tooluitvoer via agentevents wanneer beschikbaar.
Meer details: [Streaming + segmentering](/nl/concepts/streaming).

## Modelverwijzingen

Modelverwijzingen in configuratie (bijvoorbeeld `agents.defaults.model` en `agents.defaults.models`) worden geparseerd door te splitsen op de **eerste** `/`.

- Gebruik `provider/model` bij het configureren van modellen.
- Als de model-ID zelf `/` bevat (OpenRouter-stijl), neem dan het providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke
  overeenkomst met een geconfigureerde provider voor die exacte model-id, en valt pas daarna terug
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

- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Sessiebeheer](/nl/concepts/session)
