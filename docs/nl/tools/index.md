---
read_when:
    - Je wilt begrijpen welke tools OpenClaw biedt
    - Je moet hulpmiddelen configureren, toestaan of weigeren
    - Je kiest tussen ingebouwde tools, Skills en plugins
summary: 'Overzicht van OpenClaw-hulpmiddelen en plugins: wat de agent kan doen en hoe je deze kunt uitbreiden'
title: Hulpmiddelen en plugins
x-i18n:
    generated_at: "2026-04-30T16:30:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

Alles wat de agent doet naast het genereren van tekst gebeurt via **tools**.
Tools zijn hoe de agent bestanden leest, opdrachten uitvoert, op het web browset, berichten
verstuurt en met apparaten communiceert.

## Tools, Skills en plugins

OpenClaw heeft drie lagen die samenwerken:

<Steps>
  <Step title="Tools zijn wat de agent aanroept">
    Een tool is een getypeerde functie die de agent kan aanroepen (bijv. `exec`, `browser`,
    `web_search`, `message`). OpenClaw levert een set **ingebouwde tools** en
    plugins kunnen extra tools registreren.

    De agent ziet tools als gestructureerde functiedefinities die naar de model-API worden verzonden.

  </Step>

  <Step title="Skills leren de agent wanneer en hoe">
    Een skill is een markdownbestand (`SKILL.md`) dat in de systeemprompt wordt geïnjecteerd.
    Skills geven de agent context, beperkingen en stapsgewijze begeleiding voor
    het effectief gebruiken van tools. Skills staan in je werkruimte, in gedeelde mappen,
    of worden meegeleverd in plugins.

    [Skills-naslag](/nl/tools/skills) | [Skills maken](/nl/tools/creating-skills)

  </Step>

  <Step title="Plugins bundelen alles samen">
    Een Plugin is een pakket dat elke combinatie van mogelijkheden kan registreren:
    kanalen, modelproviders, tools, Skills, spraak, realtime transcriptie,
    realtime stem, mediabegrip, afbeeldingsgeneratie, videogeneratie,
    web fetch, webzoekopdrachten en meer. Sommige plugins zijn **core** (meegeleverd met
    OpenClaw), andere zijn **extern** (door de community gepubliceerd op npm).

    [Plugins installeren en configureren](/nl/tools/plugin) | [Bouw je eigen](/nl/plugins/building-plugins)

  </Step>
</Steps>

## Ingebouwde tools

Deze tools worden met OpenClaw meegeleverd en zijn beschikbaar zonder plugins te installeren:

| Tool                                       | Wat het doet                                                          | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shellopdrachten uitvoeren, achtergrondprocessen beheren               | [Exec](/nl/tools/exec), [Exec-goedkeuringen](/nl/tools/exec-approvals) |
| `code_execution`                           | Gesandboxte externe Python-analyse uitvoeren                          | [Code-uitvoering](/nl/tools/code-execution)                    |
| `browser`                                  | Een Chromium-browser bedienen (navigeren, klikken, schermafbeelding)  | [Browser](/nl/tools/browser)                                   |
| `web_search` / `x_search` / `web_fetch`    | Het web doorzoeken, X-berichten doorzoeken, pagina-inhoud ophalen     | [Web](/nl/tools/web), [Web Fetch](/nl/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Bestands-I/O in de werkruimte                                         |                                                              |
| `apply_patch`                              | Bestandswijzigingen met meerdere hunks                                | [Patch toepassen](/nl/tools/apply-patch)                       |
| `message`                                  | Berichten verzenden via alle kanalen                                  | [Agent Send](/nl/tools/agent-send)                             |
| `canvas`                                   | Node Canvas aansturen (presenteren, evalueren, snapshot maken)        |                                                              |
| `nodes`                                    | Gekoppelde apparaten ontdekken en targeten                            |                                                              |
| `cron` / `gateway`                         | Geplande taken beheren; de Gateway inspecteren, patchen, herstarten of bijwerken |                                                    |
| `image` / `image_generate`                 | Afbeeldingen analyseren of genereren                                  | [Afbeeldingsgeneratie](/nl/tools/image-generation)             |
| `music_generate`                           | Muziektracks genereren                                                | [Muziekgeneratie](/nl/tools/music-generation)                  |
| `video_generate`                           | Video's genereren                                                     | [Videogeneratie](/nl/tools/video-generation)                   |
| `tts`                                      | Eenmalige tekst-naar-spraak-conversie                                 | [TTS](/nl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sessiebeheer, status en subagent-orkestratie                          | [Subagenten](/nl/tools/subagents)                              |
| `session_status`                           | Lichtgewicht `/status`-achtige teruglezing en sessiemodel-override    | [Sessietools](/nl/concepts/session-tool)                       |

Voor afbeeldingswerk gebruik je `image` voor analyse en `image_generate` voor generatie of bewerking. Als je `openai/*`, `google/*`, `fal/*` of een andere niet-standaard afbeeldingsprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Voor muziekwerk gebruik je `music_generate`. Als je `google/*`, `minimax/*` of een andere niet-standaard muziekprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Voor videowerk gebruik je `video_generate`. Als je `qwen/*` of een andere niet-standaard videoprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Voor workflowgestuurde audiogeneratie gebruik je `music_generate` wanneer een Plugin zoals
ComfyUI dit registreert. Dit staat los van `tts`, dat tekst-naar-spraak is.

`session_status` is de lichtgewicht status-/terugleestool in de sessiegroep.
Deze beantwoordt `/status`-achtige vragen over de huidige sessie en kan
optioneel een model-override per sessie instellen; `model=default` wist die
override. Net als `/status` kan deze schaarse token-/cachetellers en het
actieve runtime-modellabel aanvullen vanuit de nieuwste transcript-gebruiksvermelding.

`gateway` is de runtime-tool alleen voor eigenaars voor Gateway-bewerkingen:

- `config.schema.lookup` voor één padgebonden config-subtree vóór bewerkingen
- `config.get` voor de huidige config-snapshot + hash
- `config.patch` voor gedeeltelijke config-updates met herstart
- `config.apply` alleen voor volledige config-vervanging
- `update.run` voor expliciete zelfupdate + herstart

Voor gedeeltelijke wijzigingen geef je de voorkeur aan `config.schema.lookup` en daarna `config.patch`. Gebruik
`config.apply` alleen wanneer je bewust de volledige config vervangt.
Voor bredere config-documentatie lees je [Configuratie](/nl/gateway/configuration) en
[Configuratienaslag](/nl/gateway/configuration-reference).
De tool weigert ook om `tools.exec.ask` of `tools.exec.security` te wijzigen;
legacy `tools.bash.*`-aliassen normaliseren naar dezelfde beschermde exec-paden.

### Door plugins geleverde tools

Plugins kunnen extra tools registreren. Enkele voorbeelden:

- [Diffs](/nl/tools/diffs) — diffviewer en renderer
- [LLM-taak](/nl/tools/llm-task) — JSON-only LLM-stap voor gestructureerde output
- [Lobster](/nl/tools/lobster) — getypeerde workflow-runtime met hervatbare goedkeuringen
- [Muziekgeneratie](/nl/tools/music-generation) — gedeelde `music_generate`-tool met workflow-backed providers
- [OpenProse](/nl/prose) — markdown-eerst workfloworkestratie
- [Tokenjuice](/nl/tools/tokenjuice) — compacte ruisige `exec`- en `bash`-toolresultaten

## Toolconfiguratie

### Toestaan- en weigerenlijsten

Bepaal welke tools de agent kan aanroepen via `tools.allow` / `tools.deny` in
config. Weigeren wint altijd van toestaan.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw faalt gesloten wanneer een expliciete allowlist geen aanroepbare tools oplevert.
Bijvoorbeeld, `tools.allow: ["query_db"]` werkt alleen als een geladen Plugin daadwerkelijk
`query_db` registreert. Als geen ingebouwde, Plugin- of gebundelde MCP-tool overeenkomt met de
allowlist, stopt de run vóór de modelaanroep in plaats van door te gaan als een
tekst-only run die toolresultaten zou kunnen hallucineren.

### Toolprofielen

`tools.profile` stelt een basis-allowlist in voordat `allow`/`deny` wordt toegepast.
Override per agent: `agents.list[].tools.profile`.

| Profiel     | Wat het bevat                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Onbeperkte basis voor bredere opdracht-/besturingstoegang; hetzelfde als `tools.profile` niet instellen                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Alleen `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` is bewust smal voor kanaalgerichte
agents. Het laat bredere opdracht-/besturingstools weg, zoals bestandssysteem, runtime,
browser, canvas, nodes, Cron en Gateway-besturing. Gebruik `tools.profile: "full"`
als de onbeperkte basis voor bredere opdracht-/besturingstoegang, en beperk daarna
toegang met `tools.allow` / `tools.deny` waar nodig.
</Note>

`coding` bevat lichtgewicht webtools (`web_search`, `web_fetch`, `x_search`)
maar niet de volledige browserbesturingstool. Browserautomatisering kan echte
sessies en ingelogde profielen aansturen, dus voeg deze expliciet toe met
`tools.alsoAllow: ["browser"]` of een per-agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Het configureren van `tools.exec` of `tools.fs` onder een beperkend profiel (`messaging`, `minimal`) verbreedt de allowlist van het profiel niet impliciet. Voeg expliciete `tools.alsoAllow`-vermeldingen toe (bijvoorbeeld `["exec", "process"]` voor exec, of `["read", "write", "edit"]` voor fs) wanneer je wilt dat een beperkend profiel die geconfigureerde secties gebruikt. OpenClaw logt een opstartwaarschuwing wanneer een configsectie aanwezig is zonder een bijbehorende `alsoAllow`-toekenning.
</Note>

De profielen `coding` en `messaging` staan ook geconfigureerde bundle MCP-tools toe
onder de Plugin-sleutel `bundle-mcp`. Voeg `tools.deny: ["bundle-mcp"]` toe wanneer je
wilt dat een profiel zijn normale ingebouwde tools behoudt maar alle geconfigureerde MCP-tools verbergt.
Het profiel `minimal` bevat geen bundle MCP-tools.

Voorbeeld (standaard het breedste tooloppervlak):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Toolgroepen

Gebruik `group:*`-verkortingen in toestaan-/weigerenlijsten:

| Groep              | Hulpmiddelen                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wordt geaccepteerd als alias voor `exec`)                           |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, Gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle ingebouwde OpenClaw-tools (exclusief Plugin-tools)                                                   |

`sessions_history` retourneert een begrensde, op veiligheid gefilterde herinneringsweergave. Het verwijdert
denktags, `<relevant-memories>`-scaffolding, XML-payloads voor toolaanroepen in platte tekst
(inclusief `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` en afgekorte toolaanroepblokken),
gedegradeerde toolaanroep-scaffolding, gelekte ASCII-/volledige-breedte-modelbesturingstokens
en ongeldige MiniMax-toolaanroep-XML uit assistenttekst, en past daarna
redactie/afkapping en mogelijke plaatshouders voor te grote rijen toe in plaats van te fungeren
als een ruwe transcriptdump.

### Providerspecifieke beperkingen

Gebruik `tools.byProvider` om hulpmiddelen voor specifieke providers te beperken zonder
globale standaardwaarden te wijzigen:

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
