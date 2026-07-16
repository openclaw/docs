---
read_when:
    - Je wilt QMD instellen als backend voor je geheugen
    - Je wilt geavanceerde geheugenfuncties, zoals herrangschikking of extra geïndexeerde paden
summary: Local-first zoeksidecar met BM25, vectoren, herrangschikking en query-uitbreiding
title: QMD-geheugenengine
x-i18n:
    generated_at: "2026-07-16T15:29:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) is een local-first zoeksidecar die naast
OpenClaw draait. Het combineert BM25, vectorzoeken en herrangschikking in één
binair bestand en kan inhoud buiten de geheugenbestanden van je werkruimte indexeren.

## Wat het toevoegt ten opzichte van de ingebouwde engine

- **Herrangschikking en query-uitbreiding** voor een beter bereik.
- **Extra mappen indexeren** - projectdocumentatie, teamnotities, alles op schijf.
- **Sessietranscripten indexeren** - eerdere gesprekken terugvinden.
- **Volledig lokaal** - draait met de officiële llama.cpp-providerplugin en
  downloadt GGUF-modellen automatisch.
- **Automatische terugval** - als QMD niet beschikbaar is, valt OpenClaw naadloos
  terug op de ingebouwde engine.

## Aan de slag

### Vereisten

- Installeer QMD: `npm install -g @tobilu/qmd` of `bun install -g @tobilu/qmd`
- Een SQLite-build die extensies toestaat (`brew install sqlite` op macOS).
- QMD moet zich in de `PATH` van de Gateway bevinden.
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
automatisch - verzamelingen, updates en embedding-runs worden voor je afgehandeld.
Het geeft de voorkeur aan de huidige QMD-vormen voor verzamelingen en MCP-query's, maar valt
indien nodig terug op alternatieve vlaggen voor verzamelingspatronen en oudere MCP-toolnamen.
Afstemming bij het opstarten maakt ook verouderde beheerde verzamelingen opnieuw aan met hun
canonieke patronen wanneer er nog een oudere QMD-verzameling met dezelfde naam
aanwezig is.

## Hoe de sidecar werkt

- OpenClaw maakt verzamelingen aan vanuit de geheugenbestanden van je werkruimte en eventuele
  geconfigureerde `memory.qmd.paths`, voert vervolgens `qmd update` uit wanneer de QMD-manager
  wordt geopend en daarna periodiek (`memory.qmd.update.interval`, standaard
  `5m`). Vernieuwingen verlopen via QMD-subprocessen, niet via een
  bestandssysteemscan binnen het proces. Semantische zoekmodi voeren ook `qmd embed` uit
  (`memory.qmd.update.embedInterval`, standaard `60m`).
- De standaardverzameling voor de werkruimte volgt `MEMORY.md` plus de `memory/`-structuur.
  `memory.md` in kleine letters wordt niet als hoofdgeheugenbestand geïndexeerd.
- De eigen scanner van QMD negeert verborgen paden en veelgebruikte mappen voor afhankelijkheden/builds,
  zoals `.git`, `.cache`, `node_modules`, `vendor`, `dist` en
  `build`. Bij het opstarten initialiseert de Gateway QMD standaard niet
  (`memory.qmd.update.startup` is standaard `off`), zodat een koude start voorkomt
  dat de geheugenruntime wordt geïmporteerd of de langlevende watcher wordt aangemaakt voordat
  het geheugen voor het eerst wordt gebruikt.
- Stel `memory.qmd.update.startup` in op `idle` of `immediate` om QMD toch
  bij het starten van de Gateway te initialiseren. `memory.qmd.update.onBoot` is standaard `true` en
  voert de eerste vernieuwing bij het opstarten uit; stel dit in op `false` om die
  onmiddellijke vernieuwing over te slaan (de langlevende manager wordt nog steeds geopend wanneer
  update- of embedding-intervallen zijn geconfigureerd, zodat QMD zijn reguliere watcher/timers blijft beheren).
- Zoekopdrachten gebruiken de geconfigureerde `searchMode` (standaard: `search`; ondersteunt ook
  `vsearch` en `query`). `search` gebruikt alleen BM25, dus OpenClaw slaat in die modus
  controles op de gereedheid van semantische vectoren en embedding-onderhoud over. Als een modus
  mislukt, probeert OpenClaw het opnieuw met `qmd query`.
- Wanneer `searchMode` is ingesteld op `query`, stel je `memory.qmd.rerank` in op `false` om
  het hybride querypad van QMD zonder de herrangschikker te gebruiken (vereist QMD 2.1 of nieuwer).
  OpenClaw geeft `--no-rerank` door aan het directe QMD-CLI-pad en
  `rerank: false` aan de MCP-querytool van QMD.
- Met QMD-releases die filters voor meerdere verzamelingen aankondigen, groepeert OpenClaw
  verzamelingen met dezelfde bron in één QMD-zoekaanroep. Oudere QMD-releases
  behouden de compatibele terugval per verzameling.
- Als QMD volledig uitvalt, valt OpenClaw terug op de ingebouwde SQLite-engine.
  Herhaalde pogingen tijdens chatbeurten wachten kort na een fout bij het openen, zodat een
  ontbrekend binair bestand of een defecte sidecar-afhankelijkheid geen storm van nieuwe pogingen veroorzaakt;
  `openclaw memory status` en eenmalige CLI-controles controleren QMD nog steeds
  rechtstreeks opnieuw.

<Info>
De eerste zoekopdracht kan traag zijn - QMD downloadt automatisch GGUF-modellen (~2 GB) voor
herrangschikking en query-uitbreiding tijdens de eerste uitvoering van `qmd query`.
</Info>

## Zoekprestaties en compatibiliteit

OpenClaw houdt het QMD-zoekpad compatibel met zowel huidige als oudere
QMD-installaties.

Bij het opstarten controleert OpenClaw de helptekst van de geïnstalleerde QMD eenmaal per manager. Als
het binaire bestand ondersteuning voor meerdere verzamelingsfilters aankondigt, doorzoekt OpenClaw
alle verzamelingen met dezelfde bron met één opdracht:

```bash
qmd search "routernotities" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dit voorkomt dat voor elke verzameling met duurzaam geheugen een afzonderlijk QMD-subproces wordt gestart.
Verzamelingen met sessietranscripten blijven in hun eigen brongroep, zodat gemengde
zoekopdrachten in `memory` + `sessions` de invoer voor resultaatdiversificatie uit
beide bronnen blijven leveren.

Oudere QMD-builds accepteren slechts één verzamelingsfilter. Wanneer OpenClaw een
van die builds detecteert, behoudt het het compatibiliteitspad en doorzoekt het elke verzameling
afzonderlijk voordat de resultaten worden samengevoegd en ontdubbeld.

Voer het volgende uit om het geïnstalleerde contract handmatig te inspecteren:

```bash
qmd --help | grep -i collection
```

De huidige QMD-help vermeldt het richten op een of meer verzamelingen. Oudere helptekst
beschrijft meestal één verzameling.

## Modeloverschrijvingen

Omgevingsvariabelen voor QMD-modellen worden ongewijzigd doorgegeven vanuit het Gateway-proces,
zodat je QMD globaal kunt afstemmen zonder nieuwe OpenClaw-configuratie toe te voegen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Voer na het wijzigen van het embeddingmodel de embeddings opnieuw uit, zodat de index overeenkomt met de
nieuwe vectorruimte.

## Extra paden indexeren

Wijs QMD op aanvullende mappen om ze doorzoekbaar te maken:

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

Fragmenten uit extra paden verschijnen als `qmd/<collection>/<relative-path>` in
zoekresultaten. `memory_get` begrijpt dit voorvoegsel en leest uit de
juiste hoofdmap van de verzameling.

## Sessietranscripten indexeren

Schakel sessie-indexering in om eerdere gesprekken terug te vinden. QMD heeft zowel de
algemene sessiebron `memorySearch` als de QMD-transcriptexporteur nodig:

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

Transcripten worden als opgeschoonde Gebruiker/Assistent-beurten geëxporteerd naar een afzonderlijke QMD-
verzameling onder `~/.openclaw/agents/<id>/qmd/sessions/`. Alleen
`memorySearch.experimental.sessionMemory` instellen exporteert geen transcripten naar
QMD.

Sessieresultaten worden nog steeds gefilterd door
[`tools.sessions.visibility`](/nl/gateway/config-tools#toolssessions). De
standaardzichtbaarheid `tree` stelt niet-gerelateerde sessies van dezelfde agent niet beschikbaar. Als een
door de Gateway gestarte sessie vanuit een afzonderlijke DM-sessie terugvindbaar moet zijn,
stel `tools.sessions.visibility: "agent"` dan bewust in.

## Zoekbereik

Standaard worden QMD-zoekresultaten alleen weergegeven in directe sessies (niet in
groeps- of kanaalchats). Configureer `memory.qmd.scope` om dit te wijzigen:

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

Het bovenstaande fragment is de daadwerkelijke standaardregel. Wanneer het bereik een zoekopdracht weigert,
registreert OpenClaw een waarschuwing met het afgeleide kanaal en chattype, zodat lege
resultaten gemakkelijker te debuggen zijn.

## Citaten

Wanneer `memory.citations` is ingesteld op `auto` of `on`, krijgen zoekfragmenten een
voetregel `Source: <path>#L<line>` (of `#L<start>-L<end>`) toegevoegd. In de modus `auto`
wordt de voetregel alleen toegevoegd voor directe chatsessies. Stel
`memory.citations = "off"` in om de voetregel weg te laten terwijl het pad intern nog steeds aan
de agent wordt doorgegeven.

## Wanneer te gebruiken

Kies QMD wanneer je het volgende nodig hebt:

- Herrangschikking voor resultaten van hogere kwaliteit.
- Projectdocumentatie of notities buiten de werkruimte doorzoeken.
- Eerdere sessiegesprekken terugvinden.
- Volledig lokaal zoeken zonder API-sleutels.

Voor eenvoudigere configuraties werkt de [ingebouwde engine](/nl/concepts/memory-builtin) goed
zonder extra afhankelijkheden.

## Probleemoplossing

**QMD niet gevonden?** Zorg dat het binaire bestand zich in de `PATH` van de Gateway bevindt. Als OpenClaw
als service draait, maak dan een symbolische koppeling:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Als `qmd --version` in je shell werkt, maar OpenClaw nog steeds
`spawn qmd ENOENT` meldt, heeft het Gateway-proces waarschijnlijk een andere `PATH` dan
je interactieve shell. Leg het binaire bestand expliciet vast:

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

Gebruik `command -v qmd` in de omgeving waarin QMD is geïnstalleerd en controleer daarna opnieuw
met `openclaw memory status --deep`.

**Eerste zoekopdracht erg traag?** QMD downloadt bij het eerste gebruik GGUF-modellen. Warm het vooraf op
met `qmd query "test"` en gebruik daarbij dezelfde XDG-mappen als OpenClaw.

**Veel QMD-subprocessen tijdens het zoeken?** Werk QMD indien mogelijk bij. OpenClaw
gebruikt alleen één proces voor zoekopdrachten in meerdere verzamelingen met dezelfde bron wanneer de
geïnstalleerde QMD ondersteuning voor meerdere `-c`-filters aankondigt; anders
behoudt het voor de juistheid de oudere terugval per verzameling.

**Probeert QMD met alleen BM25 nog steeds llama.cpp te bouwen?** Stel
`memory.qmd.searchMode = "search"` in. OpenClaw behandelt die modus als
uitsluitend lexicaal, slaat QMD-vectorstatuscontroles en embedding-onderhoud over en
laat controles op semantische gereedheid over aan configuraties met `vsearch` of `query`.

**Time-out tijdens zoeken?** Verhoog `memory.qmd.limits.timeoutMs` (standaard: 4000ms).
Stel dit voor tragere hardware hoger in, bijvoorbeeld op `120000`. Deze limiet geldt voor
de eigen zoekopdrachten van QMD tijdens `memory_search`-aanroepen van de agent; installatie, synchronisatie,
ingebouwde terugval en aanvullend corpuswerk behouden hun eigen kortere deadlines.

**Lege resultaten in groeps- of kanaalchats?** Dit is te verwachten met de
standaard-`memory.qmd.scope`, die alleen directe sessies toestaat. Voeg een
`allow`-regel toe voor chattypen `group` of `channel` als je daar QMD-resultaten
wilt.

**Zoeken in het hoofdgeheugen is plotseling te breed geworden?** Start de Gateway opnieuw of wacht
op de volgende afstemming bij het opstarten. OpenClaw maakt verouderde beheerde
verzamelingen opnieuw aan met canonieke patronen `MEMORY.md` en `memory/` wanneer het
een conflict met dezelfde naam detecteert.

**Tijdelijke repo's die zichtbaar zijn in de werkruimte veroorzaken `ENAMETOOLONG` of defecte indexering?**
QMD-doorloop volgt de onderliggende QMD-scanner in plaats van de
ingebouwde regels voor symbolische koppelingen van OpenClaw. Bewaar tijdelijke monorepo-checkouts in verborgen
mappen zoals `.tmp/` of buiten geïndexeerde QMD-hoofdmappen totdat QMD
cyclusveilige doorloop of expliciete uitsluitingsopties biedt.

## Configuratie

Zie voor het volledige configuratieoppervlak (`memory.qmd.*`), zoekmodi, update-intervallen,
bereikregels en alle andere instellingen de
[referentie voor geheugenconfiguratie](/nl/reference/memory-config).

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin)
- [Honcho-geheugen](/nl/concepts/memory-honcho)
