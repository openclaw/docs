---
read_when:
    - Je wilt begrijpen hoe geheugen werkt
    - Je wilt weten welke geheugenbestanden je moet schrijven
summary: Hoe OpenClaw dingen onthoudt tussen sessies
title: Geheugenoverzicht
x-i18n:
    generated_at: "2026-05-10T19:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw onthoudt dingen door **platte Markdown-bestanden** te schrijven in de
workspace van je agent. Het model "onthoudt" alleen wat op schijf wordt
opgeslagen — er is geen verborgen status.

## Hoe het werkt

Je agent heeft drie geheugengerelateerde bestanden:

- **`MEMORY.md`** — langetermijngeheugen. Duurzame feiten, voorkeuren en
  beslissingen. Geladen aan het begin van elke DM-sessie.
- **`memory/YYYY-MM-DD.md`** — dagelijkse notities. Doorlopende context en observaties.
  De notities van vandaag en gisteren worden automatisch geladen.
- **`DREAMS.md`** (optioneel) — Dream Diary en samenvattingen van dreaming-sweeps
  voor menselijke beoordeling, inclusief onderbouwde historische backfill-vermeldingen.

Deze bestanden staan in de agent-workspace (standaard `~/.openclaw/workspace`).

## Wat waar hoort

`MEMORY.md` is de compacte, beheerde laag. Gebruik het voor duurzame feiten,
voorkeuren, vaste beslissingen en korte samenvattingen die beschikbaar moeten zijn
aan het begin van een hoofd-privésessie. Het is niet bedoeld als ruwe transcriptie,
dagelijks logboek of uitputtend archief.

`memory/YYYY-MM-DD.md`-bestanden zijn de werklaag. Gebruik ze voor gedetailleerde dagelijkse
notities, observaties, sessiesamenvattingen en ruwe context die later nog nuttig kan zijn.
Deze bestanden worden geïndexeerd voor `memory_search` en `memory_get`, maar ze worden
niet bij elke beurt in de normale bootstrap-prompt geïnjecteerd.

Na verloop van tijd wordt verwacht dat de agent nuttig materiaal uit dagelijkse notities
destilleert naar `MEMORY.md` en verouderde langetermijnvermeldingen verwijdert. De gegenereerde
workspace-instructies en Heartbeat-flow kunnen dat periodiek doen; je hoeft `MEMORY.md`
niet handmatig te bewerken voor elk onthouden detail.

Als `MEMORY.md` boven het budget voor bootstrap-bestanden groeit, houdt OpenClaw het bestand
op schijf intact, maar kapt de kopie af die in de modelcontext wordt geïnjecteerd. Zie dat als
een signaal om gedetailleerd materiaal terug te verplaatsen naar `memory/*.md`, alleen de
duurzame samenvatting in `MEMORY.md` te bewaren, of de bootstrap-limieten te verhogen als je
expliciet meer promptbudget wilt besteden. Gebruik `/context list`, `/context detail` of
`openclaw doctor` om ruwe versus geïnjecteerde groottes en afkapstatus te zien.

<Tip>
Als je wilt dat je agent iets onthoudt, vraag het dan gewoon: "Onthoud dat ik
TypeScript verkies." De agent schrijft het naar het juiste bestand.
</Tip>

## Afgeleide toezeggingen

Sommige toekomstige opvolgingen zijn geen duurzame feiten. Als je morgen een sollicitatiegesprek
noemt, kan de nuttige herinnering zijn: "navragen na het gesprek", niet "dit voor altijd opslaan
in `MEMORY.md`."

[Commitments](/nl/concepts/commitments) zijn opt-in, kortlevende opvolgherinneringen
voor dat geval. OpenClaw leidt ze af in een verborgen achtergrondpass, beperkt ze tot
dezelfde agent en hetzelfde kanaal, en levert verschuldigde check-ins via Heartbeat.
Expliciete herinneringen gebruiken nog steeds [geplande taken](/nl/automation/cron-jobs).

## Geheugentools

De agent heeft twee tools om met geheugen te werken:

- **`memory_search`** — vindt relevante notities met semantisch zoeken, zelfs wanneer
  de formulering afwijkt van het origineel.
- **`memory_get`** — leest een specifiek geheugenbestand of regelbereik.

Beide tools worden geleverd door de actieve geheugenplugin (standaard: `memory-core`).

## Memory Wiki-begeleidende plugin

Als je wilt dat duurzaam geheugen zich meer gedraagt als een onderhouden kennisbank dan
alleen als ruwe notities, gebruik dan de meegeleverde `memory-wiki`-plugin.

`memory-wiki` compileert duurzame kennis in een wiki-kluis met:

- deterministische paginastructuur
- gestructureerde claims en bewijs
- tracking van tegenstrijdigheden en actualiteit
- gegenereerde dashboards
- gecompileerde samenvattingen voor agent-/runtime-consumenten
- wiki-native tools zoals `wiki_search`, `wiki_get`, `wiki_apply` en `wiki_lint`

Het vervangt de actieve geheugenplugin niet. De actieve geheugenplugin blijft eigenaar
van ophalen, promotie en Dreaming. `memory-wiki` voegt er een kennislaag met rijke
herkomstgegevens naast toe.

Zie [Memory Wiki](/nl/plugins/memory-wiki).

## Geheugen zoeken

Wanneer een embedding-provider is geconfigureerd, gebruikt `memory_search` **hybride
zoeken** — een combinatie van vectorovereenkomst (semantische betekenis) en trefwoordmatching
(exacte termen zoals ID's en codesymbolen). Dit werkt direct zodra je een API-sleutel hebt
voor een ondersteunde provider.

<Info>
OpenClaw detecteert je embedding-provider automatisch op basis van beschikbare API-sleutels. Als je
een OpenAI-, Gemini-, Voyage- of Mistral-sleutel hebt geconfigureerd, wordt geheugen zoeken
automatisch ingeschakeld.
</Info>

Zie [Memory Search](/nl/concepts/memory-search) voor details over hoe zoeken werkt,
afstemmingsopties en providerinstelling.

## Geheugenbackends

<CardGroup cols={3}>
<Card title="Ingebouwd (standaard)" icon="database" href="/nl/concepts/memory-builtin">
Gebaseerd op SQLite. Werkt direct met trefwoordzoeken, vectorovereenkomst en
hybride zoeken. Geen extra afhankelijkheden.
</Card>
<Card title="QMD" icon="search" href="/nl/concepts/memory-qmd">
Local-first sidecar met herrangschikking, query-uitbreiding en de mogelijkheid om
mappen buiten de workspace te indexeren.
</Card>
<Card title="Honcho" icon="brain" href="/nl/concepts/memory-honcho">
AI-native cross-sessiegeheugen met gebruikersmodellering, semantisch zoeken en
multi-agent-bewustzijn. Plugininstallatie.
</Card>
<Card title="LanceDB" icon="layers" href="/nl/plugins/memory-lancedb">
Meegeleverd LanceDB-onderbouwd geheugen met OpenAI-compatibele embeddings, automatisch ophalen,
automatisch vastleggen en ondersteuning voor lokale Ollama-embeddings.
</Card>
</CardGroup>

## Kenniswiki-laag

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/nl/plugins/memory-wiki">
Compileert duurzaam geheugen in een wiki-kluis met rijke herkomstgegevens, claims,
dashboards, bridge-modus en Obsidian-vriendelijke workflows.
</Card>
</CardGroup>

## Automatische geheugenflush

Voordat [Compaction](/nl/concepts/compaction) je gesprek samenvat, voert OpenClaw
een stille beurt uit die de agent eraan herinnert belangrijke context op te slaan in geheugenbestanden.
Dit staat standaard aan — je hoeft niets te configureren.

Stel een exacte model-override voor geheugenflush in om die onderhoudsbeurt op een lokaal model te houden:

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
kortetermijnsignalen, scoort kandidaten en promoveert alleen gekwalificeerde items naar
langetermijngeheugen (`MEMORY.md`).

Het is ontworpen om langetermijngeheugen zeer signaalrijk te houden:

- **Opt-in**: standaard uitgeschakeld.
- **Gepland**: wanneer ingeschakeld, beheert `memory-core` automatisch één terugkerende cronjob
  voor een volledige dreaming-sweep.
- **Met drempels**: promoties moeten slagen voor score-, ophaalfrequentie- en querydiversiteitsgates.
- **Beoordeelbaar**: fasesamenvattingen en dagboekvermeldingen worden naar `DREAMS.md`
  geschreven voor menselijke beoordeling.

Zie [Dreaming](/nl/concepts/dreaming) voor fasegedrag, scoringssignalen en details over Dream Diary.

## Onderbouwde backfill en live promotie

Het dreamingsysteem heeft nu twee nauw verwante beoordelingslanen:

- **Live dreaming** werkt vanuit de kortetermijn-dreamingstore onder
  `memory/.dreams/` en is wat de normale diepe fase gebruikt wanneer wordt besloten wat
  naar `MEMORY.md` kan promoveren.
- **Onderbouwde backfill** leest historische `memory/YYYY-MM-DD.md`-notities als
  zelfstandige dagbestanden en schrijft gestructureerde beoordelingsoutput naar `DREAMS.md`.

Onderbouwde backfill is nuttig wanneer je oudere notities opnieuw wilt afspelen en wilt inspecteren wat
het systeem duurzaam vindt zonder `MEMORY.md` handmatig te bewerken.

Wanneer je dit gebruikt:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

worden de onderbouwde duurzame kandidaten niet rechtstreeks gepromoveerd. Ze worden klaargezet in
dezelfde kortetermijn-dreamingstore die de normale diepe fase al gebruikt. Dat betekent:

- `DREAMS.md` blijft het oppervlak voor menselijke beoordeling.
- de kortetermijnstore blijft het rangschikkingsoppervlak voor de machine.
- `MEMORY.md` wordt nog steeds alleen geschreven door diepe promotie.

Als je besluit dat de replay niet nuttig was, kun je de klaargezette artefacten verwijderen
zonder gewone dagboekvermeldingen of normale ophaalstatus aan te raken:

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
- [Honcho-geheugen](/nl/concepts/memory-honcho): AI-native cross-sessiegeheugen.
- [Memory LanceDB](/nl/plugins/memory-lancedb): LanceDB-onderbouwde plugin met OpenAI-compatibele embeddings.
- [Memory Wiki](/nl/plugins/memory-wiki): gecompileerde kennisvault en wiki-native tools.
- [Memory search](/nl/concepts/memory-search): zoekpipeline, providers en afstemming.
- [Dreaming](/nl/concepts/dreaming): achtergrondpromotie van kortetermijnherinnering naar langetermijngeheugen.
- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config): alle configuratieknoppen.
- [Compaction](/nl/concepts/compaction): hoe Compaction samenwerkt met geheugen.

## Gerelateerd

- [Active Memory](/nl/concepts/active-memory)
- [Memory search](/nl/concepts/memory-search)
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin)
- [Honcho-geheugen](/nl/concepts/memory-honcho)
- [Memory LanceDB](/nl/plugins/memory-lancedb)
- [Commitments](/nl/concepts/commitments)
