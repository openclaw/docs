---
read_when:
    - Je wilt begrijpen welke hulpmiddelen OpenClaw biedt
    - Je moet hulpmiddelen configureren, toestaan of weigeren
    - Je kiest tussen ingebouwde tools, Skills en plugins
summary: 'Overzicht van OpenClaw-tools en plugins: wat de agent kan doen en hoe je deze kunt uitbreiden'
title: Hulpmiddelen en plugins
x-i18n:
    generated_at: "2026-05-02T20:59:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

Alles wat de agent doet naast het genereren van tekst gebeurt via **tools**.
Tools zijn hoe de agent bestanden leest, opdrachten uitvoert, op het web surft, berichten
verstuurt en met apparaten communiceert.

## Tools, Skills en plugins

OpenClaw heeft drie lagen die samenwerken:

<Steps>
  <Step title="Tools zijn wat de agent aanroept">
    Een tool is een getypeerde functie die de agent kan aanroepen (bijv. `exec`, `browser`,
    `web_search`, `message`). OpenClaw levert een set **ingebouwde tools** en
    plugins kunnen aanvullende tools registreren.

    De agent ziet tools als gestructureerde functiedefinities die naar de model-API worden gestuurd.

  </Step>

  <Step title="Skills leren de agent wanneer en hoe">
    Een Skill is een Markdown-bestand (`SKILL.md`) dat in de systeemprompt wordt geïnjecteerd.
    Skills geven de agent context, beperkingen en stapsgewijze richtlijnen om
    tools effectief te gebruiken. Skills staan in je werkruimte, in gedeelde mappen,
    of worden meegeleverd in plugins.

    [Skills-naslag](/nl/tools/skills) | [Skills maken](/nl/tools/creating-skills)

  </Step>

  <Step title="Plugins bundelen alles samen">
    Een plugin is een pakket dat elke combinatie van mogelijkheden kan registreren:
    kanalen, modelproviders, tools, Skills, spraak, realtime transcriptie,
    realtime spraak, media-inzicht, beeldgeneratie, videogeneratie,
    web ophalen, web zoeken en meer. Sommige plugins zijn **kernplugins** (meegeleverd met
    OpenClaw), andere zijn **extern** (door de community gepubliceerd op npm).

    [Plugins installeren en configureren](/nl/tools/plugin) | [Bouw je eigen plugin](/nl/plugins/building-plugins)

  </Step>
</Steps>

## Ingebouwde tools

Deze tools worden met OpenClaw meegeleverd en zijn beschikbaar zonder plugins te installeren:

| Tool                                       | Wat deze doet                                                        | Pagina                                                       |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shellopdrachten uitvoeren, achtergrondprocessen beheren              | [Exec](/nl/tools/exec), [Exec-goedkeuringen](/nl/tools/exec-approvals) |
| `code_execution`                           | Gesandboxte externe Python-analyse uitvoeren                         | [Code-uitvoering](/nl/tools/code-execution)                    |
| `browser`                                  | Een Chromium-browser besturen (navigeren, klikken, screenshot maken) | [Browser](/nl/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Het web doorzoeken, X-berichten doorzoeken, pagina-inhoud ophalen    | [Web](/nl/tools/web), [Web ophalen](/nl/tools/web-fetch)           |
| `read` / `write` / `edit`                  | Bestands-I/O in de werkruimte                                        |                                                              |
| `apply_patch`                              | Bestandspatches met meerdere hunks                                   | [Patch toepassen](/nl/tools/apply-patch)                       |
| `message`                                  | Berichten via alle kanalen verzenden                                 | [Agent verzenden](/nl/tools/agent-send)                        |
| `canvas`                                   | Node Canvas aansturen (presenteren, evalueren, snapshot maken)       |                                                              |
| `nodes`                                    | Gekoppelde apparaten ontdekken en targeten                           |                                                              |
| `cron` / `gateway`                         | Geplande taken beheren; de Gateway inspecteren, patchen, herstarten of bijwerken |                                                              |
| `image` / `image_generate`                 | Afbeeldingen analyseren of genereren                                 | [Beeldgeneratie](/nl/tools/image-generation)                   |
| `music_generate`                           | Muziektracks genereren                                               | [Muziekgeneratie](/nl/tools/music-generation)                  |
| `video_generate`                           | Video's genereren                                                    | [Videogeneratie](/nl/tools/video-generation)                   |
| `tts`                                      | Eenmalige tekst-naar-spraakconversie                                 | [TTS](/nl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sessiebeheer, status en orkestratie van subagents                    | [Subagents](/nl/tools/subagents)                               |
| `session_status`                           | Lichte `/status`-achtige terugmelding en modeloverride voor sessie   | [Sessietools](/nl/concepts/session-tool)                       |

Gebruik voor beeldwerk `image` voor analyse en `image_generate` voor generatie of bewerking. Als je `openai/*`, `google/*`, `fal/*` of een andere niet-standaard beeldprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor muziekwerk `music_generate`. Als je `google/*`, `minimax/*` of een andere niet-standaard muziekprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor videowerk `video_generate`. Als je `qwen/*` of een andere niet-standaard videoprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor workflowgestuurde audiogeneratie `music_generate` wanneer een plugin zoals
ComfyUI deze registreert. Dit staat los van `tts`, dat tekst-naar-spraak is.

`session_status` is de lichte status-/terugmeldingstool in de sessiegroep.
Deze beantwoordt `/status`-achtige vragen over de huidige sessie en kan
optioneel een modeloverride per sessie instellen; `model=default` wist die
override. Net als `/status` kan deze schaarse token-/cachetellers en het
actieve runtimemodellabel aanvullen vanuit de nieuwste gebruiksvermelding in het transcript.

`gateway` is de runtime-tool alleen voor eigenaren voor Gateway-bewerkingen:

- `config.schema.lookup` voor één padgescopeerde configuratiesubtree vóór bewerkingen
- `config.get` voor de huidige configuratiesnapshot + hash
- `config.patch` voor gedeeltelijke configuratie-updates met herstart
- `config.apply` alleen voor volledige configuratievervanging
- `update.run` voor expliciete zelfupdate + herstart

Geef voor gedeeltelijke wijzigingen de voorkeur aan `config.schema.lookup` en daarna `config.patch`. Gebruik
`config.apply` alleen wanneer je bewust de volledige configuratie vervangt.
Lees voor bredere configuratiedocumentatie [Configuratie](/nl/gateway/configuration) en
[Configuratienaslag](/nl/gateway/configuration-reference).
De tool weigert ook `tools.exec.ask` of `tools.exec.security` te wijzigen;
verouderde aliassen van `tools.bash.*` worden genormaliseerd naar dezelfde beschermde exec-paden.

### Door plugins geleverde tools

Plugins kunnen aanvullende tools registreren. Enkele voorbeelden:

- [Diffs](/nl/tools/diffs) — diffviewer en renderer
- [LLM-taak](/nl/tools/llm-task) — LLM-stap met alleen JSON voor gestructureerde uitvoer
- [Lobster](/nl/tools/lobster) — getypeerde workflow-runtime met hervatbare goedkeuringen
- [Muziekgeneratie](/nl/tools/music-generation) — gedeelde `music_generate`-tool met workflow-backed providers
- [OpenProse](/nl/prose) — Markdown-eerst workfloworkestratie
- [Tokenjuice](/nl/tools/tokenjuice) — compacte ruisrijke resultaten van `exec`- en `bash`-tools

Plugin-tools worden nog steeds gemaakt met `api.registerTool(...)` en gedeclareerd in
de lijst `contracts.tools` van het pluginmanifest. OpenClaw legt de gevalideerde
tooldescriptor vast tijdens discovery en cachet deze per pluginbron en contract, zodat
latere toolplanning het laden van de plugin-runtime kan overslaan. Tooluitvoering laadt nog steeds
de eigenaar-plugin en roept de live geregistreerde implementatie aan.

## Toolconfiguratie

### Toestaan- en weigerenlijsten

Bepaal welke tools de agent mag aanroepen via `tools.allow` / `tools.deny` in
de configuratie. Weigeren wint altijd van toestaan.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw faalt gesloten wanneer een expliciete allowlist geen aanroepbare tools oplevert.
Bijvoorbeeld: `tools.allow: ["query_db"]` werkt alleen als een geladen plugin daadwerkelijk
`query_db` registreert. Als geen ingebouwde tool, plugin of gebundelde MCP-tool overeenkomt met de
allowlist, stopt de run vóór de modelaanroep in plaats van door te gaan als een
alleen-tekst-run die toolresultaten zou kunnen hallucineren.

### Toolprofielen

`tools.profile` stelt een basis-allowlist in voordat `allow`/`deny` wordt toegepast.
Override per agent: `agents.list[].tools.profile`.

| Profiel     | Wat het bevat                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Onbeperkte basis voor bredere toegang tot opdracht/besturing; hetzelfde als `tools.profile` niet instellen                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Alleen `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` is bewust smal voor kanaalgerichte
agents. Het laat bredere tools voor opdracht/besturing weg, zoals bestandssysteem, runtime,
browser, canvas, nodes, Cron en Gateway-besturing. Gebruik `tools.profile: "full"`
als de onbeperkte basis voor bredere toegang tot opdracht/besturing, en beperk daarna
toegang met `tools.allow` / `tools.deny` wanneer nodig.
</Note>

`coding` bevat lichte webtools (`web_search`, `web_fetch`, `x_search`)
maar niet de volledige browserbesturingstool. Browserautomatisering kan echte
sessies en ingelogde profielen aansturen, dus voeg deze expliciet toe met
`tools.alsoAllow: ["browser"]` of een per-agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Het configureren van `tools.exec` of `tools.fs` onder een restrictief profiel (`messaging`, `minimal`) verbreedt de allowlist van het profiel niet impliciet. Voeg expliciete `tools.alsoAllow`-items toe (bijvoorbeeld `["exec", "process"]` voor exec, of `["read", "write", "edit"]` voor fs) wanneer je wilt dat een restrictief profiel die geconfigureerde secties gebruikt. OpenClaw logt bij het opstarten een waarschuwing wanneer een configuratiesectie aanwezig is zonder overeenkomende `alsoAllow`-toekenning.
</Note>

De profielen `coding` en `messaging` staan ook geconfigureerde bundle-MCP-tools toe
onder de pluginsleutel `bundle-mcp`. Voeg `tools.deny: ["bundle-mcp"]` toe wanneer je
wilt dat een profiel zijn normale ingebouwde tools behoudt maar alle geconfigureerde MCP-tools verbergt.
Het profiel `minimal` bevat geen bundle-MCP-tools.

Voorbeeld (standaard het breedste tooloppervlak):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Toolgroepen

Gebruik `group:*`-afkortingen in toestaan-/weigerenlijsten:

| Groep              | Hulpmiddelen                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wordt geaccepteerd als alias voor `exec`)                           |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle ingebouwde OpenClaw-hulpmiddelen (exclusief plugin-hulpmiddelen)                                     |

`sessions_history` retourneert een begrensde, op veiligheid gefilterde weergave voor herinnering. Het verwijdert
denktags, `<relevant-memories>`-raamwerk, XML-payloads voor toolaanroepen in platte tekst
(waaronder `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` en afgekorte blokken met toolaanroepen),
gedegradeerd raamwerk voor toolaanroepen, gelekte ASCII-/volledige-breedte-modelbesturingstokens
en misvormde MiniMax-XML voor toolaanroepen uit assistenttekst, en past vervolgens
redactie/afkapping en mogelijke tijdelijke aanduidingen voor te grote rijen toe in plaats van te fungeren
als een ruwe transcriptdump.

### Providerspecifieke beperkingen

Gebruik `tools.byProvider` om hulpmiddelen voor specifieke providers te beperken zonder
globale standaardinstellingen te wijzigen:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
