---
read_when:
    - Je wilt begrijpen hoe geheugen werkt
    - Je wilt weten welke geheugenbestanden je moet schrijven
summary: Hoe OpenClaw dingen onthoudt over sessies heen
title: Geheugenoverzicht
x-i18n:
    generated_at: "2026-04-29T22:38:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw onthoudt dingen door **gewone Markdown-bestanden** te schrijven in de
werkruimte van je agent. Het model "onthoudt" alleen wat op schijf wordt opgeslagen — er is geen
verborgen status.

## Hoe het werkt

Je agent heeft drie geheugengerelateerde bestanden:

- **`MEMORY.md`** — langetermijngeheugen. Duurzame feiten, voorkeuren en
  beslissingen. Wordt geladen aan het begin van elke DM-sessie.
- **`memory/YYYY-MM-DD.md`** — dagelijkse notities. Doorlopende context en observaties.
  De notities van vandaag en gisteren worden automatisch geladen.
- **`DREAMS.md`** (optioneel) — Dream Diary en samenvattingen van dreaming-sweeps
  voor menselijke beoordeling, inclusief onderbouwde historische backfill-items.

Deze bestanden staan in de werkruimte van de agent (standaard `~/.openclaw/workspace`).

<Tip>
Als je wilt dat je agent iets onthoudt, vraag het dan gewoon: "Onthoud dat ik
TypeScript verkies." Hij schrijft het naar het juiste bestand.
</Tip>

## Afgeleide verplichtingen

Sommige toekomstige follow-ups zijn geen duurzame feiten. Als je morgen een interview
noemt, kan de nuttige herinnering zijn "na het interview informeren," niet "dit
voor altijd opslaan in `MEMORY.md`."

[Verplichtingen](/nl/concepts/commitments) zijn opt-in, kortlevende follow-up-herinneringen
voor dat geval. OpenClaw leidt ze af in een verborgen achtergrondpass, beperkt ze tot
dezelfde agent en hetzelfde kanaal, en levert verschuldigde check-ins via Heartbeat.
Expliciete herinneringen blijven [geplande taken](/nl/automation/cron-jobs) gebruiken.

## Geheugentools

De agent heeft twee tools om met geheugen te werken:

- **`memory_search`** — vindt relevante notities met semantisch zoeken, zelfs wanneer
  de formulering verschilt van het origineel.
- **`memory_get`** — leest een specifiek geheugenbestand of regelbereik.

Beide tools worden geleverd door de Active Memory-Plugin (standaard: `memory-core`).

## Memory Wiki-begeleidende Plugin

Als je wilt dat duurzaam geheugen zich meer gedraagt als een onderhouden kennisbank dan
als alleen ruwe notities, gebruik dan de meegeleverde `memory-wiki`-Plugin.

`memory-wiki` compileert duurzame kennis in een wiki-kluis met:

- deterministische paginastructuur
- gestructureerde claims en bewijs
- tracking van tegenstrijdigheden en actualiteit
- gegenereerde dashboards
- gecompileerde digests voor agent-/runtime-consumenten
- wiki-eigen tools zoals `wiki_search`, `wiki_get`, `wiki_apply` en `wiki_lint`

Het vervangt de Active Memory-Plugin niet. De Active Memory-Plugin blijft
eigenaar van recall, promotie en dreaming. `memory-wiki` voegt ernaast een
provenance-rijke kennislaag toe.

Zie [Memory Wiki](/nl/plugins/memory-wiki).

## Geheugen zoeken

Wanneer een embeddingprovider is geconfigureerd, gebruikt `memory_search` **hybride
zoeken** — een combinatie van vectorovereenkomst (semantische betekenis) met trefwoordmatching
(exacte termen zoals ID's en codesymbolen). Dit werkt direct zodra je
een API-sleutel hebt voor een ondersteunde provider.

<Info>
OpenClaw detecteert je embeddingprovider automatisch op basis van beschikbare API-sleutels. Als je
een OpenAI-, Gemini-, Voyage- of Mistral-sleutel hebt geconfigureerd, wordt geheugen zoeken
automatisch ingeschakeld.
</Info>

Zie voor details over hoe zoeken werkt, afstelopties en providerconfiguratie
[Geheugen zoeken](/nl/concepts/memory-search).

## Geheugenbackends

<CardGroup cols={3}>
<Card title="Ingebouwd (standaard)" icon="database" href="/nl/concepts/memory-builtin">
Gebaseerd op SQLite. Werkt direct met trefwoordzoeken, vectorovereenkomst en
hybride zoeken. Geen extra afhankelijkheden.
</Card>
<Card title="QMD" icon="search" href="/nl/concepts/memory-qmd">
Local-first sidecar met reranking, query-uitbreiding en de mogelijkheid om
mappen buiten de werkruimte te indexeren.
</Card>
<Card title="Honcho" icon="brain" href="/nl/concepts/memory-honcho">
AI-native geheugen tussen sessies met gebruikersmodellering, semantisch zoeken en
multi-agent-bewustzijn. Plugin-installatie.
</Card>
<Card title="LanceDB" icon="layers" href="/nl/plugins/memory-lancedb">
Meegeleverd door LanceDB ondersteund geheugen met OpenAI-compatibele embeddings, automatische recall,
automatisch vastleggen en lokale Ollama-embeddingsupport.
</Card>
</CardGroup>

## Kenniswikilaag

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/nl/plugins/memory-wiki">
Compileert duurzaam geheugen in een provenance-rijke wiki-kluis met claims,
dashboards, bridge-modus en Obsidian-vriendelijke workflows.
</Card>
</CardGroup>

## Automatische geheugenflush

Voordat [Compaction](/nl/concepts/compaction) je gesprek samenvat, voert OpenClaw
een stille beurt uit die de agent eraan herinnert belangrijke context op te slaan in geheugenbestanden.
Dit staat standaard aan — je hoeft niets te configureren.

Stel een exacte modeloverride voor geheugenflush in om die huishoudelijke beurt op een lokaal model
te houden:

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

De override geldt alleen voor de geheugenflush-beurt en erft de
fallbackketen van de actieve sessie niet.

<Tip>
De geheugenflush voorkomt contextverlies tijdens Compaction. Als je agent
belangrijke feiten in het gesprek heeft die nog niet naar een bestand zijn geschreven, worden ze
automatisch opgeslagen voordat de samenvatting plaatsvindt.
</Tip>

## Dreaming

Dreaming is een optionele achtergrondconsolidatiepass voor geheugen. Het verzamelt
kortetermijnsignalen, scoort kandidaten en promoot alleen gekwalificeerde items naar
langetermijngeheugen (`MEMORY.md`).

Het is ontworpen om langetermijngeheugen hoogwaardig te houden:

- **Opt-in**: standaard uitgeschakeld.
- **Gepland**: wanneer ingeschakeld, beheert `memory-core` automatisch één terugkerende Cron-taak
  voor een volledige dreaming-sweep.
- **Met drempels**: promoties moeten slagen voor score-, recallfrequentie- en querydiversiteitsgates.
- **Beoordeelbaar**: fasesamenvattingen en dagboekitems worden naar `DREAMS.md`
  geschreven voor menselijke beoordeling.

Zie voor fasegedrag, scoringssignalen en Dream Diary-details
[Dreaming](/nl/concepts/dreaming).

## Onderbouwde backfill en live promotie

Het dreaming-systeem heeft nu twee nauw verwante beoordelingslanen:

- **Live dreaming** werkt vanuit de kortetermijn-dreaming-store onder
  `memory/.dreams/` en is wat de normale diepe fase gebruikt bij de beslissing wat
  naar `MEMORY.md` mag doorgroeien.
- **Onderbouwde backfill** leest historische `memory/YYYY-MM-DD.md`-notities als
  zelfstandige dagbestanden en schrijft gestructureerde beoordelingsoutput naar `DREAMS.md`.

Onderbouwde backfill is nuttig wanneer je oudere notities opnieuw wilt afspelen en wilt inspecteren wat
het systeem als duurzaam beschouwt zonder `MEMORY.md` handmatig te bewerken.

Wanneer je gebruikt:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

worden de onderbouwde duurzame kandidaten niet direct gepromoot. Ze worden klaargezet in
dezelfde kortetermijn-dreaming-store die de normale diepe fase al gebruikt. Dat
betekent:

- `DREAMS.md` blijft het menselijke beoordelingsoppervlak.
- de kortetermijnstore blijft het machinegerichte rankingoppervlak.
- `MEMORY.md` wordt nog steeds alleen door diepe promotie geschreven.

Als je besluit dat de replay niet nuttig was, kun je de klaargezette artefacten verwijderen
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

- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin): standaard SQLite-backend.
- [QMD-geheugenengine](/nl/concepts/memory-qmd): geavanceerde local-first sidecar.
- [Honcho-geheugen](/nl/concepts/memory-honcho): AI-native geheugen tussen sessies.
- [Memory LanceDB](/nl/plugins/memory-lancedb): door LanceDB ondersteunde Plugin met OpenAI-compatibele embeddings.
- [Memory Wiki](/nl/plugins/memory-wiki): gecompileerde kenniskluis en wiki-eigen tools.
- [Geheugen zoeken](/nl/concepts/memory-search): zoekpipeline, providers en afstemming.
- [Dreaming](/nl/concepts/dreaming): achtergrondpromotie van kortetermijnrecall naar langetermijngeheugen.
- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config): alle configuratieknoppen.
- [Compaction](/nl/concepts/compaction): hoe Compaction samenwerkt met geheugen.

## Gerelateerd

- [Active Memory](/nl/concepts/active-memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin)
- [Honcho-geheugen](/nl/concepts/memory-honcho)
- [Memory LanceDB](/nl/plugins/memory-lancedb)
- [Verplichtingen](/nl/concepts/commitments)
