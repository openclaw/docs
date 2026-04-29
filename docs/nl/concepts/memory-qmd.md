---
read_when:
    - Je wilt QMD instellen als je geheugenbackend
    - Je wilt geavanceerde geheugenfuncties zoals reranking of extra geïndexeerde paden
summary: Nevenservice voor lokaal-eerst zoeken met BM25, vectoren, herrangschikking en query-uitbreiding
title: QMD-geheugenengine
x-i18n:
    generated_at: "2026-04-29T22:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) is een lokaal-eerst zoek-sidecar die naast
OpenClaw draait. Het combineert BM25, vectorzoeken en herrangschikken in een
enkele binary, en kan inhoud indexeren buiten je werkruimtegeheugenbestanden.

## Wat het toevoegt ten opzichte van de ingebouwde engine

- **Herrangschikken en query-uitbreiding** voor betere recall.
- **Extra mappen indexeren** -- projectdocumentatie, teamnotities, alles op schijf.
- **Sessietranscripten indexeren** -- haal eerdere gesprekken op.
- **Volledig lokaal** -- draait met het optionele node-llama-cpp-runtimepakket en
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

OpenClaw maakt een op zichzelf staande QMD-home aan onder
`~/.openclaw/agents/<agentId>/qmd/` en beheert automatisch de levenscyclus van
de sidecar -- collecties, updates en embedding-runs worden voor je afgehandeld.
Het geeft de voorkeur aan huidige QMD-collectie- en MCP-queryvormen, maar valt
waar nodig nog steeds terug op alternatieve collection pattern-flags en oudere
MCP-toolnamen. Afstemming tijdens het opstarten maakt ook verouderde beheerde
collecties opnieuw aan met hun canonieke patronen wanneer een oudere
QMD-collectie met dezelfde naam nog aanwezig is.

## Hoe de sidecar werkt

- OpenClaw maakt collecties van je werkruimtegeheugenbestanden en eventuele
  geconfigureerde `memory.qmd.paths`, en voert daarna `qmd update` uit wanneer
  de QMD-manager wordt geopend en periodiek daarna (standaard elke 5 minuten).
  Deze vernieuwingen lopen via QMD-subprocessen, niet via een filesystem-crawl
  binnen het proces. Semantische modi voeren ook `qmd embed` uit.
- De standaardwerkruimtecollectie volgt `MEMORY.md` plus de `memory/`-boom.
  `memory.md` in kleine letters wordt niet geïndexeerd als rootgeheugenbestand.
- QMD's eigen scanner negeert verborgen paden en gangbare afhankelijkheids- en
  buildmappen zoals `.git`, `.cache`, `node_modules`, `vendor`, `dist` en
  `build`. Het opstarten van de Gateway initialiseert QMD standaard niet, zodat
  een koude start voorkomt dat de geheugenruntime wordt geïmporteerd of de
  langlevende watcher wordt aangemaakt voordat geheugen voor het eerst wordt
  gebruikt.
- Als je toch een vernieuwing bij Gateway-start wilt, stel dan
  `memory.qmd.update.startup` in op `idle` of `immediate`. De opt-in
  opstartvernieuwing gebruikt een eenmalig QMD-subprocespad in plaats van de
  volledige langlevende watcher binnen het proces aan te maken.
- Zoekopdrachten gebruiken de geconfigureerde `searchMode` (standaard: `search`;
  ondersteunt ook `vsearch` en `query`). `search` is alleen BM25, dus OpenClaw
  slaat probes voor semantische vectorgereedheid en embedding-onderhoud over in
  die modus. Als een modus faalt, probeert OpenClaw opnieuw met `qmd query`.
- Met QMD-releases die multi-collectiefilters adverteren, groepeert OpenClaw
  collecties met dezelfde bron in één QMD-zoekaanroep. Oudere QMD-releases
  behouden de compatibele fallback per collectie.
- Als QMD volledig faalt, valt OpenClaw terug op de ingebouwde SQLite-engine.
  Herhaalde pogingen tijdens chatbeurten krijgen kortstondig back-off na een
  openfout, zodat een ontbrekende binary of kapotte sidecar-afhankelijkheid geen
  retry-storm veroorzaakt; `openclaw memory status` en eenmalige CLI-probes
  controleren QMD nog steeds rechtstreeks opnieuw.

<Info>
De eerste zoekopdracht kan traag zijn -- QMD downloadt automatisch GGUF-modellen
(~2 GB) voor herrangschikken en query-uitbreiding bij de eerste `qmd query`-run.
</Info>

## Zoekprestaties en compatibiliteit

OpenClaw houdt het QMD-zoekpad compatibel met zowel huidige als oudere
QMD-installaties.

Bij het opstarten controleert OpenClaw de geïnstalleerde QMD-helptekst één keer
per manager. Als de binary ondersteuning voor meerdere collectiefilters
adverteert, doorzoekt OpenClaw alle collecties met dezelfde bron met één
commando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dit voorkomt dat er één QMD-subproces wordt gestart voor elke duurzame
geheugencollectie. Collecties met sessietranscripten blijven in hun eigen
brongroep, zodat gemengde `memory` + `sessions`-zoekopdrachten de
resultaatdiversifier nog steeds invoer uit beide bronnen geven.

Oudere QMD-builds accepteren slechts één collectiefilter. Wanneer OpenClaw een
van die builds detecteert, behoudt het het compatibiliteitspad en doorzoekt het
elke collectie afzonderlijk voordat resultaten worden samengevoegd en
gededupliceerd.

Voer dit uit om het geïnstalleerde contract handmatig te inspecteren:

```bash
qmd --help | grep -i collection
```

Huidige QMD-help zegt dat collectiefilters één of meer collecties kunnen
targeten. Oudere help beschrijft meestal één enkele collectie.

## Model-overrides

QMD-modelomgevingsvariabelen worden ongewijzigd doorgegeven vanuit het
Gateway-proces, zodat je QMD globaal kunt afstemmen zonder nieuwe
OpenClaw-configuratie toe te voegen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Voer na het wijzigen van het embeddingmodel embeddings opnieuw uit, zodat de
index overeenkomt met de nieuwe vectorruimte.

## Extra paden indexeren

Wijs QMD naar aanvullende mappen om ze doorzoekbaar te maken:

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
zoekresultaten. `memory_get` begrijpt dit prefix en leest vanaf de juiste
collectieroot.

## Sessietranscripten indexeren

Schakel sessie-indexering in om eerdere gesprekken op te halen:

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

Transcripten worden geëxporteerd als gesaneerde Gebruiker-/Assistent-beurten
naar een toegewezen QMD-collectie onder
`~/.openclaw/agents/<id>/qmd/sessions/`.

## Zoekscope

Standaard worden QMD-zoekresultaten weergegeven in directe sessies en
kanaalsessies (niet groepen). Configureer `memory.qmd.scope` om dit te wijzigen:

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
afgeleide kanaal en chattype, zodat lege resultaten gemakkelijker te debuggen
zijn.

## Citaten

Wanneer `memory.citations` `auto` of `on` is, bevatten zoekfragmenten een
`Source: <path#line>`-footer. Stel `memory.citations = "off"` in om de footer
weg te laten terwijl het pad intern nog steeds aan de agent wordt doorgegeven.

## Wanneer gebruiken

Kies QMD wanneer je dit nodig hebt:

- Herrangschikken voor resultaten van hogere kwaliteit.
- Projectdocumentatie of notities buiten de werkruimte doorzoeken.
- Eerdere sessiegesprekken ophalen.
- Volledig lokaal zoeken zonder API-sleutels.

Voor eenvoudigere configuraties werkt de [ingebouwde engine](/nl/concepts/memory-builtin)
goed zonder extra afhankelijkheden.

## Probleemoplossing

**QMD niet gevonden?** Zorg dat de binary op de `PATH` van de Gateway staat. Als
OpenClaw als service draait, maak dan een symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Als `qmd --version` in je shell werkt, maar OpenClaw nog steeds
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

Gebruik `command -v qmd` in de omgeving waarin QMD is geïnstalleerd, en
controleer daarna opnieuw met `openclaw memory status --deep`.

**Eerste zoekopdracht erg traag?** QMD downloadt GGUF-modellen bij het eerste
gebruik. Warm vooraf op met `qmd query "test"` met dezelfde XDG-mappen die
OpenClaw gebruikt.

**Veel QMD-subprocessen tijdens zoeken?** Werk QMD bij als dat mogelijk is.
OpenClaw gebruikt alleen één proces voor multi-collectiezoekopdrachten met
dezelfde bron wanneer de geïnstalleerde QMD ondersteuning voor meerdere
`-c`-filters adverteert; anders behoudt het voor correctheid de oudere fallback
per collectie.

**Alleen-BM25 QMD probeert nog steeds llama.cpp te bouwen?** Stel
`memory.qmd.searchMode = "search"` in. OpenClaw behandelt die modus als alleen
lexicaal, voert geen QMD-vectorstatusprobes of embedding-onderhoud uit, en laat
semantische gereedheidscontroles over aan `vsearch`- of `query`-configuraties.

**Time-out bij zoeken?** Verhoog `memory.qmd.limits.timeoutMs` (standaard:
4000ms). Stel in op `120000` voor tragere hardware.

**Lege resultaten in groepschats?** Controleer `memory.qmd.scope` -- de
standaard staat alleen directe sessies en kanaalsessies toe.

**Rootgeheugenzoekopdracht werd ineens te breed?** Herstart de Gateway of wacht
op de volgende opstartafstemming. OpenClaw maakt verouderde beheerde collecties
opnieuw aan met canonieke `MEMORY.md`- en `memory/`-patronen wanneer het een
conflict met dezelfde naam detecteert.

**Werkruimte-zichtbare tijdelijke repo's veroorzaken `ENAMETOOLONG` of kapotte
indexering?** QMD-traversal volgt momenteel het gedrag van de onderliggende
QMD-scanner in plaats van OpenClaw's ingebouwde symlinkregels. Houd tijdelijke
monorepo-checkouts onder verborgen mappen zoals `.tmp/` of buiten geïndexeerde
QMD-roots totdat QMD cyclusveilige traversal of expliciete uitsluitingscontrols
blootstelt.

## Configuratie

Voor het volledige configuratieoppervlak (`memory.qmd.*`), zoekmodi,
update-intervallen, scoperegels en alle andere knoppen, zie de
[referentie voor geheugenconfiguratie](/nl/reference/memory-config).

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin)
- [Honcho-geheugen](/nl/concepts/memory-honcho)
