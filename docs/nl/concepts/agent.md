---
read_when:
    - Agentruntime, werkruimte-bootstrap of sessiegedrag wijzigen
summary: Agentruntime, workspacecontract en sessiebootstrap
title: Agentruntime
x-i18n:
    generated_at: "2026-06-27T17:25:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw voert een **single embedded agent-runtime** uit - één agentproces per
Gateway, met een eigen werkruimte, bootstrapbestanden en sessieopslag. Deze pagina
beschrijft dat runtimecontract: wat de werkruimte moet bevatten, welke bestanden
worden geïnjecteerd en hoe sessies daartegen bootstrappen.

## Werkruimte (vereist)

OpenClaw gebruikt één agentwerkruimtemap (`agents.defaults.workspace`) als de **enige** werkmap (`cwd`) van de agent voor tools en context.

Aanbevolen: gebruik `openclaw setup` om `~/.openclaw/openclaw.json` aan te maken als die ontbreekt en de werkruimtebestanden te initialiseren.

Volledige werkruimte-indeling + back-upgids: [Agentwerkruimte](/nl/concepts/agent-workspace)

Als `agents.defaults.sandbox` is ingeschakeld, kunnen niet-hoofdsessies dit overschrijven met
werkruimten per sessie onder `agents.defaults.sandbox.workspaceRoot` (zie
[Gateway-configuratie](/nl/gateway/configuration)).

## Bootstrapbestanden (geïnjecteerd)

Binnen `agents.defaults.workspace` verwacht OpenClaw deze door de gebruiker bewerkbare bestanden:

- `AGENTS.md` - bedieningsinstructies + "geheugen"
- `SOUL.md` - persona, grenzen, toon
- `TOOLS.md` - door de gebruiker onderhouden toolnotities (bijv. `imsg`, `sag`, conventies)
- `BOOTSTRAP.md` - eenmalig ritueel voor de eerste uitvoering (verwijderd na voltooiing)
- `IDENTITY.md` - agentnaam/uitstraling/emoji
- `USER.md` - gebruikersprofiel + voorkeursaanspreekvorm

Bij de eerste beurt van een nieuwe sessie injecteert OpenClaw de inhoud van deze bestanden in de Projectcontext van de systeemprompt.

Lege bestanden worden overgeslagen. Grote bestanden worden ingekort en afgekapt met een markering zodat prompts compact blijven (lees het bestand voor de volledige inhoud).

Als een bestand ontbreekt, injecteert OpenClaw één markeringsregel voor een "ontbrekend bestand" (en `openclaw setup` maakt een veilige standaardsjabloon aan).

`BOOTSTRAP.md` wordt alleen aangemaakt voor een **gloednieuwe werkruimte** (geen andere bootstrapbestanden aanwezig). Zolang het in behandeling is, houdt OpenClaw het in Projectcontext en voegt het bootstrapbegeleiding in de systeemprompt toe voor het initiële ritueel in plaats van het naar het gebruikersbericht te kopiëren. Als je het verwijdert nadat je het ritueel hebt voltooid, hoort het bij latere herstarts niet opnieuw te worden aangemaakt.

Nadat een werkruimte is waargenomen, bewaart OpenClaw ook een attestatiemarkering in de statusmap voor het werkruimtepad. Als een recent geattesteerde werkruimte verdwijnt of wordt gewist, weigert de opstart stilzwijgend `BOOTSTRAP.md` opnieuw te seeden; herstel de werkruimte of gebruik een volledige onboard-reset zodat de werkruimte en markering samen worden gewist.

Om het aanmaken van bootstrapbestanden volledig uit te schakelen (voor vooraf geseede werkruimten), stel je het volgende in:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ingebouwde tools

Kerntools (read/exec/edit/write en gerelateerde systeemtools) zijn altijd beschikbaar,
afhankelijk van het toolbeleid. `apply_patch` is optioneel en wordt afgeschermd door
`tools.exec.applyPatch`. `TOOLS.md` bepaalt **niet** welke tools bestaan; het is
begeleiding voor hoe _jij_ wilt dat ze worden gebruikt.

## Skills

OpenClaw laadt Skills vanaf deze locaties (hoogste prioriteit eerst):

- Werkruimte: `<workspace>/skills`
- Projectagentskills: `<workspace>/.agents/skills`
- Persoonlijke agentskills: `~/.agents/skills`
- Beheerd/lokaal: `~/.openclaw/skills`
- Meegeleverd (meegeleverd met de installatie)
- Extra Skills-mappen: `skills.load.extraDirs`

Skillroots kunnen gegroepeerde mappen bevatten, zoals
`<workspace>/skills/personal/foo/SKILL.md`; de Skill wordt nog steeds beschikbaar gemaakt via de
platte frontmatternaam, bijvoorbeeld `foo`.

Skills kunnen worden afgeschermd via configuratie/env (zie `skills` in [Gateway-configuratie](/nl/gateway/configuration)).

## Runtimegrenzen

De embedded agent-runtime is eigendom van OpenClaw: modeldetectie, toolbedrading,
promptassemblage, sessiebeheer en kanaallevering delen één geïntegreerd
runtime-oppervlak.

## Sessies

Sessietranscripten worden als JSONL opgeslagen op:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

De sessie-ID is stabiel en wordt gekozen door OpenClaw.
Verouderde sessiemappen van andere tools worden niet gelezen.

## Sturen tijdens het streamen

Binnenkomende prompts die halverwege een uitvoering aankomen, worden standaard naar de huidige uitvoering gestuurd.
Sturing wordt geleverd **nadat de huidige assistentbeurt klaar is met het uitvoeren van zijn
toolaanroepen**, vóór de volgende LLM-aanroep, en slaat niet langer resterende toolaanroepen
uit het huidige assistentbericht over.

`/queue steer` is het standaardgedrag voor actieve uitvoeringen. `/queue followup` en
`/queue collect` laten berichten wachten op een latere beurt in plaats van te sturen.
`/queue interrupt` breekt in plaats daarvan de actieve uitvoering af. Zie [Wachtrij](/nl/concepts/queue)
en [Sturingswachtrij](/nl/concepts/queue-steering) voor wachtrij- en grensgedrag.

Blokstreaming verstuurt voltooide assistentblokken zodra ze klaar zijn; het staat
**standaard uit** (`agents.defaults.blockStreamingDefault: "off"`).
Stem de grens af via `agents.defaults.blockStreamingBreak` (`text_end` versus `message_end`; standaard is text_end).
Beheer zachte blokchunking met `agents.defaults.blockStreamingChunk` (standaard
800-1200 tekens; geeft de voorkeur aan alinea-einden, daarna nieuwe regels; zinnen als laatste).
Voeg gestreamde chunks samen met `agents.defaults.blockStreamingCoalesce` om
spam met losse regels te verminderen (op idle gebaseerde samenvoeging vóór verzending). Niet-Telegram-kanalen vereisen
expliciet `*.blockStreaming: true` om blokantwoorden in te schakelen.
Uitgebreide toolsamenvattingen worden uitgezonden bij de start van de tool (geen debounce); Control UI
streamt tooluitvoer via agentevents wanneer beschikbaar.
Meer details: [Streamen + chunking](/nl/concepts/streaming).

## Modelverwijzingen

Modelverwijzingen in configuratie (bijvoorbeeld `agents.defaults.model` en `agents.defaults.models`) worden geparsed door te splitsen op de **eerste** `/`.

- Gebruik `provider/model` bij het configureren van modellen.
- Als de model-ID zelf `/` bevat (OpenRouter-stijl), neem dan het providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke
  match met geconfigureerde provider voor die exacte model-id, en valt pas daarna terug
  op de geconfigureerde standaardprovider. Als die provider het
  geconfigureerde standaardmodel niet langer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde
  provider/model in plaats van een verouderde standaard van een verwijderde provider te tonen.

## Configuratie (minimaal)

Stel minimaal het volgende in:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sterk aanbevolen)

---

_Volgende: [Groepschats](/nl/channels/group-messages)_ 🦞

## Gerelateerd

- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Multi-agentroutering](/nl/concepts/multi-agent)
- [Sessiebeheer](/nl/concepts/session)
