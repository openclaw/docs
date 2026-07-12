---
read_when:
    - Je wilt QMD instellen als backend voor je geheugen
    - Je wilt geavanceerde geheugenfuncties, zoals herrangschikking of extra geïndexeerde paden
summary: Local-first zoeksidecar met BM25, vectoren, herrangschikking en query-uitbreiding
title: QMD-geheugenengine
x-i18n:
    generated_at: "2026-07-12T08:49:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) is een local-first zoeksidecar die naast
OpenClaw draait. Het combineert BM25, vectorzoekopdrachten en herrangschikking
in één binair bestand en kan inhoud buiten de geheugenbestanden van je
werkruimte indexeren.

## Wat het toevoegt ten opzichte van de ingebouwde engine

- **Herrangschikking en query-uitbreiding** voor een betere vindbaarheid.
- **Extra mappen indexeren** - projectdocumentatie, teamnotities en alles wat op schijf staat.
- **Sessietranscripten indexeren** - eerdere gesprekken terugvinden.
- **Volledig lokaal** - werkt met de officiële llama.cpp-providerplugin en
  downloadt GGUF-modellen automatisch.
- **Automatische terugval** - als QMD niet beschikbaar is, valt OpenClaw
  naadloos terug op de ingebouwde engine.

## Aan de slag

### Vereisten

- Installeer QMD: `npm install -g @tobilu/qmd` of `bun install -g @tobilu/qmd`
- Een SQLite-build die extensies toestaat (`brew install sqlite` op macOS).
- QMD moet in het `PATH` van de Gateway staan.
- macOS en Linux werken direct. Windows wordt het best ondersteund via WSL2.

### Inschakelen

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw maakt een zelfstandige QMD-home aan onder
`~/.openclaw/agents/<agentId>/qmd/` en beheert de levenscyclus van de sidecar
automatisch: collecties, updates en embedding-runs worden voor je afgehandeld.
Het geeft de voorkeur aan de huidige QMD-collectie- en MCP-queryvormen, maar
valt indien nodig terug op alternatieve vlaggen voor collectiepatronen en
oudere namen van MCP-tools. De afstemming bij het opstarten maakt ook
verouderde beheerde collecties opnieuw aan met hun canonieke patronen wanneer
er nog een oudere QMD-collectie met dezelfde naam aanwezig is.

## Hoe de sidecar werkt

- OpenClaw maakt collecties aan op basis van de geheugenbestanden in je
  werkruimte en eventuele geconfigureerde `memory.qmd.paths` en voert
  vervolgens `qmd update` uit wanneer de QMD-manager wordt geopend en daarna
  periodiek (`memory.qmd.update.interval`, standaard `5m`). Vernieuwingen
  worden uitgevoerd via QMD-subprocessen, niet via een bestandssysteemscan
  binnen het proces. Semantische zoekmodi voeren ook `qmd embed` uit
  (`memory.qmd.update.embedInterval`, standaard `60m`).
- De standaardwerkruimtecollectie volgt `MEMORY.md` plus de
  `memory/`-structuur. `memory.md` in kleine letters wordt niet als
  hoofdgeheugenbestand geïndexeerd.
- De eigen scanner van QMD negeert verborgen paden en gebruikelijke
  afhankelijkheids- en buildmappen, zoals `.git`, `.cache`, `node_modules`,
  `vendor`, `dist` en `build`. Bij het opstarten initialiseert de Gateway QMD
  standaard niet (`memory.qmd.update.startup` staat standaard op `off`), zodat
  bij een koude start de geheugenruntime niet wordt geïmporteerd en de
  langdurige watcher niet wordt aangemaakt voordat het geheugen voor het eerst
  wordt gebruikt.
- Stel `memory.qmd.update.startup` in op `idle` of `immediate` om QMD toch bij
  het starten van de Gateway te initialiseren. `memory.qmd.update.onBoot` staat
  standaard op `true` en voert de eerste vernieuwing bij het opstarten uit;
  stel dit in op `false` om die onmiddellijke vernieuwing over te slaan (de
  langdurige manager wordt nog steeds geopend wanneer update- of
  embeddingintervallen zijn geconfigureerd, zodat QMD de reguliere
  watcher/timers blijft beheren).
- Zoekopdrachten gebruiken de geconfigureerde `searchMode` (standaard:
  `search`; ondersteunt ook `vsearch` en `query`). `search` gebruikt alleen
  BM25, zodat OpenClaw in die modus controles op de gereedheid van semantische
  vectoren en het onderhoud van embeddings overslaat. Als een modus mislukt,
  probeert OpenClaw het opnieuw met `qmd query`.
- Wanneer `searchMode` is ingesteld op `query`, stel je `memory.qmd.rerank` in
  op `false` om het hybride querypad van QMD zonder herrangschikker te
  gebruiken (vereist QMD 2.1 of nieuwer). OpenClaw geeft `--no-rerank` door
  aan het directe QMD-CLI-pad en `rerank: false` aan de MCP-querytool van QMD.
- Met QMD-releases die filters voor meerdere collecties aanbieden, groepeert
  OpenClaw collecties met dezelfde bron in één QMD-zoekaanroep. Oudere
  QMD-releases behouden de compatibele terugval per collectie.
- Als QMD volledig uitvalt, valt OpenClaw terug op de ingebouwde SQLite-engine.
  Herhaalde pogingen tijdens chatbeurten wachten na een openingsfout kort
  voordat ze het opnieuw proberen, zodat een ontbrekend binair bestand of een
  defecte sidecarafhankelijkheid geen storm van nieuwe pogingen veroorzaakt;
  `openclaw memory status` en eenmalige CLI-controles controleren QMD nog
  steeds rechtstreeks opnieuw.

<Info>
De eerste zoekopdracht kan traag zijn: QMD downloadt bij de eerste uitvoering
van `qmd query` automatisch GGUF-modellen (~2 GB) voor herrangschikking en
query-uitbreiding.
</Info>

## Zoekprestaties en compatibiliteit

OpenClaw houdt het QMD-zoekpad compatibel met zowel huidige als oudere
QMD-installaties.

Bij het opstarten controleert OpenClaw de helptekst van de geïnstalleerde QMD
eenmaal per manager. Als het binaire bestand ondersteuning voor meerdere
collectiefilters vermeldt, doorzoekt OpenClaw alle collecties met dezelfde
bron met één opdracht:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dit voorkomt dat voor elke collectie met duurzaam geheugen een afzonderlijk
QMD-subproces wordt gestart. Collecties met sessietranscripten blijven in hun
eigen brongroep, zodat gemengde zoekopdrachten in `memory` + `sessions` de
resultaatdiversificatie nog steeds invoer uit beide bronnen geven.

Oudere QMD-builds accepteren slechts één collectiefilter. Wanneer OpenClaw een
van die builds detecteert, behoudt het het compatibiliteitspad en doorzoekt het
elke collectie afzonderlijk voordat de resultaten worden samengevoegd en
gededupliceerd.

Voer het volgende uit om het geïnstalleerde contract handmatig te controleren:

```bash
qmd --help | grep -i collection
```

De huidige QMD-help vermeldt het richten op één of meer collecties. Oudere
help beschrijft doorgaans één collectie.

## Modeloverschrijvingen

Omgevingsvariabelen voor QMD-modellen worden ongewijzigd doorgegeven vanuit
het Gateway-proces, zodat je QMD globaal kunt afstellen zonder nieuwe
OpenClaw-configuratie toe te voegen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Voer na het wijzigen van het embeddingmodel de embeddings opnieuw uit, zodat
de index overeenkomt met de nieuwe vectorruimte.

## Extra paden indexeren

Wijs QMD aanvullende mappen toe om deze doorzoekbaar te maken:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Fragmenten uit extra paden verschijnen als
`qmd/<collection>/<relative-path>` in zoekresultaten. `memory_get` begrijpt
dit voorvoegsel en leest vanuit de juiste collectiebasis.

## Sessietranscripten indexeren

Schakel sessie-indexering in om eerdere gesprekken terug te vinden. QMD heeft
zowel de algemene sessiebron `memorySearch` als de QMD-transcriptexporteur
nodig:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transcripten worden als opgeschoonde Gebruiker/Assistent-beurten geëxporteerd
naar een speciale QMD-collectie onder
`~/.openclaw/agents/<id>/qmd/sessions/`. Alleen
`memorySearch.experimental.sessionMemory` instellen exporteert geen
transcripten naar QMD.

Sessieresultaten worden nog steeds gefilterd door
[`tools.sessions.visibility`](/nl/gateway/config-tools#toolssessions). De
standaardzichtbaarheid `tree` maakt niet-gerelateerde sessies van dezelfde
agent niet zichtbaar. Als een door de Gateway gestarte sessie vanuit een
afzonderlijke DM-sessie terugvindbaar moet zijn, stel dan bewust
`tools.sessions.visibility: "agent"` in.

## Zoekbereik

Standaard worden QMD-zoekresultaten alleen weergegeven in directe sessies
(niet in groeps- of kanaalchats). Configureer `memory.qmd.scope` om dit te
wijzigen:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Het bovenstaande fragment is de daadwerkelijke standaardregel. Wanneer het
bereik een zoekopdracht weigert, registreert OpenClaw een waarschuwing met het
afgeleide kanaal en chattype, zodat lege resultaten eenvoudiger te debuggen
zijn.

## Bronverwijzingen

Wanneer `memory.citations` is ingesteld op `auto` of `on`, wordt aan
zoekfragmenten een voettekst `Source: <path>#L<line>` (of
`#L<start>-L<end>`) toegevoegd. In de modus `auto` wordt de voettekst alleen
toegevoegd voor directe chatsessies. Stel `memory.citations = "off"` in om de
voettekst weg te laten terwijl het pad intern nog steeds aan de agent wordt
doorgegeven.

## Wanneer te gebruiken

Kies QMD wanneer je het volgende nodig hebt:

- Herrangschikking voor resultaten van hogere kwaliteit.
- Projectdocumentatie of notities buiten de werkruimte doorzoeken.
- Gesprekken uit eerdere sessies terugvinden.
- Volledig lokaal zoeken zonder API-sleutels.

Voor eenvoudigere configuraties werkt de
[ingebouwde engine](/nl/concepts/memory-builtin) goed zonder extra
afhankelijkheden.

## Probleemoplossing

**QMD niet gevonden?** Zorg dat het binaire bestand in het `PATH` van de
Gateway staat. Als OpenClaw als service wordt uitgevoerd, maak dan een
symbolische koppeling:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Als `qmd --version` in je shell werkt, maar OpenClaw nog steeds
`spawn qmd ENOENT` meldt, heeft het Gateway-proces waarschijnlijk een ander
`PATH` dan je interactieve shell. Leg het binaire bestand expliciet vast:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Gebruik `command -v qmd` in de omgeving waarin QMD is geïnstalleerd en
controleer vervolgens opnieuw met `openclaw memory status --deep`.

**Eerste zoekopdracht erg traag?** QMD downloadt GGUF-modellen bij het eerste
gebruik. Warm vooraf op met `qmd query "test"` en gebruik daarbij dezelfde
XDG-mappen als OpenClaw.

**Veel QMD-subprocessen tijdens het zoeken?** Werk QMD indien mogelijk bij.
OpenClaw gebruikt voor zoekopdrachten in meerdere collecties met dezelfde bron
alleen één proces wanneer de geïnstalleerde QMD ondersteuning voor meerdere
`-c`-filters vermeldt; anders behoudt het voor de juistheid de oudere terugval
per collectie.

**Probeert QMD met alleen BM25 nog steeds llama.cpp te bouwen?** Stel
`memory.qmd.searchMode = "search"` in. OpenClaw behandelt die modus als
uitsluitend lexicaal, slaat controles van de QMD-vectorstatus en het onderhoud
van embeddings over en laat controles op semantische gereedheid over aan
configuraties met `vsearch` of `query`.

**Time-out bij zoeken?** Verhoog `memory.qmd.limits.timeoutMs` (standaard:
4000ms). Stel dit hoger in, bijvoorbeeld op `120000`, voor tragere hardware.

**Lege resultaten in groeps- of kanaalchats?** Dit is te verwachten met het
standaardbereik `memory.qmd.scope`, dat alleen directe sessies toestaat. Voeg
een `allow`-regel toe voor chattypen `group` of `channel` als je daar
QMD-resultaten wilt.

**Is zoeken in het hoofdgeheugen plotseling te breed geworden?** Start de
Gateway opnieuw of wacht op de volgende afstemming bij het opstarten. OpenClaw
maakt verouderde beheerde collecties opnieuw aan met de canonieke patronen
`MEMORY.md` en `memory/` wanneer het een conflict met dezelfde naam detecteert.

**Veroorzaken tijdelijke opslagplaatsen die vanuit de werkruimte zichtbaar
zijn `ENAMETOOLONG` of defecte indexering?** QMD-doorloop volgt de onderliggende
QMD-scanner in plaats van de ingebouwde regels van OpenClaw voor symbolische
koppelingen. Bewaar tijdelijke monorepo-checkouts in verborgen mappen zoals
`.tmp/` of buiten geïndexeerde QMD-basispaden totdat QMD cyclusveilige
doorloop of expliciete uitsluitingsopties biedt.

## Configuratie

Zie de
[referentie voor geheugenconfiguratie](/nl/reference/memory-config) voor het
volledige configuratieoppervlak (`memory.qmd.*`), zoekmodi,
update-intervallen, bereikregels en alle andere instellingen.

## Gerelateerd

- [Overzicht van geheugen](/nl/concepts/memory)
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin)
- [Honcho-geheugen](/nl/concepts/memory-honcho)
