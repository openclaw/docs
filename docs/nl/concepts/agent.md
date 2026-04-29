---
read_when:
    - De agent-runtime, werkruimte-bootstrap of het sessiegedrag wijzigen
summary: Agentruntime, werkruimtecontract en sessie-initialisatie
title: Agentruntime
x-i18n:
    generated_at: "2026-04-29T22:36:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw voert een **enkele ingebedde agentruntime** uit: één agentproces per
Gateway, met een eigen werkruimte, opstartbestanden en sessieopslag. Deze pagina
behandelt dat runtimecontract: wat de werkruimte moet bevatten, welke bestanden
worden geïnjecteerd en hoe sessies hiermee opstarten.

## Werkruimte (vereist)

OpenClaw gebruikt één agentwerkruimtemap (`agents.defaults.workspace`) als de **enige** werkmap (`cwd`) van de agent voor tools en context.

Aanbevolen: gebruik `openclaw setup` om `~/.openclaw/openclaw.json` te maken als die ontbreekt en de werkruimtebestanden te initialiseren.

Volledige werkruimte-indeling + back-upgids: [Agentwerkruimte](/nl/concepts/agent-workspace)

Als `agents.defaults.sandbox` is ingeschakeld, kunnen niet-hoofdsessies dit overschrijven met
sessiegebonden werkruimten onder `agents.defaults.sandbox.workspaceRoot` (zie
[Gateway-configuratie](/nl/gateway/configuration)).

## Opstartbestanden (geïnjecteerd)

Binnen `agents.defaults.workspace` verwacht OpenClaw deze door de gebruiker bewerkbare bestanden:

- `AGENTS.md` — bedieningsinstructies + “geheugen”
- `SOUL.md` — persona, grenzen, toon
- `TOOLS.md` — door de gebruiker onderhouden toolnotities (bijv. `imsg`, `sag`, conventies)
- `BOOTSTRAP.md` — eenmalig ritueel voor de eerste uitvoering (verwijderd na voltooiing)
- `IDENTITY.md` — agentnaam/vibe/emoji
- `USER.md` — gebruikersprofiel + gewenste aanspreekvorm

Bij de eerste beurt van een nieuwe sessie injecteert OpenClaw de inhoud van deze bestanden rechtstreeks in de agentcontext.

Lege bestanden worden overgeslagen. Grote bestanden worden ingekort en afgekapt met een markering, zodat prompts compact blijven (lees het bestand voor de volledige inhoud).

Als een bestand ontbreekt, injecteert OpenClaw één markeringsregel voor “ontbrekend bestand” (en `openclaw setup` maakt een veilige standaardsjabloon).

`BOOTSTRAP.md` wordt alleen gemaakt voor een **gloednieuwe werkruimte** (zonder andere opstartbestanden). Als je het verwijdert na het voltooien van het ritueel, mag het bij latere herstarts niet opnieuw worden gemaakt.

Om het maken van opstartbestanden volledig uit te schakelen (voor vooraf gevulde werkruimten), stel je in:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ingebouwde tools

Kerntools (lezen/uitvoeren/bewerken/schrijven en gerelateerde systeemtools) zijn altijd beschikbaar,
afhankelijk van het toolbeleid. `apply_patch` is optioneel en wordt afgeschermd door
`tools.exec.applyPatch`. `TOOLS.md` bepaalt **niet** welke tools bestaan; het is
richtlijn voor hoe _jij_ wilt dat ze worden gebruikt.

## Skills

OpenClaw laadt Skills vanaf deze locaties (hoogste prioriteit eerst):

- Werkruimte: `<workspace>/skills`
- Projectagentskills: `<workspace>/.agents/skills`
- Persoonlijke agentskills: `~/.agents/skills`
- Beheerd/lokaal: `~/.openclaw/skills`
- Gebundeld (meegeleverd met de installatie)
- Extra Skill-mappen: `skills.load.extraDirs`

Skills kunnen worden afgeschermd via configuratie/omgeving (zie `skills` in [Gateway-configuratie](/nl/gateway/configuration)).

## Runtimegrenzen

De ingebedde agentruntime is gebouwd op de Pi-agentkern (modellen, tools en
promptpipeline). Sessiebeheer, ontdekking, toolbedrading en kanaalaflevering
zijn lagen die OpenClaw boven op die kern beheert.

## Sessies

Sessietranscripten worden als JSONL opgeslagen op:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

De sessie-ID is stabiel en wordt door OpenClaw gekozen.
Verouderde sessiemappen van andere tools worden niet gelezen.

## Sturen tijdens streamen

Wanneer de wachtrijmodus `steer` is, worden inkomende berichten in de huidige uitvoering geïnjecteerd.
Sturing in de wachtrij wordt afgeleverd **nadat de huidige assistentbeurt klaar is met
het uitvoeren van de toolaanroepen**, vóór de volgende LLM-aanroep. Sturing slaat niet langer
resterende toolaanroepen van het huidige assistentbericht over; in plaats daarvan injecteert het het bericht in de wachtrij
bij de volgende modelgrens.

Wanneer de wachtrijmodus `followup` of `collect` is, worden inkomende berichten vastgehouden totdat de
huidige beurt eindigt, waarna een nieuwe agentbeurt start met de payloads in de wachtrij. Zie
[Wachtrij](/nl/concepts/queue) voor modus- en debounce-/limietgedrag.

Blokstreaming verzendt voltooide assistentblokken zodra ze klaar zijn; dit staat
**standaard uit** (`agents.defaults.blockStreamingDefault: "off"`).
Stem de grens af via `agents.defaults.blockStreamingBreak` (`text_end` versus `message_end`; standaard ingesteld op text_end).
Beheer zachte blokopdeling met `agents.defaults.blockStreamingChunk` (standaard
800–1200 tekens; geeft de voorkeur aan alineaeinden, daarna nieuwe regels; zinnen als laatste).
Voeg gestreamde fragmenten samen met `agents.defaults.blockStreamingCoalesce` om
spam van losse regels te verminderen (op inactiviteit gebaseerde samenvoeging vóór verzending). Niet-Telegram-kanalen vereisen
expliciet `*.blockStreaming: true` om blokantwoorden in te schakelen.
Uitgebreide toolsamenvattingen worden bij de start van de tool uitgezonden (geen debounce); de Control UI
streamt tooluitvoer via agentevents wanneer beschikbaar.
Meer details: [Streamen + fragmenteren](/nl/concepts/streaming).

## Modelverwijzingen

Modelverwijzingen in configuratie (bijvoorbeeld `agents.defaults.model` en `agents.defaults.models`) worden geparset door te splitsen op de **eerste** `/`.

- Gebruik `provider/model` bij het configureren van modellen.
- Als de model-ID zelf `/` bevat (OpenRouter-stijl), neem dan de providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke
  overeenkomst met een geconfigureerde provider voor die exacte model-ID, en valt pas daarna terug
  op de geconfigureerde standaardprovider. Als die provider het
  geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde
  provider/model-combinatie in plaats van een verouderde standaard van een verwijderde provider te tonen.

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
