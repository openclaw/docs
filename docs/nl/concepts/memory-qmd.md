---
read_when:
    - Je wilt QMD instellen als je geheugenbackend
    - Je wilt geavanceerde geheugenfuncties zoals herrangschikking of extra geïndexeerde paden
summary: Local-first zoek-sidecar met BM25, vectoren, herranking en query-uitbreiding
title: QMD-geheugenengine
x-i18n:
    generated_at: "2026-06-28T22:33:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) is een local-first zoek-sidecar die naast OpenClaw draait. Het combineert BM25, vectorzoekopdrachten en reranking in één binary, en kan inhoud indexeren buiten je werkruimtegeheugenbestanden.

## Wat het toevoegt bovenop builtin

- **Reranking en query-uitbreiding** voor betere recall.
- **Extra mappen indexeren** -- projectdocumentatie, teamnotities, alles op schijf.
- **Sessietranscripten indexeren** -- haal eerdere gesprekken terug.
- **Volledig lokaal** -- draait met de officiële llama.cpp provider-plugin en downloadt GGUF-modellen automatisch.
- **Automatische fallback** -- als QMD niet beschikbaar is, valt OpenClaw naadloos terug op de builtin engine.

## Aan de slag

### Vereisten

- Installeer QMD: `npm install -g @tobilu/qmd` of `bun install -g @tobilu/qmd`
- SQLite-build die extensies toestaat (`brew install sqlite` op macOS).
- QMD moet op de `PATH` van de gateway staan.
- macOS en Linux werken direct. Windows wordt het best ondersteund via WSL2.

### Inschakelen

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw maakt een zelfstandige QMD-home aan onder `~/.openclaw/agents/<agentId>/qmd/` en beheert de sidecar-levenscyclus automatisch -- collections, updates en embedding-runs worden voor je afgehandeld. Het geeft de voorkeur aan de huidige QMD-collection- en MCP-queryvormen, maar valt indien nodig nog steeds terug op alternatieve collection-patroonflags en oudere MCP-toolnamen. Reconciliatie tijdens het opstarten maakt ook verouderde beheerde collections opnieuw aan volgens hun canonieke patronen wanneer een oudere QMD-collection met dezelfde naam nog aanwezig is.

## Hoe de sidecar werkt

- OpenClaw maakt collections op basis van je werkruimtegeheugenbestanden en eventuele geconfigureerde `memory.qmd.paths`, en voert daarna `qmd update` uit wanneer de QMD-manager wordt geopend en periodiek daarna (standaard elke 5 minuten). Deze vernieuwingen lopen via QMD-subprocessen, niet via een in-process bestandssysteemcrawl. Semantische modi voeren ook `qmd embed` uit.
- De standaardwerkruimtecollection volgt `MEMORY.md` plus de `memory/`-boom. Kleine-letter `memory.md` wordt niet als rootgeheugenbestand geïndexeerd.
- QMD's eigen scanner negeert verborgen paden en veelgebruikte afhankelijkheids-/buildmappen zoals `.git`, `.cache`, `node_modules`, `vendor`, `dist` en `build`. Gateway-opstart initialiseert QMD standaard niet, zodat een koude start voorkomt dat de geheugenruntime wordt geïmporteerd of de langlevende watcher wordt aangemaakt voordat geheugen voor het eerst wordt gebruikt.
- Als je QMD toch bij Gateway-start wilt initialiseren, stel dan `memory.qmd.update.startup` in op `idle` of `immediate`. Met `memory.qmd.update.onBoot: true` voert het opstarten de eerste vernieuwing uit. Met `onBoot: false` slaat het opstarten die directe vernieuwing over, maar opent het nog steeds de langlevende manager wanneer update- of embed-intervallen zijn geconfigureerd, zodat QMD zijn reguliere watcher en timers kan beheren.
- Zoekopdrachten gebruiken de geconfigureerde `searchMode` (standaard: `search`; ondersteunt ook `vsearch` en `query`). `search` is alleen BM25, dus OpenClaw slaat gereedheidsprobes voor semantische vectoren en embedding-onderhoud over in die modus. Als een modus faalt, probeert OpenClaw het opnieuw met `qmd query`.
- Wanneer `searchMode` `query` is, stel `memory.qmd.rerank` in op `false` om QMD's hybride querypad zonder reranker te gebruiken. OpenClaw geeft `--no-rerank` door aan het directe QMD-CLI-pad en `rerank: false` aan QMD's MCP-querytool. Deze optie vereist QMD 2.1 of nieuwer.
- Met QMD-releases die filters voor meerdere collections adverteren, groepeert OpenClaw collections met dezelfde bron in één QMD-zoekaanroep. Oudere QMD-releases behouden de compatibele fallback per collection.
- Als QMD volledig faalt, valt OpenClaw terug op de builtin SQLite-engine. Herhaalde pogingen tijdens chatbeurten wachten kort na een openingsfout, zodat een ontbrekende binary of kapotte sidecar-afhankelijkheid geen retrystorm veroorzaakt; `openclaw memory status` en eenmalige CLI-probes controleren QMD nog steeds direct opnieuw.

<Info>
De eerste zoekopdracht kan traag zijn -- QMD downloadt GGUF-modellen (~2 GB) voor reranking en query-uitbreiding bij de eerste `qmd query`-run.
</Info>

## Zoekprestaties en compatibiliteit

OpenClaw houdt het QMD-zoekpad compatibel met zowel huidige als oudere QMD-installaties.

Bij het opstarten controleert OpenClaw de helptekst van de geïnstalleerde QMD één keer per manager. Als de binary ondersteuning adverteert voor meerdere collection-filters, doorzoekt OpenClaw alle collections met dezelfde bron met één opdracht:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dit voorkomt dat voor elke durable-memory-collection een QMD-subproces wordt gestart. Collections met sessietranscripten blijven in hun eigen brongroep, zodat gemengde `memory` + `sessions`-zoekopdrachten nog steeds input voor de resultaatdiversificatie uit beide bronnen geven.

Oudere QMD-builds accepteren slechts één collection-filter. Wanneer OpenClaw zo'n build detecteert, behoudt het het compatibiliteitspad en doorzoekt het elke collection afzonderlijk voordat resultaten worden samengevoegd en ontdubbeld.

Om het geïnstalleerde contract handmatig te inspecteren, voer je uit:

```bash
qmd --help | grep -i collection
```

De huidige QMD-help zegt dat collection-filters één of meer collections kunnen targeten. Oudere help beschrijft meestal één collection.

## Model-overrides

QMD-modelomgevingsvariabelen worden ongewijzigd doorgegeven vanuit het Gateway-proces, zodat je QMD globaal kunt afstellen zonder nieuwe OpenClaw-config toe te voegen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Voer embeddings opnieuw uit nadat je het embeddingmodel hebt gewijzigd, zodat de index overeenkomt met de nieuwe vectorruimte.

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

Snippets uit extra paden verschijnen als `qmd/<collection>/<relative-path>` in zoekresultaten. `memory_get` begrijpt dit prefix en leest uit de juiste collection-root.

## Sessietranscripten indexeren

Schakel sessie-indexering in om eerdere gesprekken terug te halen. QMD heeft zowel de algemene sessiebron `memorySearch` als de QMD-transcriptexporter nodig:

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

Transcripten worden geëxporteerd als opgeschoonde Gebruiker-/Assistent-beurten naar een toegewijde QMD-collection onder `~/.openclaw/agents/<id>/qmd/sessions/`. Alleen `memorySearch.experimental.sessionMemory` instellen exporteert geen transcripten naar QMD.

Sessietreffers worden nog steeds gefilterd door [`tools.sessions.visibility`](/nl/gateway/config-tools#toolssessions). De standaardzichtbaarheid `tree` toont geen ongerelateerde sessies van dezelfde agent. Als een door de Gateway verzonden sessie terughaalbaar moet zijn vanuit een afzonderlijke DM-sessie, stel dan bewust `tools.sessions.visibility: "agent"` in.

## Zoekbereik

Standaard worden QMD-zoekresultaten weergegeven in directe en kanaalsessies (niet in groepen). Configureer `memory.qmd.scope` om dit te wijzigen:

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

Wanneer scope een zoekopdracht weigert, logt OpenClaw een waarschuwing met het afgeleide kanaal en chattype, zodat lege resultaten makkelijker te debuggen zijn.

## Citaten

Wanneer `memory.citations` `auto` of `on` is, bevatten zoeksnippets een footer `Source: <path#line>`. Stel `memory.citations = "off"` in om de footer weg te laten terwijl het pad intern nog steeds aan de agent wordt doorgegeven.

## Wanneer gebruiken

Kies QMD wanneer je nodig hebt:

- Reranking voor resultaten van hogere kwaliteit.
- Projectdocumentatie of notities buiten de werkruimte doorzoeken.
- Eerdere sessiegesprekken terughalen.
- Volledig lokale zoekfunctie zonder API-sleutels.

Voor eenvoudigere setups werkt de [builtin engine](/nl/concepts/memory-builtin) goed zonder extra afhankelijkheden.

## Probleemoplossing

**QMD niet gevonden?** Zorg dat de binary op de `PATH` van de Gateway staat. Als OpenClaw als service draait, maak dan een symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Als `qmd --version` in je shell werkt maar OpenClaw nog steeds `spawn qmd ENOENT` meldt, heeft het Gateway-proces waarschijnlijk een andere `PATH` dan je interactieve shell. Pin de binary expliciet:

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

Gebruik `command -v qmd` in de omgeving waar QMD is geïnstalleerd, en controleer daarna opnieuw met `openclaw memory status --deep`.

**Eerste zoekopdracht erg traag?** QMD downloadt GGUF-modellen bij het eerste gebruik. Warm vooraf op met `qmd query "test"` met dezelfde XDG-mappen die OpenClaw gebruikt.

**Veel QMD-subprocessen tijdens zoeken?** Werk QMD bij als dat kan. OpenClaw gebruikt slechts één proces voor multi-collection-zoekopdrachten met dezelfde bron wanneer de geïnstalleerde QMD ondersteuning adverteert voor meerdere `-c`-filters; anders behoudt het de oudere fallback per collection voor correctheid.

**BM25-only QMD probeert nog steeds llama.cpp te bouwen?** Stel `memory.qmd.searchMode = "search"` in. OpenClaw behandelt die modus als alleen lexicaal, voert geen QMD-vectorstatusprobes of embedding-onderhoud uit, en laat semantische gereedheidscontroles over aan `vsearch`- of `query`-setups.

**Zoekopdracht time-out?** Verhoog `memory.qmd.limits.timeoutMs` (standaard: 4000 ms). Stel in op `120000` voor langzamere hardware.

**Lege resultaten in groepschats?** Controleer `memory.qmd.scope` -- de standaard staat alleen directe en kanaalsessies toe.

**Rootgeheugenzoekopdracht is plotseling te breed geworden?** Start de Gateway opnieuw of wacht op de volgende opstartreconciliatie. OpenClaw maakt verouderde beheerde collections opnieuw aan volgens canonieke `MEMORY.md`- en `memory/`-patronen wanneer het een conflict met dezelfde naam detecteert.

**Werkruimte-zichtbare tijdelijke repo's veroorzaken `ENAMETOOLONG` of kapotte indexering?** QMD-traversal volgt momenteel het gedrag van de onderliggende QMD-scanner in plaats van OpenClaw's builtin symlink-regels. Bewaar tijdelijke monorepo-checkouts onder verborgen mappen zoals `.tmp/` of buiten geïndexeerde QMD-roots totdat QMD cyclusveilige traversal of expliciete uitsluitingsopties biedt.

## Configuratie

Voor het volledige config-oppervlak (`memory.qmd.*`), zoekmodi, update-intervallen, scope-regels en alle andere instellingen, zie de [referentie voor geheugenconfiguratie](/nl/reference/memory-config).

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Builtin geheugenengine](/nl/concepts/memory-builtin)
- [Honcho-geheugen](/nl/concepts/memory-honcho)
