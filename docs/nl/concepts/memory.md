---
read_when:
    - Je wilt begrijpen hoe het geheugen werkt
    - Je wilt weten welke geheugenbestanden je moet schrijven
summary: Hoe OpenClaw dingen tussen sessies onthoudt
title: Geheugenoverzicht
x-i18n:
    generated_at: "2026-07-16T15:31:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw onthoudt dingen door gewone Markdown-bestanden te schrijven in de
workspace van je agent (standaard `~/.openclaw/workspace`). Het model onthoudt alleen wat
op schijf wordt opgeslagen; er is geen verborgen toestand.

## Hoe het werkt

Je agent heeft drie geheugengerelateerde bestanden:

- **`MEMORY.md`** — langetermijngeheugen. Duurzame feiten, voorkeuren en
  beslissingen. Wordt aan het begin van een sessie geladen.
- **`memory/YYYY-MM-DD.md`** (of `memory/YYYY-MM-DD-<slug>.md`) — dagelijkse notities.
  Doorlopende context en observaties. De gedateerde notities van vandaag en gisteren worden
  automatisch geladen bij een kale `/new` of `/reset`; varianten met een slug, zoals die
  welke door de meegeleverde session-memory-hook worden geschreven, worden samen met het
  bestand met alleen de datum opgehaald.
- **`DREAMS.md`** (optioneel) — Droomdagboek en samenvattingen van dreaming-rondes voor
  menselijke beoordeling, inclusief onderbouwde historische aanvullingen.

<Tip>
Als je wilt dat je agent iets onthoudt, vraag je het gewoon: "Onthoud dat ik
de voorkeur geef aan TypeScript." De agent schrijft de notitie naar het juiste bestand.
</Tip>

## Wat waar hoort

`MEMORY.md` is de compacte, zorgvuldig samengestelde laag: duurzame feiten, voorkeuren, permanente
beslissingen en korte samenvattingen die aan het begin van een sessie beschikbaar
moeten zijn. Het is geen onbewerkt transcript, dagelijks logboek of volledig archief.

`memory/YYYY-MM-DD.md`-bestanden vormen de werklaag: gedetailleerde dagelijkse notities,
observaties, sessiesamenvattingen en onbewerkte context die later nog nuttig kan
zijn. Deze worden geïndexeerd voor `memory_search` en `memory_get`, maar worden niet
bij elke beurt in de bootstrap-prompt geïnjecteerd.

Na verloop van tijd destilleert de agent nuttig materiaal uit dagelijkse notities naar
`MEMORY.md` en verwijdert verouderde langetermijnvermeldingen. Gegenereerde workspace-
instructies en de Heartbeat-stroom doen dit periodiek; je hoeft
`MEMORY.md` niet voor elk detail handmatig te bewerken.

Als `MEMORY.md` het budget voor bootstrap-bestanden overschrijdt, laat OpenClaw het bestand
op schijf intact, maar kapt het de kopie af die in de context wordt geïnjecteerd. Beschouw dat als een
signaal om gedetailleerd materiaal naar `memory/*.md` te verplaatsen, alleen een duurzame
samenvatting in `MEMORY.md` te bewaren of de bootstrap-limieten te verhogen als je meer
promptbudget wilt besteden. Gebruik `/context list`, `/context detail` of `openclaw doctor` om
de onbewerkte en geïnjecteerde groottes en de afkapstatus te bekijken.

## Importeren uit codeerassistenten

De Control UI kan bestaand lokaal geheugen uit Codex en Claude Code importeren.
Open **Settings** → **Import Memory**, kies de doelagent, controleer de
gevonden bestanden en bevestig de import. OpenClaw kopieert alleen Markdown-geheugen:

- Codex: de samengevoegde bestanden `MEMORY.md` en `memory_summary.md` onder
  `~/.codex/memories` (of `CODEX_HOME/memories`). Onbewerkte rollout- en transcript-
  bestanden worden niet geïmporteerd.
- Claude Code: Markdown-bestanden uit de automatische geheugenmap van elk project onder
  `~/.claude/projects/*/memory`, plus een door de gebruiker geconfigureerde
  `autoMemoryDirectory` indien aanwezig. Projectinstructies, sessies, instellingen
  en inloggegevens maken geen deel uit van deze uitsluitend op geheugen gerichte actie.

Geïmporteerde bestanden blijven afzonderlijk onder `memory/imports/codex/` en
`memory/imports/claude-code/` in de workspace van de geselecteerde agent. Ze worden geïndexeerd
voor `memory_search` en zijn beschikbaar via `memory_get`; ze worden niet samengevoegd met
de bootstrap-`MEMORY.md` van de agent. De bronbestanden blijven ongewijzigd.

Het voorbeeld markeert conflicten op de bestemming. Schakel **Replace existing imports** in om
die bestanden te vervangen; bij toepassen wordt een geverifieerde back-up van vóór de import gemaakt en
worden kopieën per item van overschreven bestanden in het migratierapport bewaard.

## Actiegevoelige herinneringen

De meeste herinneringen zijn gewone Markdown-notities. Sommige beïnvloeden wat de agent
later moet doen; leg daarvoor vast wanneer het veilig is om op de notitie te handelen, en niet alleen
het feit zelf.

Leg die actiegrens vast wanneer een notitie betrekking heeft op:

- vereisten voor goedkeuring of toestemming,
- tijdelijke beperkingen,
- overdrachten naar een andere sessie, thread of persoon,
- vervalvoorwaarden,
- het moment waarop handelen veilig is,
- bevoegdheid van de bron of eigenaar,
- instructies om een verleidelijke actie te vermijden.

Een nuttige actiegevoelige herinnering maakt duidelijk:

- wat toekomstig gedrag verandert,
- wanneer of onder welke voorwaarde dit geldt,
- wanneer dit vervalt of wat handelen mogelijk maakt,
- wat de agent niet moet doen,
- wie de bron of eigenaar is, als dat invloed heeft op vertrouwen of bevoegdheid.

Het geheugen kan goedkeuringscontext bewaren, maar dwingt geen beleid af. Gebruik
de goedkeuringsinstellingen, sandboxing en geplande taken van OpenClaw voor harde
operationele controles.

Voorbeeld:

```md
De API-migratie wordt in een andere sessie ontworpen. Toekomstige beurten mogen
de API-implementatie niet vanuit deze thread bewerken; gebruik bevindingen hier alleen als
ontwerpinvoer totdat het migratieplan is ingevoerd.
```

Nog een voorbeeld:

```md
Een rapport van een niet-vertrouwde bron moet worden beoordeeld voordat het wordt bevorderd. Toekomstige beurten
moeten het alleen als bewijs behandelen; sla het niet op als duurzaam geheugen totdat een
vertrouwde beoordelaar de inhoud bevestigt.
```

Dit is geen verplicht schema voor elke herinnering; eenvoudige feiten kunnen beknopt blijven.
Gebruik actiegevoelige grenzen wanneer verlies van timing, bevoegdheid, verval of
context voor veilig handelen ertoe kan leiden dat de agent later het verkeerde doet.

Gebruik [toezeggingen](/nl/concepts/commitments) voor afgeleide, kortdurende vervolgacties.
Gebruik [geplande taken](/nl/automation/cron-jobs) voor exacte herinneringen, tijdgebonden controles
en terugkerend werk. Het geheugen kan nog steeds de duurzame context rond
beide paden samenvatten.

## Afgeleide toezeggingen

Sommige toekomstige vervolgacties zijn geen duurzame feiten. Als je een sollicitatiegesprek
morgen noemt, kan de nuttige herinnering "neem na het sollicitatiegesprek contact op" zijn, en niet "sla
dit voor altijd op in `MEMORY.md`."

[Toezeggingen](/nl/concepts/commitments) zijn optionele, kortdurende vervolg-
herinneringen voor dat geval. OpenClaw leidt ze af in een verborgen achtergrondstap,
beperkt ze tot dezelfde agent en hetzelfde kanaal en levert opeisbare contactmomenten via
Heartbeat. Expliciete herinneringen gebruiken nog steeds [geplande taken](/nl/automation/cron-jobs).

## Geheugenhulpmiddelen

De agent heeft twee hulpmiddelen om met geheugen te werken:

- **`memory_search`** — vindt relevante notities via semantisch zoeken, zelfs wanneer
  de formulering afwijkt van het origineel.
- **`memory_get`** — leest een specifiek geheugenbestand of regelbereik.

Beide hulpmiddelen worden geleverd door de actieve geheugenplugin (standaard: `memory-core`).

## Zoeken in het geheugen

Wanneer een embeddingprovider is geconfigureerd, gebruikt `memory_search` hybride zoekopdrachten:
vectorovereenkomst (semantische betekenis) gecombineerd met trefwoordovereenkomst (exacte
termen zoals ID's en codesymbolen). Dit werkt direct met een API-sleutel
voor elke ondersteunde provider.

<Info>
OpenClaw gebruikt standaard OpenAI-embeddings. Stel
`agents.defaults.memorySearch.provider` expliciet in om Gemini, Voyage,
Mistral, Bedrock, DeepInfra, lokale GGUF, Ollama, LM Studio, GitHub Copilot of
een generiek OpenAI-compatibel eindpunt te gebruiken.
</Info>

Zie [Zoeken in het geheugen](/nl/concepts/memory-search) voor hoe zoeken werkt, afstemmings-
opties en het instellen van providers.

## Geheugenbackends

<CardGroup cols={3}>
<Card title="Ingebouwd (standaard)" icon="database" href="/nl/concepts/memory-builtin">
Gebaseerd op SQLite. Werkt direct met zoeken op trefwoorden, vectorovereenkomst en
hybride zoekopdrachten. Geen extra afhankelijkheden.
</Card>
<Card title="QMD" icon="search" href="/nl/concepts/memory-qmd">
Local-first sidecar met herrangschikking, query-uitbreiding en de mogelijkheid om
mappen buiten de workspace te indexeren.
</Card>
<Card title="Honcho" icon="brain" href="/nl/concepts/memory-honcho">
AI-native geheugen voor meerdere sessies met gebruikersmodellering, semantisch zoeken en
bewustzijn van meerdere agents. Installatie van Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/nl/plugins/memory-lancedb">
Door LanceDB ondersteund geheugen met OpenAI-compatibele embeddings, automatisch ophalen,
automatisch vastleggen en ondersteuning voor lokale Ollama-embeddings. Installatie van Plugin.
</Card>
</CardGroup>

## Kenniswiki-laag

Als je wilt dat duurzaam geheugen zich meer gedraagt als een onderhouden kennisbank
dan als onbewerkte notities, gebruik je de meegeleverde Plugin `memory-wiki`. Deze compileert duurzame
kennis naar een wiki-kluis met een deterministische paginastructuur, gestructureerde
beweringen en bewijs, bijhouden van tegenstrijdigheden en actualiteit, gegenereerde
dashboards, gecompileerde samenvattingen en wiki-eigen hulpmiddelen (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` vervangt de actieve geheugenplugin niet; de actieve geheugen-
plugin blijft verantwoordelijk voor ophalen, bevorderen en dreaming. `memory-wiki` voegt er
een kennislaag met rijke herkomstgegevens naast toe.

<CardGroup cols={1}>
<Card title="Geheugenwiki" icon="book" href="/nl/plugins/memory-wiki">
Compileert duurzaam geheugen naar een wiki-kluis met rijke herkomstgegevens, beweringen,
dashboards, bridge-modus en Obsidian-vriendelijke werkstromen.
</Card>
</CardGroup>

## Automatisch geheugen opslaan

Voordat [Compaction](/nl/concepts/compaction) je gesprek samenvat,
voert OpenClaw een stille beurt uit die de agent eraan herinnert belangrijke context
in geheugenbestanden op te slaan. Dit staat standaard aan; stel
`agents.defaults.compaction.memoryFlush.enabled: false` in om het uit te schakelen.

Om die onderhoudsbeurt op een lokaal model uit te voeren, stel je een exacte overschrijving in die
alleen geldt voor de geheugenopslagbeurt (deze neemt de keten van fallbackmodellen van de actieve
sessie niet over):

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
Het opslaan van geheugen voorkomt contextverlies tijdens Compaction. Als je agent
belangrijke feiten in het gesprek heeft die nog niet naar een bestand zijn geschreven, worden deze
automatisch opgeslagen voordat de samenvatting plaatsvindt.
</Tip>

## Dreaming

Dreaming is een optionele consolidatiestap voor geheugen op de achtergrond. Deze verzamelt
kortdurende ophaalsignalen, beoordeelt kandidaten en bevordert alleen geschikte
items naar het langetermijngeheugen (`MEMORY.md`):

- **Optioneel**: standaard uitgeschakeld.
- **Gepland**: indien ingeschakeld, beheert `memory-core` automatisch één terugkerende Cron-
  taak voor een volledige dreaming-ronde.
- **Met drempelwaarden**: bevorderingen moeten voldoen aan drempels voor score, ophaalfrequentie en
  querydiversiteit.
- **Beoordeelbaar**: fasesamenvattingen en dagboekvermeldingen worden naar
  `DREAMS.md` geschreven voor menselijke beoordeling.

Zie [Dreaming](/nl/concepts/dreaming) voor fasegedrag, scoresignalen en
details over het Droomdagboek.

## Onderbouwde aanvulling en livebevordering

Het dreamingsysteem heeft twee gerelateerde beoordelingspaden:

- **Live dreaming** werkt vanuit de kortdurende dreamingopslag onder
  `memory/.dreams/` en wordt door de normale diepe fase gebruikt om te bepalen wat
  doorgaat naar `MEMORY.md`.
- **Onderbouwde aanvulling** leest historische `memory/YYYY-MM-DD.md`-notities als
  zelfstandige dagbestanden en schrijft gestructureerde beoordelingsuitvoer naar `DREAMS.md`.

Onderbouwde aanvulling is nuttig om oudere notities opnieuw af te spelen en te onderzoeken wat het
systeem als duurzaam beschouwt, zonder `MEMORY.md` handmatig te bewerken.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

De vlag `--stage-short-term` plaatst onderbouwde duurzame kandidaten in dezelfde
kortdurende dreamingopslag die de normale diepe fase al gebruikt; de kandidaten worden niet
rechtstreeks bevorderd. Dus:

- `DREAMS.md` blijft het oppervlak voor menselijke beoordeling.
- De kortdurende opslag blijft het machinegerichte rangschikkingsoppervlak.
- `MEMORY.md` wordt nog steeds alleen door diepe bevordering geschreven.

Om opnieuw afspelen ongedaan te maken zonder gewone dagboekvermeldingen of de normale ophaal-
toestand te wijzigen:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Controleer de indexstatus en provider
openclaw memory search "query"  # Zoek vanaf de opdrachtregel
openclaw memory index --force   # Bouw de index opnieuw op
```

## Verder lezen

- [Geheugen doorzoeken](/nl/concepts/memory-search): zoekpijplijn, providers en afstemming.
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin): standaard SQLite-backend.
- [QMD-geheugenengine](/nl/concepts/memory-qmd): geavanceerde local-first-sidecar.
- [Honcho-geheugen](/nl/concepts/memory-honcho): AI-native geheugen voor meerdere sessies.
- [Memory LanceDB](/nl/plugins/memory-lancedb): door LanceDB ondersteunde plugin met OpenAI-compatibele embeddings.
- [Memory Wiki](/nl/plugins/memory-wiki): gecompileerde kennisopslag en wiki-native tools.
- [Dreaming](/nl/concepts/dreaming): achtergrondpromotie van kortetermijnherinneringen naar langetermijngeheugen.
- [Configuratiereferentie voor geheugen](/nl/reference/memory-config): alle configuratieopties.
- [Compaction](/nl/concepts/compaction): hoe Compaction samenwerkt met het geheugen.
- [Active Memory](/nl/concepts/active-memory): geheugen van subagents voor interactieve chatsessies.
