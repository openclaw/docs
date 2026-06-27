---
read_when:
    - Je wilt begrijpen hoe geheugen werkt
    - Je wilt weten welke geheugenbestanden je moet schrijven
summary: Hoe OpenClaw dingen onthoudt tussen sessies
title: Geheugenoverzicht
x-i18n:
    generated_at: "2026-06-27T17:27:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw onthoudt dingen door **platte Markdown-bestanden** te schrijven in de
workspace van je agent. Het model "onthoudt" alleen wat op schijf wordt opgeslagen — er is geen
verborgen status.

## Hoe het werkt

Je agent heeft drie geheugengerelateerde bestanden:

- **`MEMORY.md`** — langetermijngeheugen. Duurzame feiten, voorkeuren en
  beslissingen. Wordt geladen aan het begin van elke DM-sessie.
- **`memory/YYYY-MM-DD.md`** (of **`memory/YYYY-MM-DD-<slug>.md`**) — dagelijkse notities.
  Lopende context en observaties. De notities van vandaag en gisteren worden
  automatisch geladen, en slug-varianten zoals die door de gebundelde
  session-memory-hook bij `/new` of `/reset` worden geschreven, worden nu naast het
  bestand met alleen de datum meegenomen.
- **`DREAMS.md`** (optioneel) — Dream Diary en samenvattingen van dreaming-sweeps
  voor menselijke beoordeling, inclusief gefundeerde historische backfill-items.

Deze bestanden staan in de agent-workspace (standaard `~/.openclaw/workspace`).

## Wat hoort waar

`MEMORY.md` is de compacte, samengestelde laag. Gebruik het voor duurzame feiten,
voorkeuren, vaste beslissingen en korte samenvattingen die beschikbaar moeten zijn
aan het begin van een hoofdprivésessie. Het is niet bedoeld als ruw transcript,
dagelijks logboek of volledig archief.

`memory/YYYY-MM-DD.md`-bestanden zijn de werklaag. Gebruik ze voor gedetailleerde dagelijkse
notities, observaties, sessiesamenvattingen en ruwe context die later nog nuttig kan zijn.
Deze bestanden worden geïndexeerd voor `memory_search` en `memory_get`, maar ze worden
niet bij elke beurt in de normale bootstrap-prompt geïnjecteerd.

Na verloop van tijd wordt verwacht dat de agent nuttig materiaal uit dagelijkse notities
distilleert naar `MEMORY.md` en verouderde langetermijnitems verwijdert. De gegenereerde
workspace-instructies en Heartbeat-flow kunnen dat periodiek doen; je hoeft
`MEMORY.md` niet handmatig te bewerken voor elk detail dat onthouden moet worden.

Als `MEMORY.md` groter wordt dan het bootstrap-bestandsbudget, houdt OpenClaw het bestand
intact op schijf, maar kapt het de kopie af die in de modelcontext wordt geïnjecteerd.
Zie dat als een signaal om gedetailleerd materiaal terug te verplaatsen naar `memory/*.md`,
alleen de duurzame samenvatting in `MEMORY.md` te houden, of de bootstrap-limieten te
verhogen als je expliciet meer promptbudget wilt besteden. Gebruik `/context list`,
`/context detail` of `openclaw doctor` om ruwe versus geïnjecteerde groottes en
afkapstatus te zien.

<Tip>
Als je wilt dat je agent iets onthoudt, vraag het dan gewoon: "Onthoud dat ik
TypeScript prefereer." De agent schrijft het naar het juiste bestand.
</Tip>

## Actiegevoelige herinneringen

De meeste herinneringen kunnen als gewone Markdown-notities worden geschreven. Maar sommige herinneringen beïnvloeden wat de agent later moet doen. Leg daarvoor vast wanneer het veilig is om op de notitie te handelen, niet alleen het feit zelf.

Leg die actiegrens vast wanneer een notitie gaat over:

- vereisten voor goedkeuring of toestemming,
- tijdelijke beperkingen,
- overdrachten naar een andere sessie, thread of persoon,
- verloopvoorwaarden,
- timing waarop handelen veilig is,
- autoriteit van bron of eigenaar,
- instructies om een verleidelijke actie te vermijden.

Een nuttige actiegevoelige herinnering maakt duidelijk:

- wat toekomstig gedrag verandert,
- wanneer of onder welke voorwaarde dit geldt,
- wanneer het verloopt, of wat actie vrijgeeft,
- wat de agent moet vermijden,
- wie de bron of eigenaar is, als dat vertrouwen of autoriteit beïnvloedt.

Geheugen kan goedkeuringscontext bewaren, maar het dwingt geen beleid af. Gebruik OpenClaw-goedkeuringsinstellingen, sandboxing en geplande taken voor harde operationele controles.

Voorbeeld:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Nog een voorbeeld:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Gebruik [commitments](/nl/concepts/commitments) voor afgeleide, kortdurende follow-ups. Gebruik [scheduled tasks](/nl/automation/cron-jobs) voor exacte herinneringen, getimede controles en terugkerend werk. Geheugen kan nog steeds de duurzame context rond beide paden samenvatten.

Dit is geen verplicht schema voor elke herinnering. Simpele feiten kunnen beknopt blijven. Gebruik actiegevoelige grenzen wanneer verlies van timing, autoriteit, verloop of context waarin handelen veilig is ertoe kan leiden dat de agent later het verkeerde doet.

## Afgeleide commitments

Sommige toekomstige follow-ups zijn geen duurzame feiten. Als je morgen een interview
noemt, is de nuttige herinnering mogelijk "check in na het interview", niet "sla
dit voor altijd op in `MEMORY.md`."

[Commitments](/nl/concepts/commitments) zijn opt-in, kortdurende follow-upherinneringen
voor dat geval. OpenClaw leidt ze af in een verborgen achtergrondpass, begrenst ze tot
dezelfde agent en hetzelfde kanaal, en levert verschuldigde check-ins via Heartbeat.
Expliciete herinneringen blijven [scheduled tasks](/nl/automation/cron-jobs) gebruiken.

## Geheugentools

De agent heeft twee tools om met geheugen te werken:

- **`memory_search`** — vindt relevante notities met semantische zoekopdrachten, zelfs wanneer
  de formulering afwijkt van het origineel.
- **`memory_get`** — leest een specifiek geheugenbestand of regelbereik.

Beide tools worden geleverd door de actieve geheugen-Plugin (standaard: `memory-core`).

## Memory Wiki-begeleidende Plugin

Als je wilt dat duurzaam geheugen zich meer gedraagt als een onderhouden kennisbank dan
alleen als ruwe notities, gebruik dan de gebundelde `memory-wiki`-Plugin.

`memory-wiki` compileert duurzame kennis naar een wiki-kluis met:

- deterministische paginastructuur
- gestructureerde claims en bewijs
- tracking van tegenspraak en actualiteit
- gegenereerde dashboards
- gecompileerde digests voor agent-/runtime-consumenten
- wiki-native tools zoals `wiki_search`, `wiki_get`, `wiki_apply` en `wiki_lint`

Het vervangt de actieve geheugen-Plugin niet. De actieve geheugen-Plugin blijft
verantwoordelijk voor recall, promotie en Dreaming. `memory-wiki` voegt ernaast een
kennislaag met rijke herkomstinformatie toe.

Zie [Memory Wiki](/nl/plugins/memory-wiki).

## Geheugenzoekopdrachten

Wanneer een embeddingprovider is geconfigureerd, gebruikt `memory_search` **hybride
zoeken** — een combinatie van vectorovereenkomst (semantische betekenis) met trefwoordmatching
(exacte termen zoals ID's en codesymbolen). Dit werkt direct zodra je
een API-sleutel hebt voor een ondersteunde provider.

<Info>
OpenClaw gebruikt standaard OpenAI-embeddings. Stel
`agents.defaults.memorySearch.provider` expliciet in om Gemini, Voyage,
Mistral, lokaal, Ollama, Bedrock, GitHub Copilot of OpenAI-compatibele
embeddings te gebruiken.
</Info>

Zie [Memory Search](/nl/concepts/memory-search) voor details over hoe zoeken werkt,
afstelopties en providerconfiguratie.

## Geheugenbackends

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/nl/concepts/memory-builtin">
Gebaseerd op SQLite. Werkt direct met trefwoordzoekopdrachten, vectorovereenkomst en
hybride zoeken. Geen extra afhankelijkheden.
</Card>
<Card title="QMD" icon="search" href="/nl/concepts/memory-qmd">
Local-first sidecar met reranking, query-uitbreiding en de mogelijkheid om
directories buiten de workspace te indexeren.
</Card>
<Card title="Honcho" icon="brain" href="/nl/concepts/memory-honcho">
AI-native cross-session-geheugen met gebruikersmodellering, semantisch zoeken en
bewustzijn van meerdere agents. Plugin-installatie.
</Card>
<Card title="LanceDB" icon="layers" href="/nl/plugins/memory-lancedb">
Gebundeld door LanceDB ondersteund geheugen met OpenAI-compatibele embeddings, auto-recall,
auto-capture en ondersteuning voor lokale Ollama-embeddings.
</Card>
</CardGroup>

## Kenniswikilaag

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/nl/plugins/memory-wiki">
Compileert duurzaam geheugen naar een wiki-kluis met rijke herkomstinformatie, met claims,
dashboards, bridge-modus en Obsidian-vriendelijke workflows.
</Card>
</CardGroup>

## Automatische geheugenflush

Voordat [Compaction](/nl/concepts/compaction) je gesprek samenvat, voert OpenClaw
een stille beurt uit die de agent eraan herinnert belangrijke context op te slaan in
geheugenbestanden. Dit staat standaard aan — je hoeft niets te configureren.

Om die opschoonbeurt op een lokaal model te houden, stel je een exacte override voor het
memory-flush-model in:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

De override geldt alleen voor de memory-flush-beurt en erft de
fallbackketen van de actieve sessie niet.

<Tip>
De geheugenflush voorkomt contextverlies tijdens Compaction. Als je agent
belangrijke feiten in het gesprek heeft die nog niet naar een bestand zijn geschreven, worden die
automatisch opgeslagen voordat de samenvatting plaatsvindt.
</Tip>

## Dreaming

Dreaming is een optionele achtergrondconsolidatiepass voor geheugen. Het verzamelt
kortetermijnsignalen, scoort kandidaten en promoveert alleen gekwalificeerde items naar
langetermijngeheugen (`MEMORY.md`).

Het is ontworpen om langetermijngeheugen signaalrijk te houden:

- **Opt-in**: standaard uitgeschakeld.
- **Gepland**: wanneer ingeschakeld, beheert `memory-core` automatisch één terugkerende Cron-taak
  voor een volledige dreaming-sweep.
- **Met drempels**: promoties moeten slagen voor poorten voor score, recallfrequentie en
  querydiversiteit.
- **Beoordeelbaar**: fasesamenvattingen en dagboekitems worden naar `DREAMS.md` geschreven
  voor menselijke beoordeling.

Zie [Dreaming](/nl/concepts/dreaming) voor fasegedrag, scoringssignalen en details over Dream Diary.

## Gefundeerde backfill en live promotie

Het Dreaming-systeem heeft nu twee nauw verwante beoordelingslanes:

- **Live dreaming** werkt vanuit de kortetermijn-dreaming-store onder
  `memory/.dreams/` en is wat de normale diepe fase gebruikt wanneer wordt bepaald wat
  naar `MEMORY.md` mag doorstromen.
- **Gefundeerde backfill** leest historische `memory/YYYY-MM-DD.md`-notities als
  zelfstandige dagbestanden en schrijft gestructureerde beoordelingsoutput naar `DREAMS.md`.

Gefundeerde backfill is nuttig wanneer je oudere notities opnieuw wilt afspelen en wilt inspecteren wat
het systeem duurzaam vindt zonder `MEMORY.md` handmatig te bewerken.

Wanneer je het volgende gebruikt:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

worden de gefundeerde duurzame kandidaten niet rechtstreeks gepromoveerd. Ze worden gefaseerd in
dezelfde kortetermijn-dreaming-store die de normale diepe fase al gebruikt. Dat
betekent:

- `DREAMS.md` blijft het menselijke beoordelingsoppervlak.
- de kortetermijn-store blijft het machinegerichte rangschikkingsoppervlak.
- `MEMORY.md` wordt nog steeds alleen door diepe promotie geschreven.

Als je besluit dat de replay niet nuttig was, kun je de gefaseerde artefacten verwijderen
zonder gewone dagboekitems of normale recall-status aan te raken:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Verder lezen

- [Builtin memory engine](/nl/concepts/memory-builtin): standaard SQLite-backend.
- [QMD memory engine](/nl/concepts/memory-qmd): geavanceerde local-first sidecar.
- [Honcho memory](/nl/concepts/memory-honcho): AI-native cross-session-geheugen.
- [Memory LanceDB](/nl/plugins/memory-lancedb): door LanceDB ondersteunde Plugin met OpenAI-compatibele embeddings.
- [Memory Wiki](/nl/plugins/memory-wiki): gecompileerde kenniskluis en wiki-native tools.
- [Memory search](/nl/concepts/memory-search): zoekpipeline, providers en afstemming.
- [Dreaming](/nl/concepts/dreaming): achtergrondpromotie van kortetermijn-recall naar langetermijngeheugen.
- [Memory configuration reference](/nl/reference/memory-config): alle configuratieknoppen.
- [Compaction](/nl/concepts/compaction): hoe Compaction samenwerkt met geheugen.

## Gerelateerd

- [Active memory](/nl/concepts/active-memory)
- [Memory search](/nl/concepts/memory-search)
- [Builtin memory engine](/nl/concepts/memory-builtin)
- [Honcho memory](/nl/concepts/memory-honcho)
- [Memory LanceDB](/nl/plugins/memory-lancedb)
- [Commitments](/nl/concepts/commitments)
