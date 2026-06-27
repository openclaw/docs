---
read_when:
    - Je wilt QMD instellen als je geheugenbackend
    - Je wilt geavanceerde geheugenfuncties zoals herrangschikking of extra geïndexeerde paden
summary: Local-first zoek-sidecar met BM25, vectoren, herrangschikking en query-uitbreiding
title: QMD-geheugenengine
x-i18n:
    generated_at: "2026-06-27T17:26:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) is een local-first zoek-sidecar die naast
OpenClaw draait. Het combineert BM25, vectorzoekopdrachten en reranking in één
binary, en kan inhoud buiten de geheugenbestanden van je werkruimte indexeren.

## Wat het toevoegt ten opzichte van ingebouwd

- **Reranking en query-uitbreiding** voor betere recall.
- **Extra mappen indexeren** -- projectdocs, teamnotities, alles op schijf.
- **Sessietranscripten indexeren** -- haal eerdere gesprekken terug.
- **Volledig lokaal** -- draait met de officiële llama.cpp-providerplugin en
  downloadt GGUF-modellen automatisch.
- **Automatische fallback** -- als QMD niet beschikbaar is, valt OpenClaw naadloos
  terug op de ingebouwde engine.

## Aan de slag

### Vereisten

- Installeer QMD: `npm install -g @tobilu/qmd` of `bun install -g @tobilu/qmd`
- SQLite-build die extensies toestaat (`brew install sqlite` op macOS).
- QMD moet op de `PATH` van de Gateway staan.
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
`~/.openclaw/agents/<agentId>/qmd/` en beheert de sidecar-levenscyclus
automatisch -- collecties, updates en embedding-runs worden voor je afgehandeld.
Het geeft de voorkeur aan de huidige QMD-collectie- en MCP-queryvormen, maar
valt indien nodig nog steeds terug op alternatieve vlaggen voor collectiepatronen
en oudere MCP-toolnamen. Reconciliatie tijdens het opstarten maakt ook
verouderde beheerde collecties opnieuw aan met hun canonieke patronen wanneer
een oudere QMD-collectie met dezelfde naam nog aanwezig is.

## Hoe de sidecar werkt

- OpenClaw maakt collecties op basis van de geheugenbestanden van je werkruimte
  en eventuele geconfigureerde `memory.qmd.paths`, en voert daarna `qmd update`
  uit wanneer de QMD-manager wordt geopend en periodiek daarna (standaard elke
  5 minuten). Deze vernieuwingen lopen via QMD-subprocessen, niet via een
  bestandssysteemcrawl in hetzelfde proces. Semantische modi voeren ook
  `qmd embed` uit.
- De standaardwerkruimtecollectie volgt `MEMORY.md` plus de `memory/`-boom.
  `memory.md` in kleine letters wordt niet geïndexeerd als rootgeheugenbestand.
- QMD's eigen scanner negeert verborgen paden en gangbare dependency-/buildmappen
  zoals `.git`, `.cache`, `node_modules`, `vendor`, `dist` en `build`.
  Gateway-opstart initialiseert QMD standaard niet, zodat een koude start vermijdt
  dat de geheugenruntime wordt geïmporteerd of de langlevende watcher wordt
  aangemaakt voordat geheugen voor het eerst wordt gebruikt.
- Als je QMD toch bij Gateway-start wilt initialiseren, stel dan
  `memory.qmd.update.startup` in op `idle` of `immediate`. Met
  `memory.qmd.update.onBoot: true` voert het opstarten de eerste vernieuwing uit.
  Met `onBoot: false` slaat het opstarten die onmiddellijke vernieuwing over, maar
  opent het nog steeds de langlevende manager wanneer update- of embed-intervallen
  zijn geconfigureerd, zodat QMD de eigen reguliere watcher en timers kan beheren.
- Zoekopdrachten gebruiken de geconfigureerde `searchMode` (standaard: `search`;
  ondersteunt ook `vsearch` en `query`). `search` is alleen BM25, dus OpenClaw
  slaat semantische gereedheidsprobes voor vectoren en embedding-onderhoud over
  in die modus. Als een modus faalt, probeert OpenClaw het opnieuw met
  `qmd query`.
- Wanneer `searchMode` `query` is, stel je `memory.qmd.rerank` in op `false` om
  QMD's hybride querypad zonder reranker te gebruiken. OpenClaw geeft
  `--no-rerank` door aan het directe QMD-CLI-pad en `rerank: false` aan QMD's
  MCP-querytool. Deze optie vereist QMD 2.1 of nieuwer.
- Met QMD-releases die filters voor meerdere collecties adverteren, groepeert
  OpenClaw collecties met dezelfde bron in één QMD-zoekaanroep. Oudere QMD-releases
  behouden de compatibele fallback per collectie.
- Als QMD volledig faalt, valt OpenClaw terug op de ingebouwde SQLite-engine.
  Herhaalde pogingen tijdens chatbeurten wachten kort na een openfout, zodat een
  ontbrekende binary of kapotte sidecar-dependency geen retry-storm veroorzaakt;
  `openclaw memory status` en eenmalige CLI-probes controleren QMD nog steeds
  rechtstreeks opnieuw.

<Info>
De eerste zoekopdracht kan traag zijn -- QMD downloadt automatisch GGUF-modellen
(~2 GB) voor reranking en query-uitbreiding bij de eerste `qmd query`-run.
</Info>

## Zoekprestaties en compatibiliteit

OpenClaw houdt het QMD-zoekpad compatibel met zowel huidige als oudere
QMD-installaties.

Bij het opstarten controleert OpenClaw de helptekst van de geïnstalleerde QMD
één keer per manager. Als de binary ondersteuning voor meerdere collectiefilters
adverteert, doorzoekt OpenClaw alle collecties met dezelfde bron met één opdracht:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dit voorkomt dat er voor elke duurzame-geheugencollectie één QMD-subproces wordt
gestart. Collecties met sessietranscripten blijven in hun eigen brongroep, zodat
gemengde `memory` + `sessions`-zoekopdrachten de resultaatdiversifier nog steeds
input uit beide bronnen geven.

Oudere QMD-builds accepteren slechts één collectiefilter. Wanneer OpenClaw een
van die builds detecteert, behoudt het het compatibiliteitspad en doorzoekt het
elke collectie afzonderlijk voordat resultaten worden samengevoegd en
gededupliceerd.

Voer het volgende uit om het geïnstalleerde contract handmatig te inspecteren:

```bash
qmd --help | grep -i collection
```

De huidige QMD-help zegt dat collectiefilters één of meer collecties kunnen
targeten. Oudere help beschrijft meestal één enkele collectie.

## Modeloverschrijvingen

QMD-modelomgevingsvariabelen worden ongewijzigd doorgegeven vanuit het
Gateway-proces, zodat je QMD globaal kunt afstemmen zonder nieuwe
OpenClaw-configuratie toe te voegen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Voer embeddings opnieuw uit nadat je het embeddingmodel hebt gewijzigd, zodat de
index overeenkomt met de nieuwe vectorruimte.

## Extra paden indexeren

Wijs QMD naar extra mappen om ze doorzoekbaar te maken:

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

Snippets uit extra paden verschijnen als `qmd/<collection>/<relative-path>` in
zoekresultaten. `memory_get` begrijpt dit voorvoegsel en leest vanuit de juiste
collectieroot.

## Sessietranscripten indexeren

Schakel sessie-indexering in om eerdere gesprekken terug te halen:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transcripten worden geëxporteerd als opgeschoonde Gebruiker/Assistent-beurten
naar een speciale QMD-collectie onder `~/.openclaw/agents/<id>/qmd/sessions/`.

## Zoekbereik

Standaard worden QMD-zoekresultaten getoond in directe en kanaalsessies
(niet in groepen). Configureer `memory.qmd.scope` om dit te wijzigen:

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

Wanneer scope een zoekopdracht weigert, logt OpenClaw een waarschuwing met het
afgeleide kanaal en chattype, zodat lege resultaten makkelijker te debuggen zijn.

## Citaten

Wanneer `memory.citations` `auto` of `on` is, bevatten zoeksnippets een
`Source: <path#line>`-footer. Stel `memory.citations = "off"` in om de footer
weg te laten terwijl het pad intern nog steeds aan de agent wordt doorgegeven.

## Wanneer gebruiken

Kies QMD wanneer je het volgende nodig hebt:

- Reranking voor resultaten van hogere kwaliteit.
- Projectdocs of notities buiten de werkruimte doorzoeken.
- Eerdere sessiegesprekken terughalen.
- Volledig lokaal zoeken zonder API-sleutels.

Voor eenvoudigere setups werkt de [ingebouwde engine](/nl/concepts/memory-builtin)
goed zonder extra dependencies.

## Problemen oplossen

**QMD niet gevonden?** Zorg dat de binary op de `PATH` van de Gateway staat. Als
OpenClaw als service draait, maak dan een symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Als `qmd --version` in je shell werkt maar OpenClaw nog steeds
`spawn qmd ENOENT` meldt, heeft het Gateway-proces waarschijnlijk een andere
`PATH` dan je interactieve shell. Pin de binary expliciet:

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

Gebruik `command -v qmd` in de omgeving waar QMD is geïnstalleerd en controleer
daarna opnieuw met `openclaw memory status --deep`.

**Eerste zoekopdracht erg traag?** QMD downloadt GGUF-modellen bij het eerste
gebruik. Warm vooraf op met `qmd query "test"` met dezelfde XDG-mappen die
OpenClaw gebruikt.

**Veel QMD-subprocessen tijdens zoeken?** Werk QMD bij als dat mogelijk is.
OpenClaw gebruikt slechts één proces voor zoekopdrachten over meerdere collecties
met dezelfde bron wanneer de geïnstalleerde QMD ondersteuning voor meerdere
`-c`-filters adverteert; anders behoudt het de oudere fallback per collectie
voor correctheid.

**BM25-only QMD probeert nog steeds llama.cpp te bouwen?** Stel
`memory.qmd.searchMode = "search"` in. OpenClaw behandelt die modus als
alleen-lexicaal, voert geen QMD-vectorstatusprobes of embedding-onderhoud uit en
laat semantische gereedheidscontroles over aan `vsearch`- of `query`-setups.

**Zoeken loopt vast op een timeout?** Verhoog `memory.qmd.limits.timeoutMs`
(standaard: 4000ms). Stel dit in op `120000` voor tragere hardware.

**Lege resultaten in groepschats?** Controleer `memory.qmd.scope` -- de standaard
staat alleen directe en kanaalsessies toe.

**Rootgeheugenzoekopdracht werd plots te breed?** Herstart de Gateway of wacht
op de volgende opstartreconciliatie. OpenClaw maakt verouderde beheerde
collecties opnieuw aan met canonieke `MEMORY.md`- en `memory/`-patronen wanneer
het een conflict met dezelfde naam detecteert.

**Werkruimte-zichtbare tijdelijke repo's veroorzaken `ENAMETOOLONG` of kapotte
indexering?** QMD-traversal volgt momenteel het gedrag van de onderliggende
QMD-scanner in plaats van OpenClaw's ingebouwde symlinkregels. Houd tijdelijke
monorepo-checkouts onder verborgen mappen zoals `.tmp/` of buiten geïndexeerde
QMD-roots totdat QMD cyclusveilige traversal of expliciete uitsluitingscontroles
beschikbaar maakt.

## Configuratie

Voor het volledige configuratieoppervlak (`memory.qmd.*`), zoekmodi,
update-intervallen, scoperegels en alle andere knoppen, zie de
[referentie voor geheugenconfiguratie](/nl/reference/memory-config).

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin)
- [Honcho-geheugen](/nl/concepts/memory-honcho)
