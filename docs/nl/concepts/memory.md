---
read_when:
    - Je wilt begrijpen hoe het geheugen werkt
    - Je wilt weten welke geheugenbestanden je moet schrijven
summary: Hoe OpenClaw informatie tussen sessies onthoudt
title: Geheugenoverzicht
x-i18n:
    generated_at: "2026-07-12T08:46:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw onthoudt dingen door gewone Markdown-bestanden in de werkruimte van je agent te schrijven (standaard `~/.openclaw/workspace`). Het model onthoudt alleen wat op schijf wordt opgeslagen; er is geen verborgen status.

## Hoe het werkt

Je agent heeft drie geheugengerelateerde bestanden:

- **`MEMORY.md`** — langetermijngeheugen. Blijvende feiten, voorkeuren en beslissingen. Wordt aan het begin van een sessie geladen.
- **`memory/YYYY-MM-DD.md`** (of `memory/YYYY-MM-DD-<slug>.md`) — dagelijkse notities. Doorlopende context en observaties. De gedateerde notities van vandaag en gisteren worden automatisch geladen bij een kale `/new` of `/reset`; varianten met een slug, zoals die welke door de meegeleverde sessiegeheugenhook worden geschreven, worden samen met het bestand met alleen de datum opgehaald.
- **`DREAMS.md`** (optioneel) — droomdagboek en samenvattingen van dreaming-rondes voor menselijke beoordeling, inclusief historisch onderbouwde aanvullingen.

<Tip>
Als je wilt dat je agent iets onthoudt, vraag je het gewoon: "Onthoud dat ik de voorkeur geef aan TypeScript." De agent schrijft de notitie naar het juiste bestand.
</Tip>

## Wat waar thuishoort

`MEMORY.md` is de compacte, zorgvuldig samengestelde laag: blijvende feiten, voorkeuren, vaste beslissingen en korte samenvattingen die aan het begin van een sessie beschikbaar moeten zijn. Het is geen onbewerkt transcript, dagelijks logboek of volledig archief.

`memory/YYYY-MM-DD.md`-bestanden vormen de werklaag: gedetailleerde dagelijkse notities, observaties, sessiesamenvattingen en onbewerkte context die later nog nuttig kunnen zijn. Deze worden geïndexeerd voor `memory_search` en `memory_get`, maar niet bij elke beurt in de bootstrap-prompt ingevoegd.

Na verloop van tijd destilleert de agent nuttig materiaal uit dagelijkse notities naar `MEMORY.md` en verwijdert die verouderde langetermijnvermeldingen. Gegenereerde werkruimte-instructies en de Heartbeat-stroom doen dit periodiek; je hoeft `MEMORY.md` niet voor elk detail handmatig te bewerken.

Als `MEMORY.md` het budget voor bootstrap-bestanden overschrijdt, behoudt OpenClaw het bestand intact op schijf, maar kapt het de kopie af die in de context wordt ingevoegd. Beschouw dat als een signaal om gedetailleerd materiaal naar `memory/*.md` te verplaatsen, alleen een blijvende samenvatting in `MEMORY.md` te bewaren of de bootstrap-limieten te verhogen als je meer promptbudget wilt gebruiken. Gebruik `/context list`, `/context detail` of `openclaw doctor` om de onbewerkte en ingevoegde grootten en de afkapstatus te bekijken.

## Actiegevoelige herinneringen

De meeste herinneringen zijn gewone Markdown-notities. Sommige beïnvloeden wat de agent later moet doen; leg daarbij vast wanneer het veilig is om naar de notitie te handelen, niet alleen het feit zelf.

Leg die actiegrens vast wanneer een notitie betrekking heeft op:

- vereisten voor goedkeuring of toestemming,
- tijdelijke beperkingen,
- overdrachten naar een andere sessie, thread of persoon,
- vervalvoorwaarden,
- het moment waarop veilig kan worden gehandeld,
- de autoriteit van de bron of eigenaar,
- instructies om een verleidelijke actie te vermijden.

Een nuttige actiegevoelige herinnering maakt duidelijk:

- wat toekomstig gedrag verandert,
- wanneer of onder welke voorwaarde dit van toepassing is,
- wanneer dit vervalt of wat handelen mogelijk maakt,
- wat de agent niet moet doen,
- wie de bron of eigenaar is, als dat van invloed is op vertrouwen of autoriteit.

Het geheugen kan de context van een goedkeuring bewaren, maar dwingt geen beleid af. Gebruik de goedkeuringsinstellingen, sandboxing en geplande taken van OpenClaw voor harde operationele beheersmaatregelen.

Voorbeeld:

```md
De API-migratie wordt in een andere sessie ontworpen. Toekomstige beurten mogen
de API-implementatie niet vanuit deze thread bewerken; gebruik de bevindingen
hier alleen als ontwerpinput totdat het migratieplan is opgeleverd.
```

Nog een voorbeeld:

```md
Een rapport van een niet-vertrouwde bron moet worden beoordeeld voordat het
wordt gepromoveerd. Toekomstige beurten moeten het alleen als bewijs behandelen;
sla het niet op als blijvende herinnering totdat een vertrouwde beoordelaar de
inhoud bevestigt.
```

Dit is geen verplicht schema voor elke herinnering; eenvoudige feiten kunnen beknopt blijven. Gebruik actiegevoelige grenzen wanneer het verlies van timing, autoriteit, vervalgegevens of context over wanneer veilig kan worden gehandeld ertoe kan leiden dat de agent later het verkeerde doet.

Gebruik [toezeggingen](/nl/concepts/commitments) voor afgeleide, kortstondige vervolgacties. Gebruik [geplande taken](/nl/automation/cron-jobs) voor exacte herinneringen, tijdgebonden controles en terugkerend werk. Het geheugen kan nog steeds de blijvende context rond beide paden samenvatten.

## Afgeleide toezeggingen

Sommige toekomstige vervolgacties zijn geen blijvende feiten. Als je vermeldt dat je morgen een sollicitatiegesprek hebt, kan de nuttige herinnering "vraag na het gesprek hoe het ging" zijn, en niet "bewaar dit voor altijd in `MEMORY.md`."

[Toezeggingen](/nl/concepts/commitments) zijn optionele, kortstondige herinneringen aan vervolgacties voor dat geval. OpenClaw leidt ze af tijdens een verborgen achtergrondronde, beperkt ze tot dezelfde agent en hetzelfde kanaal en levert verschuldigde controlevragen via Heartbeat. Expliciete herinneringen gebruiken nog steeds [geplande taken](/nl/automation/cron-jobs).

## Geheugenhulpmiddelen

De agent heeft twee hulpmiddelen om met het geheugen te werken:

- **`memory_search`** — vindt relevante notities met semantisch zoeken, zelfs wanneer de formulering afwijkt van het origineel.
- **`memory_get`** — leest een specifiek geheugenbestand of regelbereik.

Beide hulpmiddelen worden geleverd door de actieve geheugenplugin (standaard: `memory-core`).

## Zoeken in het geheugen

Wanneer een inbeddingsprovider is geconfigureerd, gebruikt `memory_search` hybride zoeken: vectorovereenkomst (semantische betekenis) gecombineerd met trefwoordovereenkomst (exacte termen zoals ID's en codesymbolen). Dit werkt direct met een API-sleutel voor elke ondersteunde provider.

<Info>
OpenClaw gebruikt standaard inbeddingen van OpenAI. Stel `agents.defaults.memorySearch.provider` expliciet in om Gemini, Voyage, Mistral, Bedrock, DeepInfra, lokale GGUF, Ollama, LM Studio, GitHub Copilot of een algemeen OpenAI-compatibel eindpunt te gebruiken.
</Info>

Zie [Zoeken in het geheugen](/nl/concepts/memory-search) voor de werking van zoeken, afstemmingsopties en het instellen van providers.

## Geheugenbackends

<CardGroup cols={3}>
<Card title="Ingebouwd (standaard)" icon="database" href="/nl/concepts/memory-builtin">
Gebaseerd op SQLite. Werkt direct met zoeken op trefwoorden, vectorovereenkomst en hybride zoeken. Geen extra afhankelijkheden.
</Card>
<Card title="QMD" icon="search" href="/nl/concepts/memory-qmd">
Lokale sidecar met herrangschikking, query-uitbreiding en de mogelijkheid om mappen buiten de werkruimte te indexeren.
</Card>
<Card title="Honcho" icon="brain" href="/nl/concepts/memory-honcho">
AI-native geheugen voor meerdere sessies, met gebruikersmodellering, semantisch zoeken en bewustzijn van meerdere agents. Plugin-installatie.
</Card>
<Card title="LanceDB" icon="layers" href="/nl/plugins/memory-lancedb">
Door LanceDB ondersteund geheugen met OpenAI-compatibele inbeddingen, automatisch ophalen, automatisch vastleggen en ondersteuning voor lokale Ollama-inbeddingen. Plugin-installatie.
</Card>
</CardGroup>

## Kenniswikilaag

Als je wilt dat blijvend geheugen zich meer gedraagt als een onderhouden kennisbank dan als onbewerkte notities, gebruik je de meegeleverde Plugin `memory-wiki`. Deze compileert blijvende kennis naar een wikikluis met een deterministische paginastructuur, gestructureerde beweringen en bewijzen, bijhouden van tegenstrijdigheden en actualiteit, gegenereerde dashboards, gecompileerde samenvattingen en wikispecifieke hulpmiddelen (`wiki_status`, `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` vervangt de actieve geheugenplugin niet; de actieve geheugenplugin blijft verantwoordelijk voor ophalen, promoveren en dreaming. `memory-wiki` voegt daarnaast een kennislaag met uitgebreide herkomstinformatie toe.

<CardGroup cols={1}>
<Card title="Geheugenwiki" icon="book" href="/nl/plugins/memory-wiki">
Compileert blijvend geheugen naar een wikikluis met uitgebreide herkomstinformatie, beweringen, dashboards, brugmodus en Obsidian-vriendelijke workflows.
</Card>
</CardGroup>

## Automatisch geheugen wegschrijven

Voordat [Compaction](/nl/concepts/compaction) je gesprek samenvat, voert OpenClaw een stille beurt uit die de agent eraan herinnert belangrijke context in geheugenbestanden op te slaan. Dit is standaard ingeschakeld; stel `agents.defaults.compaction.memoryFlush.enabled: false` in om het uit te schakelen.

Om die onderhoudsbeurt op een lokaal model uit te voeren, stel je een exacte overschrijving in die alleen op de beurt voor het wegschrijven van het geheugen van toepassing is (deze neemt de keten met reservemodellen van het actieve sessiemodel niet over):

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

<Tip>
Het wegschrijven van het geheugen voorkomt contextverlies tijdens Compaction. Als je agent belangrijke feiten uit het gesprek nog niet naar een bestand heeft geschreven, worden deze automatisch opgeslagen voordat de samenvatting plaatsvindt.
</Tip>

## Dreaming

Dreaming is een optionele consolidatieronde op de achtergrond voor het geheugen. Deze verzamelt signalen voor kortetermijnherinneringen, kent scores toe aan kandidaten en promoveert alleen geschikte items naar het langetermijngeheugen (`MEMORY.md`):

- **Optioneel**: standaard uitgeschakeld.
- **Gepland**: wanneer dit is ingeschakeld, beheert `memory-core` automatisch één terugkerende Cron-taak voor een volledige dreaming-ronde.
- **Met drempelwaarden**: promoties moeten voldoen aan poorten voor score, ophaalfrequentie en querydiversiteit.
- **Beoordeelbaar**: fasesamenvattingen en dagboekvermeldingen worden naar `DREAMS.md` geschreven voor menselijke beoordeling.

Zie [Dreaming](/nl/concepts/dreaming) voor het gedrag per fase, scoresignalen en details over het droomdagboek.

## Onderbouwde historische aanvulling en livepromotie

Het dreamingsysteem heeft twee gerelateerde beoordelingstrajecten:

- **Live dreaming** werkt vanuit de kortetermijnopslag voor dreaming onder `memory/.dreams/` en wordt door de normale diepe fase gebruikt om te bepalen wat naar `MEMORY.md` promoveert.
- **Onderbouwde historische aanvulling** leest historische notities in `memory/YYYY-MM-DD.md` als zelfstandige dagbestanden en schrijft gestructureerde beoordelingsuitvoer naar `DREAMS.md`.

Onderbouwde historische aanvulling is nuttig om oudere notities opnieuw te verwerken en te bekijken wat het systeem als blijvend beschouwt, zonder `MEMORY.md` handmatig te bewerken.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

De vlag `--stage-short-term` plaatst onderbouwde kandidaten voor blijvend geheugen in dezelfde kortetermijnopslag voor dreaming die de normale diepe fase al gebruikt; de kandidaten worden niet rechtstreeks gepromoveerd. Dus:

- `DREAMS.md` blijft het beoordelingsoppervlak voor mensen.
- De kortetermijnopslag blijft het rangschikkingsoppervlak voor machines.
- `MEMORY.md` wordt nog steeds alleen door diepe promotie geschreven.

Een herverwerking ongedaan maken zonder gewone dagboekvermeldingen of de normale ophaalstatus te wijzigen:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Indexstatus en provider controleren
openclaw memory search "query"  # Zoeken vanaf de opdrachtregel
openclaw memory index --force   # De index opnieuw opbouwen
```

## Verder lezen

- [Zoeken in het geheugen](/nl/concepts/memory-search): zoekpijplijn, providers en afstemming.
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin): standaard SQLite-backend.
- [QMD-geheugenengine](/nl/concepts/memory-qmd): geavanceerde lokale sidecar.
- [Honcho-geheugen](/nl/concepts/memory-honcho): AI-native geheugen voor meerdere sessies.
- [LanceDB-geheugen](/nl/plugins/memory-lancedb): door LanceDB ondersteunde Plugin met OpenAI-compatibele inbeddingen.
- [Geheugenwiki](/nl/plugins/memory-wiki): gecompileerde kenniskluis en wikispecifieke hulpmiddelen.
- [Dreaming](/nl/concepts/dreaming): promotie op de achtergrond van kortetermijnherinneringen naar langetermijngeheugen.
- [Configuratiereferentie voor geheugen](/nl/reference/memory-config): alle configuratieopties.
- [Compaction](/nl/concepts/compaction): hoe Compaction samenwerkt met het geheugen.
- [Active Memory](/nl/concepts/active-memory): geheugen van subagents voor interactieve chatsessies.
