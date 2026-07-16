---
read_when:
    - Chatopdrachten gebruiken of configureren
    - Fouten opsporen in opdrachtroutering of machtigingen
    - Begrijpen hoe Skills-opdrachten worden geregistreerd
sidebarTitle: Slash commands
summary: Alle beschikbare slashcommando's, richtlijnen en inline-snelkoppelingen — configuratie, routering en gedrag per interface.
title: Slashcommando's
x-i18n:
    generated_at: "2026-07-16T16:40:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

De Gateway verwerkt opdrachten die als afzonderlijke berichten worden verzonden en beginnen met `/`.
Bash-opdrachten die alleen op de host worden uitgevoerd, gebruiken `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek aan een ACP-sessie is gekoppeld, wordt normale tekst naar de ACP-
harnas geleid. Gateway-beheeropdrachten blijven lokaal: `/acp ...` bereikt altijd
de OpenClaw-opdrachthandler, en `/status` plus `/unfocus` blijven lokaal wanneer
opdrachtafhandeling voor het oppervlak is ingeschakeld.

## Drie opdrachttypen

<CardGroup cols={3}>
  <Card title="Opdrachten" icon="terminal">
    Afzonderlijke `/...`-berichten die door de Gateway worden verwerkt. Moeten als
    enige inhoud van het bericht worden verzonden.
  </Card>
  <Card title="Directieven" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — worden uit het bericht verwijderd voordat het model
    het ziet. Leggen sessie-instellingen vast wanneer ze afzonderlijk worden verzonden; fungeren als inline aanwijzingen
    wanneer ze samen met andere tekst worden verzonden.
  </Card>
  <Card title="Inline snelkoppelingen" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — worden onmiddellijk uitgevoerd en
    verwijderd voordat het model de resterende tekst ziet. Alleen geautoriseerde afzenders.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details over het gedrag van directieven">
    - Directieven worden uit het bericht verwijderd voordat het model het ziet.
    - In berichten met **alleen directieven** (het bericht bevat uitsluitend directieven), worden ze
      in de sessie vastgelegd en beantwoorden ze met een bevestiging.
    - In berichten van een **normaal gesprek** met andere tekst fungeren ze als inline aanwijzingen en
      leggen ze sessie-instellingen **niet** vast.
    - Directieven zijn alleen van toepassing op **geautoriseerde afzenders**. Als `commands.allowFrom`
      is ingesteld, wordt uitsluitend die toelatingslijst gebruikt; anders is de autorisatie afkomstig van
      toelatingslijsten/koppeling van kanalen plus `commands.useAccessGroups`. Bij niet-geautoriseerde
      afzenders worden directieven als platte tekst behandeld.
  </Accordion>
</AccordionGroup>

## Configuratie

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Schakelt het parseren van `/...` in chatberichten in. Op oppervlakken zonder systeemeigen opdrachten
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) werken tekstuele
  opdrachten zelfs wanneer dit op `false` is ingesteld.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registreert systeemeigen opdrachten. Automatisch: aan voor Discord/Telegram; uit voor Slack;
  genegeerd voor providers zonder systeemeigen ondersteuning. Overschrijf dit per kanaal met
  `channels.<provider>.commands.native`. Op Discord slaat `false` de registratie van slash-opdrachten
  over; eerder geregistreerde opdrachten kunnen zichtbaar blijven totdat ze worden verwijderd.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert Skills-opdrachten systeemeigen wanneer dit wordt ondersteund. Automatisch: aan voor
  Discord/Telegram; uit voor Slack. Overschrijf dit met
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om shellopdrachten op de host uit te voeren (`/bash <cmd>`-alias). Vereist
  `tools.elevated`-toelatingslijsten.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Hoelang bash wacht voordat naar de achtergrondmodus wordt overgeschakeld (`0` schakelt
  onmiddellijk naar de achtergrond).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`). Alleen voor de eigenaar.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`). Alleen voor de eigenaar.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (Plugin-detectie/status plus installatie + in-/uitschakeling). Alleen de eigenaar mag schrijven.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (configuratieoverschrijvingen die alleen tijdens runtime gelden). Alleen voor de eigenaar.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` en externe `SIGUSR1`-herstartverzoeken in.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Expliciete toelatingslijst voor de eigenaar voor opdrachtoppervlakken die alleen voor de eigenaar zijn. Staat los van
  `commands.allowFrom` en toegang via DM-koppeling.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: vereist de identiteit van de eigenaar voor opdrachten die alleen voor de eigenaar zijn. Wanneer `true`,
  moet de afzender overeenkomen met `commands.ownerAllowFrom` of het interne `operator.admin`-
  bereik hebben. Een jokertekenvermelding `allowFrom` is **niet** voldoende.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe eigenaar-id's in de systeemprompt worden weergegeven.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-geheim dat wordt gebruikt wanneer `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Toelatingslijst per provider voor opdracht­autorisatie. Wanneer deze is geconfigureerd, is dit de
  **enige** autorisatiebron voor opdrachten en directieven. Gebruik `"*"` als
  algemene standaardwaarde; providerspecifieke sleutels overschrijven deze.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt toelatingslijsten/beleidsregels voor opdrachten af wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Opdrachten zijn afkomstig uit drie bronnen:

- **Ingebouwde kernopdrachten:** `src/auto-reply/commands-registry.shared.ts`
- **Gegenereerde dockopdrachten:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-opdrachten:** aanroepen van Plugin `registerCommand()`

Beschikbaarheid hangt af van configuratievlaggen, het kanaaloppervlak en geïnstalleerde/ingeschakelde
plugins.

### Kernopdrachten

<AccordionGroup>
  <Accordion title="Sessies en uitvoeringen">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/new [model]` | Archiveer de huidige sessie en start een nieuwe |
    | `/reset [soft [message]]` | Stel de huidige sessie ter plaatse opnieuw in. `soft` behoudt het transcript, verwijdert hergebruikte sessie-id's van de CLI-backend en voert het opstartproces opnieuw uit |
    | `/name <title>` | Geef de huidige sessie een naam of wijzig deze. Laat de titel weg om de huidige naam en een suggestie te zien |
    | `/compact [instructions]` | Voer Compaction uit op de sessiecontext. Zie [Compaction](/nl/concepts/compaction) |
    | `/stop` | Breek de huidige uitvoering af |
    | `/session idle <duration\|off>` | Beheer het verlopen van de threadkoppeling wegens inactiviteit |
    | `/session max-age <duration\|off>` | Beheer het verlopen van de threadkoppeling op basis van de maximale leeftijd |
    | `/export-session [path]` | Alleen voor de eigenaar. Exporteer de huidige sessie binnen de werkruimte naar HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporteer een JSONL-trajectbundel voor de huidige sessie. Alias: `/trajectory` |

    Expliciete `/export-session`-paden vervangen bestaande bestanden binnen de
    werkruimte. Laat het pad weg om een bestandsnaam te genereren die botsingen voorkomt.

    <Note>
      Control UI onderschept getypte `/new` om een nieuwe
      dashboardsessie te maken en ernaar over te schakelen, behalve wanneer `session.dmScope: "main"` is geconfigureerd
      en de huidige bovenliggende sessie de hoofdsessie van de agent is — in dat geval stelt `/new`
      de hoofdsessie ter plaatse opnieuw in. Getypte `/reset` voert nog steeds de
      herinstelling ter plaatse van de Gateway uit. Gebruik `/model default` wanneer je een vastgezette
      modelselectie voor de sessie wilt wissen.
    </Note>

  </Accordion>

  <Accordion title="Model- en uitvoeringsbesturing">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/think <level\|default>` | Stel het denkniveau in of wis de sessieoverschrijving. Aliassen: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schakel uitgebreide uitvoer in of uit. Alias: `/v` |
    | `/trace on\|off` | Schakel de trace-uitvoer van plugins voor de huidige sessie in of uit |
    | `/fast [status\|auto\|on\|off\|default]` | Toon, stel in of wis de snelle modus |
    | `/reasoning [on\|off\|stream]` | Schakel de zichtbaarheid van redeneringen in of uit. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schakel de verhoogde modus in of uit. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Toon uitvoeringsstandaarden of stel ze in |
    | `/login [codex\|openai\|openai-codex]` | Koppel de Codex/OpenAI-aanmelding vanuit een privéchat of Web UI-sessie. Alleen eigenaar/beheerder |
    | `/model [name\|#\|status]` | Toon het model of stel het in |
    | `/models [provider] [page] [limit=<n>\|all]` | Geef geconfigureerde/providers of modellen met beschikbare authenticatie weer |
    | `/queue <mode>` | Beheer het wachtrijgedrag van actieve uitvoeringen. Zie [Wachtrij](/nl/concepts/queue) en [Wachtrijsturing](/nl/concepts/queue-steering) |
    | `/steer <message>` | Voeg aanwijzingen toe aan de actieve uitvoering. Alias: `/tell`. Zie [Sturen](/nl/tools/steer) |

    <AccordionGroup>
      <Accordion title="veiligheid van uitgebreid / trace / snel / redenering">
        - `/verbose` is bedoeld voor foutopsporing — houd dit bij normaal gebruik **uit**.
        - `/trace` toont alleen trace-/foutopsporingsregels die eigendom zijn van plugins; normale uitgebreide meldingen blijven uit.
        - `/fast auto|on|off` legt een sessieoverschrijving vast; gebruik de optie `inherit` in de Sessions UI om deze te wissen.
        - `/fast` is providerspecifiek: OpenAI/Codex koppelen dit aan `service_tier=priority`; rechtstreekse Anthropic-verzoeken koppelen dit aan `service_tier=auto` of `standard_only`.
        - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsomgevingen — ze kunnen interne redeneringen of Plugin-diagnostiek onthullen. Houd ze uitgeschakeld in groepschats.

      </Accordion>
      <Accordion title="Details over het wisselen van model">
        - `/model` legt het nieuwe model onmiddellijk vast in de sessie.
        - Als de agent inactief is, gebruikt de volgende uitvoering het meteen.
        - Als er een uitvoering actief is, wordt de wissel als in behandeling gemarkeerd en bij het volgende schone moment voor een nieuwe poging toegepast.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Detectie en status">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/help` | Toon het korte helpoverzicht |
    | `/commands` | Toon de gegenereerde opdrachtencatalogus |
    | `/tools [compact\|verbose]` | Toon wat de huidige agent op dit moment kan gebruiken |
    | `/status` | Toon de uitvoerings-/runtimestatus, uptime van de Gateway en het systeem, de gezondheid van plugins plus providergebruik/-quotum |
    | `/status plugins` | Toon gedetailleerde informatie over de gezondheid van plugins: laadfouten, quarantaines, fouten van kanaalplugins, afhankelijkheidsproblemen, compatibiliteitsmeldingen. Vereist `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Beheer het duurzame [doel](/nl/tools/goal) van de huidige sessie |
    | `/diagnostics [note]` | Ondersteuningsrapportage alleen voor de eigenaar. Vraagt elke keer om goedkeuring voor uitvoering |
    | `/openclaw <request>` | Voer de OpenClaw-helper voor installatie en herstel uit vanuit een DM van de eigenaar |
    | `/tasks` | Geef actieve/recente achtergrondtaken voor de huidige sessie weer |
    | `/context [list\|detail\|map\|json]` | Leg uit hoe de context wordt samengesteld |
    | `/whoami` | Toon je afzender-id. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Beheer de gebruiksvoetregel per antwoord (`reset`/`inherit`/`clear`/`default` wist de sessieoverschrijving om de geconfigureerde standaardwaarde opnieuw over te nemen) of druk een lokaal kostenoverzicht af |
  </Accordion>

  <Accordion title="Skills, toelatingslijsten, goedkeuringen">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/skill <name> [input]` | Voer een skill uit op naam |
    | `/learn [request]` | Stel op basis van het huidige gesprek of genoemde bronnen één controleerbare skill op via [Skill Workshop](/nl/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Beheer vermeldingen in de toelatingslijst. Alleen tekst |
    | `/approve <id> <decision>` | Handel goedkeuringsverzoeken voor exec of plugins af |
    | `/btw <question>` | Stel een tussenvraag zonder de sessiecontext te wijzigen. Alias: `/side`. Zie [BTW](/nl/tools/btw) |
  </Accordion>

  <Accordion title="Subagents en ACP">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecteer uitvoeringen van subagents voor de huidige sessie |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Beheer ACP-sessies en runtimeopties. Voor runtimebesturing is de identiteit van een externe eigenaar of interne Gateway-beheerder vereist |
    | `/focus <target>` | Koppel de huidige Discord-thread of het huidige Telegram-onderwerp aan een sessiedoel |
    | `/unfocus` | Verwijder de huidige threadkoppeling |
    | `/agents` | Toon aan threads gekoppelde agents voor de huidige sessie |
  </Accordion>

  <Accordion title="Schrijfacties en beheer alleen voor eigenaren">
    | Opdracht | Vereist | Beschrijving |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lees of schrijf `openclaw.json`. Alleen voor eigenaren |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lees of schrijf door OpenClaw beheerde MCP-serverconfiguratie. Alleen voor eigenaren |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecteer of wijzig de pluginstatus. Schrijfacties alleen voor eigenaren. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Configuratieoverschrijvingen uitsluitend voor de runtime. Alleen voor eigenaren |
    | `/restart` | `commands.restart: true` (standaard) | Start OpenClaw opnieuw |
    | `/send on\|off\|inherit` | eigenaar | Stel het verzendbeleid in |
  </Accordion>

  <Accordion title="Spraak, TTS, kanaalbesturing">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Bedien TTS. Zie [TTS](/nl/tools/tts) |
    | `/activation mention\|always` | Stel de groepsactiveringsmodus in |
    | `/bash <command>` | Voer een shellopdracht op de host uit. Alias: `! <command>`. Vereist `commands.bash: true` |
    | `!poll [sessionId]` | Controleer een bash-taak op de achtergrond |
    | `!stop [sessionId]` | Stop een bash-taak op de achtergrond |
  </Accordion>
</AccordionGroup>

### Dockopdrachten

Dockopdrachten schakelen de antwoordroute van de actieve sessie over naar een ander gekoppeld kanaal.
Zie [Kanaaldocking](/nl/concepts/channel-docking) voor installatie en probleemoplossing.

Gegenereerd uit kanaalplugins met ondersteuning voor systeemeigen opdrachten:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Dockopdrachten vereisen `session.identityLinks`. De bronafzender en de doelpeer
moeten tot dezelfde identiteitsgroep behoren.

### Meegeleverde pluginopdrachten

| Opdracht                                                | Beschrijving                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Schakel Dreaming voor het geheugen in of uit (eigenaar of Gateway-beheerder). Zie [Dreaming](/nl/concepts/dreaming)                                                                                 |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Beheer apparaatkoppeling. Zie [Koppeling](/nl/channels/pairing)                                                                                                                                    |
| `/phone status\|arm ...\|disarm`                        | Activeer tijdelijk Node-opdrachten met een hoog risico (camera/scherm/computer/schrijfacties). Zie [Computergebruik](/nl/nodes/computer-use)                                                       |
| `/voice status\|list\|set <voiceId>`                    | Beheer de spraakconfiguratie van Talk. Systeemeigen naam in Discord: `/talkvoice`                                                                                                          |
| `/card ...`                                             | Verzend voorinstellingen voor uitgebreide LINE-kaarten. Zie [LINE](/nl/channels/line)                                                                                                             |
| `/codex <action> ...`                                   | Koppel, bestuur en inspecteer de Codex-app-serverharnas (status, threads, hervatten, model, snel, machtigingen, compact, beoordeling, mcp, skills en meer). Zie [Codex-harnas](/nl/plugins/codex-harness) |

Alleen voor QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skillopdrachten

Door gebruikers aanroepbare skills worden beschikbaar gesteld als slashopdrachten:

- `/skill <name> [input]` werkt altijd als het algemene toegangspunt.
- Skills kunnen als rechtstreekse opdrachten worden geregistreerd (bijv. `/prose` voor OpenProse).
- De registratie van systeemeigen skillopdrachten wordt bepaald door `commands.nativeSkills` en
  `channels.<provider>.commands.nativeSkills`.
- Namen worden opgeschoond tot `a-z0-9_` (max. 32 tekens); bij conflicten worden numerieke achtervoegsels toegevoegd.

<AccordionGroup>
  <Accordion title="Routering van skillopdrachten">
    Skillopdrachten worden standaard als een normale aanvraag naar het model gerouteerd.

    Skills kunnen `command-dispatch: tool` declareren om rechtstreeks naar een tool te routeren
    (deterministisch, zonder betrokkenheid van het model). Voorbeeld: `/prose` (OpenProse-plugin)
    — zie [OpenProse](/nl/prose).

  </Accordion>
  <Accordion title="Argumenten voor systeemeigen opdrachten">
    Discord gebruikt automatisch aanvullen voor dynamische opties en knopmenu's wanneer vereiste
    argumenten zijn weggelaten. Telegram en Slack tonen een knopmenu voor opdrachten met
    keuzemogelijkheden. Dynamische keuzes worden bepaald aan de hand van het model van de doelsessie, zodat model-
    specifieke opties zoals `/think`-niveaus de overschrijving `/model` van de sessie volgen.
  </Accordion>
</AccordionGroup>

## `/tools`: wat de agent nu kan gebruiken

`/tools` beantwoordt een runtimevraag: **wat deze agent op dit moment in dit
gesprek kan gebruiken** — niet een statische configuratiecatalogus.

```text
/tools         # compacte weergave
/tools verbose # met korte beschrijvingen
```

Resultaten gelden per sessie. Een wijziging van agent, kanaal, thread, afzender-
autorisatie of model kan de uitvoer wijzigen. Gebruik voor het bewerken van profielen en overschrijvingen
het paneel Tools in de Control UI of de configuratie-interfaces.

## `/model`: modelselectie

```text
/model             # toon modelkiezer
/model list        # hetzelfde
/model 3           # selecteer op nummer uit de kiezer
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # wis de modelselectie van de sessie
/model status      # gedetailleerde weergave met eindpunt en API-modus
```

In Discord openen `/model` en `/models` een interactieve kiezer met vervolgkeuzelijsten voor provider en
model. De kiezer respecteert `agents.defaults.models`, inclusief
`provider/*`-vermeldingen.

## `/config`: configuratie naar schijf schrijven

<Note>
  Alleen voor eigenaren. Standaard uitgeschakeld — schakel in met `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

De configuratie wordt vóór het schrijven gevalideerd. Ongeldige wijzigingen worden geweigerd. `/config`-
updates blijven behouden na opnieuw opstarten.

## `/mcp`: MCP-serverconfiguratie

<Note>
  Alleen voor eigenaren. Standaard uitgeschakeld — schakel in met `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` slaat de configuratie op in de OpenClaw-configuratie, niet in de projectinstellingen van de ingesloten agent.
`/mcp show` maskeert velden met aanmeldgegevens, herkende waarden van vlaggen voor aanmeldgegevens
en bekende argumenten met de vorm van geheimen. Bij uitvoering vanuit een groep wordt de
configuratie privé naar de eigenaar verzonden; als er geen privéroute naar de eigenaar
beschikbaar is, wordt de opdracht veilig geweigerd en wordt de eigenaar gevraagd het opnieuw te proberen vanuit een rechtstreeks
gesprek.

## `/debug`: overschrijvingen uitsluitend voor de runtime

<Note>
  Alleen voor eigenaren. Standaard uitgeschakeld — schakel in met `commands.debug: true`.
  Overschrijvingen worden onmiddellijk toegepast op nieuwe configuratielezingen, maar schrijven **niet** naar schijf.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: pluginbeheer

<Note>
  Schrijfacties alleen voor eigenaren. Standaard uitgeschakeld — schakel in met `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` werkt de pluginconfiguratie bij en laadt de Gateway-
pluginruntime dynamisch opnieuw voor nieuwe agentbeurten. `/plugins install` start beheerde
Gateways automatisch opnieuw omdat de bronmodules van de plugin zijn gewijzigd. Voor installaties uit vertrouwde ClawHub-
bronnen en de officiële catalogus is geen extra bevestiging nodig. Willekeurige npm-,
git-, archief-, `npm-pack:`- en lokale padbronnen tonen een herkomstwaarschuwing en
vereisen een afsluitende `--force` nadat je de bron hebt beoordeeld. Deze vlag bevestigt
de bron en staat vervanging van een bestaande installatie toe; de vlag omzeilt
`security.installPolicy` of de beveiligingscontroles van het installatieprogramma niet. ClawHub-releases met
risicowaarschuwingen vereisen nog steeds de afzonderlijke, uitsluitend via de shell beschikbare vlag
`--acknowledge-clawhub-risk`. Marketplace-, gekoppelde en vastgezette installaties blijven eveneens
uitsluitend via de shell beschikbaar.

## `/trace`: uitvoer van plugintracering

```text
/trace          # toon huidige traceringsstatus
/trace on
/trace off
```

`/trace` toont sessiegebonden traceer-/debugregels van plugins zonder de volledige uitgebreide
modus. Het vervangt `/debug` (runtimeoverschrijvingen) of `/verbose` (normale
tooluitvoer) niet.

## `/btw`: tussenvragen

`/btw` is een snelle tussenvraag over de huidige sessiecontext. Alias: `/side`.

```text
/btw waar zijn we nu mee bezig?
/side wat is er veranderd terwijl de hoofduitvoering doorging?
```

Anders dan een normaal bericht:

- Gebruikt de huidige sessie als achtergrondcontext.
- Wordt in Codex-harnassessies uitgevoerd als een tijdelijke Codex-zijthread.
- Wijzigt de toekomstige sessiecontext **niet**.
- Wordt niet naar de transcriptgeschiedenis geschreven.

Zie [BTW-tussenvragen](/nl/tools/btw) voor het volledige gedrag.

## Opmerkingen over interfaces

<AccordionGroup>
  <Accordion title="Sessiebereik per interface">
    - **Tekstopdrachten:** worden uitgevoerd in de normale chatsessie (privéberichten delen `main`, groepen hebben hun eigen sessie).
    - **Systeemeigen Discord-opdrachten:** `agent:<agentId>:discord:slash:<userId>`
    - **Systeemeigen Slack-opdrachten:** `agent:<agentId>:slack:slash:<userId>` (voorvoegsel configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
    - **Systeemeigen Telegram-opdrachten:** `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/login codex`** verzendt apparaatkoppelingscodes alleen via privéchat of antwoordroutes van de Web UI. Bij aanroepen vanuit een Telegram-groep/-onderwerp wordt de eigenaar gevraagd de bot in een privébericht te benaderen.
    - **`/stop`** richt zich op de actieve chatsessie om de huidige uitvoering af te breken.

  </Accordion>
  <Accordion title="Specifieke details voor Slack">
    `channels.slack.slashCommand` ondersteunt één opdracht in `/openclaw`-stijl.
    Maak met `commands.native: true` één Slack-slashopdracht per ingebouwde
    opdracht. Registreer `/agentstatus` (niet `/status`), omdat Slack
    `/status` reserveert. Tekst `/status` werkt nog steeds in Slack-berichten.
  </Accordion>
  <Accordion title="Snel pad en inline-snelkoppelingen">
    - Berichten die uitsluitend uit opdrachten bestaan en afkomstig zijn van afzenders op de toelatingslijst, worden onmiddellijk verwerkt (omzeilen wachtrij + model).
    - Inline-snelkoppelingen (`/help`, `/commands`, `/status`, `/whoami`) werken ook wanneer ze in normale berichten zijn opgenomen en worden verwijderd voordat het model de resterende tekst ziet.
    - Niet-geautoriseerde berichten die uitsluitend uit opdrachten bestaan, worden stilzwijgend genegeerd; inline `/...`-tokens worden als platte tekst behandeld.

  </Accordion>
  <Accordion title="Opmerkingen over argumenten">
    - Opdrachten accepteren optioneel een `:` tussen de opdracht en de argumenten (`/think: high`, `/send: on`).
    - `/new <model>` accepteert een modelalias, `provider/model` of een providernaam (benaderende overeenkomst); als er geen overeenkomst is, wordt de tekst als berichttekst behandeld.
    - `/allowlist add|remove` vereist `commands.config: true` en respecteert `configWrites` van het kanaal.

  </Accordion>
</AccordionGroup>

## Providergebruik en -status

- **Providergebruik/-quotum** (bijv. "Claude 80% resterend") wordt in `/status` weergegeven voor de huidige modelprovider wanneer gebruiksregistratie is ingeschakeld.
- **Token-/cacheregels** in `/status` kunnen terugvallen op de nieuwste gebruiksvermelding in het transcript wanneer de live sessiemomentopname weinig gegevens bevat.
- **Uitvoering versus runtime:** `/status` vermeldt `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie uitvoert: `OpenClaw Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord:** ingesteld via `/usage off|tokens|full`.
- `/model status` gaat over modellen/authenticatie/eindpunten, niet over gebruik.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Hoe slashopdrachten van Skills worden geregistreerd en beperkt.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Bouw een Skill die zijn eigen slashopdracht registreert.
  </Card>
  <Card title="Trouwens" href="/nl/tools/btw" icon="comments">
    Nevenvragen zonder de sessiecontext te wijzigen.
  </Card>
  <Card title="Bijsturen" href="/nl/tools/steer" icon="compass">
    Stuur de agent tijdens de uitvoering bij met `/steer`.
  </Card>
</CardGroup>
