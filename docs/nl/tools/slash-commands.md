---
read_when:
    - Chatopdrachten gebruiken of configureren
    - Foutopsporing van opdrachtroutering of machtigingen
    - Begrijpen hoe opdrachten voor Skills worden geregistreerd
sidebarTitle: Slash commands
summary: Alle beschikbare slash-opdrachten, richtlijnen en inline-snelkoppelingen — configuratie, routering en gedrag per interface.
title: Slashcommando's
x-i18n:
    generated_at: "2026-07-12T09:30:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

De Gateway verwerkt opdrachten die als zelfstandige berichten worden verzonden en met `/` beginnen.
Bash-opdrachten die alleen op de host worden uitgevoerd, gebruiken `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek aan een ACP-sessie is gekoppeld, wordt normale tekst naar de ACP-
harness gerouteerd. Beheeropdrachten voor de Gateway blijven lokaal: `/acp ...` bereikt
altijd de opdrachthandler van OpenClaw, en `/status` en `/unfocus` blijven lokaal wanneer
opdrachtverwerking voor het oppervlak is ingeschakeld.

## Drie typen opdrachten

<CardGroup cols={3}>
  <Card title="Opdrachten" icon="terminal">
    Zelfstandige `/...`-berichten die door de Gateway worden verwerkt. Ze moeten als
    enige inhoud van het bericht worden verzonden.
  </Card>
  <Card title="Directieven" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — worden uit het bericht verwijderd voordat het model
    het ziet. Behouden sessie-instellingen wanneer ze afzonderlijk worden verzonden;
    fungeren als inline aanwijzingen wanneer ze met andere tekst worden verzonden.
  </Card>
  <Card title="Inline snelkoppelingen" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — worden onmiddellijk uitgevoerd en
    verwijderd voordat het model de resterende tekst ziet. Alleen geautoriseerde afzenders.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details over het gedrag van directieven">
    - Directieven worden uit het bericht verwijderd voordat het model het ziet.
    - In berichten met **alleen directieven** (het bericht bevat uitsluitend directieven)
      blijven ze voor de sessie behouden en wordt een bevestiging teruggestuurd.
    - In **normale chatberichten** met andere tekst fungeren ze als inline aanwijzingen en
      blijven de sessie-instellingen **niet** behouden.
    - Directieven gelden alleen voor **geautoriseerde afzenders**. Als `commands.allowFrom`
      is ingesteld, is dit de enige gebruikte toelatingslijst; anders komt autorisatie uit
      toelatingslijsten/koppeling van kanalen plus `commands.useAccessGroups`. Bij niet-
      geautoriseerde afzenders worden directieven als gewone tekst behandeld.
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
  Schakelt het parseren van `/...` in chatberichten in. Op oppervlakken zonder systeemeigen
  opdrachten (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) werken
  tekstopdrachten zelfs wanneer dit op `false` is ingesteld.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registreert systeemeigen opdrachten. Automatisch: ingeschakeld voor Discord/Telegram;
  uitgeschakeld voor Slack; genegeerd voor providers zonder systeemeigen ondersteuning.
  Overschrijf dit per kanaal met `channels.<provider>.commands.native`. Bij Discord zorgt
  `false` ervoor dat slash-opdrachten niet worden geregistreerd; eerder geregistreerde
  opdrachten kunnen zichtbaar blijven totdat ze worden verwijderd.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert opdrachten voor Skills systeemeigen wanneer dit wordt ondersteund. Automatisch:
  ingeschakeld voor Discord/Telegram; uitgeschakeld voor Slack. Overschrijf dit met
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om shellopdrachten op de host uit te voeren (alias `/bash <cmd>`).
  Vereist toelatingslijsten voor `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Hoe lang bash wacht voordat naar de achtergrondmodus wordt overgeschakeld (`0` schakelt
  onmiddellijk over naar de achtergrond).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`). Alleen voor de eigenaar.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`). Alleen voor de eigenaar.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (detectie/status van plugins plus installeren en in-/uitschakelen). Alleen voor de eigenaar bij schrijfbewerkingen.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (configuratieoverschrijvingen die alleen tijdens uitvoering gelden). Alleen voor de eigenaar.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` en toolacties voor het herstarten van de Gateway in.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Expliciete toelatingslijst voor de eigenaar voor opdrachtoppervlakken die alleen voor de
  eigenaar bestemd zijn. Staat los van `commands.allowFrom` en toegang via DM-koppeling.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: vereist de identiteit van de eigenaar voor opdrachten die alleen voor de
  eigenaar bestemd zijn. Wanneer dit `true` is, moet de afzender overeenkomen met
  `commands.ownerAllowFrom` of het interne bereik `operator.admin` bezitten.
  Een jokertekenvermelding in `allowFrom` is **niet** voldoende.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe eigenaar-ID's in de systeemprompt worden weergegeven.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-geheim dat wordt gebruikt wanneer `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Toegestane lijst per provider voor opdrachtautorisatie. Wanneer deze is geconfigureerd, is dit de
  **enige** autorisatiebron voor opdrachten en instructies. Gebruik `"*"` als
  algemene standaardwaarde; providerspecifieke sleutels overschrijven deze.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt toegestane lijsten en beleidsregels voor opdrachten af wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Opdrachten zijn afkomstig uit drie bronnen:

- **Ingebouwde kernopdrachten:** `src/auto-reply/commands-registry.shared.ts`
- **Gegenereerde dockopdrachten:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-opdrachten:** aanroepen van `registerCommand()` door plugins

De beschikbaarheid is afhankelijk van configuratievlaggen, het kanaaloppervlak en geïnstalleerde/ingeschakelde
plugins.

### Kernopdrachten

  <AccordionGroup>
  <Accordion title="Sessies en uitvoeringen">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/new [model]` | Archiveer de huidige sessie en start een nieuwe |
    | `/reset [soft [message]]` | Stel de huidige sessie ter plaatse opnieuw in. `soft` behoudt het transcript, verwijdert hergebruikte sessie-id's van de CLI-backend en voert het opstartproces opnieuw uit |
    | `/name <title>` | Geef de huidige sessie een naam of wijzig deze. Laat de titel weg om de huidige naam en een suggestie te zien |
    | `/compact [instructions]` | Comprimeer de sessiecontext. Zie [Compaction](/nl/concepts/compaction) |
    | `/stop` | Breek de huidige uitvoering af |
    | `/session idle <duration\|off>` | Beheer de vervaltijd wegens inactiviteit van de threadkoppeling |
    | `/session max-age <duration\|off>` | Beheer de maximale vervaltijd van de threadkoppeling |
    | `/export-session [path]` | Exporteer de huidige sessie naar HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporteer een JSONL-trajectbundel voor de huidige sessie. Alias: `/trajectory` |

    <Note>
      Control UI onderschept een getypte `/new` om een nieuwe
      dashboardsessie te maken en ernaar over te schakelen, behalve wanneer
      `session.dmScope: "main"` is geconfigureerd en de huidige bovenliggende
      sessie de hoofdsessie van de agent is — in dat geval stelt `/new` de
      hoofdsessie ter plaatse opnieuw in. Een getypte `/reset` voert nog steeds
      de interne reset van de Gateway uit. Gebruik `/model default` wanneer je
      een vastgezette modelselectie voor de sessie wilt wissen.
    </Note>

  </Accordion>

  <Accordion title="Model- en uitvoeringsinstellingen">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/think <level\|default>` | Stel het denkniveau in of wis de sessieoverschrijving. Aliassen: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schakel uitgebreide uitvoer in of uit. Alias: `/v` |
    | `/trace on\|off` | Schakel trace-uitvoer van plugins voor de huidige sessie in of uit |
    | `/fast [status\|auto\|on\|off\|default]` | Toon, stel de snelle modus in of wis deze |
    | `/reasoning [on\|off\|stream]` | Schakel de zichtbaarheid van de redenering in of uit. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schakel de verhoogde modus in of uit. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Toon de standaardinstellingen voor uitvoering of stel deze in |
    | `/login [codex\|openai\|openai-codex]` | Koppel de Codex/OpenAI-aanmelding vanuit een privéchat of Web UI-sessie. Alleen voor eigenaar/beheerder |
    | `/model [name\|#\|status]` | Toon het model of stel het in |
    | `/models [provider] [page] [limit=<n>\|all]` | Toon geconfigureerde providers of modellen waarvoor authenticatie beschikbaar is |
    | `/queue <mode>` | Beheer het wachtrijgedrag voor actieve uitvoeringen. Zie [Wachtrij](/nl/concepts/queue) en [Wachtrijsturing](/nl/concepts/queue-steering) |
    | `/steer <message>` | Voeg aanwijzingen toe aan de actieve uitvoering. Alias: `/tell`. Zie [Sturen](/nl/tools/steer) |

    <AccordionGroup>
      <Accordion title="veiligheid van verbose / trace / fast / reasoning">
        - `/verbose` is bedoeld voor foutopsporing — houd dit bij normaal gebruik **uitgeschakeld**.
        - `/trace` toont alleen trace- en foutopsporingsregels van plugins; normale uitgebreide meldingen blijven uitgeschakeld.
        - `/fast auto|on|off` slaat een sessieoverschrijving blijvend op; gebruik de optie `inherit` in de Sessions UI om deze te wissen.
        - `/fast` is providerspecifiek: OpenAI/Codex koppelen dit aan `service_tier=priority`; rechtstreekse Anthropic-verzoeken koppelen dit aan `service_tier=auto` of `standard_only`.
        - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsomgevingen — ze kunnen interne redeneringen of plugindiagnostiek onthullen. Houd ze uitgeschakeld in groepschats.

      </Accordion>
      <Accordion title="Details over het wisselen van model">
        - `/model` slaat het nieuwe model onmiddellijk op in de sessie.
        - Als de agent inactief is, gebruikt de volgende uitvoering het meteen.
        - Als er een uitvoering actief is, wordt de wissel als in afwachting gemarkeerd en bij het volgende geschikte nieuwe pogingspunt toegepast.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Detectie en status">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/help` | Toon het korte helpoverzicht |
    | `/commands` | Toon de gegenereerde opdrachtencatalogus |
    | `/tools [compact\|verbose]` | Toon wat de huidige agent op dit moment kan gebruiken |
    | `/status` | Toon de uitvoerings- en runtimestatus, de beschikbaarheidstijd van de Gateway en het systeem, de status van plugins en het gebruik en quotum van providers |
    | `/status plugins` | Toon gedetailleerde pluginstatus: laadfouten, quarantaines, storingen van kanaalplugins, afhankelijkheidsproblemen en compatibiliteitsmeldingen. Vereist `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Beheer het duurzame [doel](/nl/tools/goal) van de huidige sessie |
    | `/diagnostics [note]` | Alleen voor de eigenaar bestemde procedure voor ondersteuningsrapporten. Vraagt elke keer om toestemming voor uitvoering |
    | `/crestodian <request>` | Voer vanuit een privébericht van een eigenaar de Crestodian-helper voor installatie en reparatie uit |
    | `/tasks` | Toon actieve en recente achtergrondtaken voor de huidige sessie |
    | `/context [list\|detail\|map\|json]` | Leg uit hoe de context wordt samengesteld |
    | `/whoami` | Toon je afzender-id. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Beheer de gebruiksvoetregel per antwoord (`reset`/`inherit`/`clear`/`default` wist de sessie-overschrijving, zodat de geconfigureerde standaard opnieuw wordt overgenomen) of toon een lokaal kostenoverzicht |
  </Accordion>

  <Accordion title="Skills, toelatingslijsten en goedkeuringen">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/skill <name> [input]` | Voer een skill op naam uit |
    | `/learn [request]` | Stel op basis van het huidige gesprek of opgegeven bronnen via [Skill Workshop](/nl/tools/skill-workshop) één controleerbare skill op |
    | `/allowlist [list\|add\|remove] ...` | Beheer vermeldingen in de toelatingslijst. Alleen tekst |
    | `/approve <id> <decision>` | Behandel verzoeken om goedkeuring voor uitvoering of een plugin |
    | `/btw <question>` | Stel een tussenvraag zonder de sessiecontext te wijzigen. Alias: `/side`. Zie [BTW](/nl/tools/btw) |
  </Accordion>

  <Accordion title="Subagents en ACP">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecteer uitvoeringen van subagents voor de huidige sessie |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Beheer ACP-sessies en runtime-opties. Runtime-besturing vereist een externe eigenaar of interne Gateway-beheerdersidentiteit |
    | `/focus <target>` | Koppel de huidige Discord-thread of het huidige Telegram-onderwerp aan een sessiedoel |
    | `/unfocus` | Verwijder de huidige threadkoppeling |
    | `/agents` | Toon aan threads gekoppelde agents voor de huidige sessie |
  </Accordion>

  <Accordion title="Schrijfbewerkingen en beheer uitsluitend voor eigenaars">
    | Opdracht | Vereist | Beschrijving |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lees of schrijf `openclaw.json`. Uitsluitend voor eigenaars |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lees of schrijf de door OpenClaw beheerde MCP-serverconfiguratie. Uitsluitend voor eigenaars |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecteer of wijzig de Plugin-status. Schrijfbewerkingen uitsluitend voor eigenaars. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Configuratie-overschrijvingen uitsluitend voor de runtime. Uitsluitend voor eigenaars |
    | `/restart` | `commands.restart: true` (standaard) | Start OpenClaw opnieuw |
    | `/send on\|off\|inherit` | eigenaar | Stel het verzendbeleid in |
  </Accordion>

  <Accordion title="Spraak, TTS en kanaalbesturing">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Beheer TTS. Zie [TTS](/nl/tools/tts) |
    | `/activation mention\|always` | Stel de groepsactiveringsmodus in |
    | `/bash <command>` | Voer een shell-opdracht op de host uit. Alias: `! <command>`. Vereist `commands.bash: true` |
    | `!poll [sessionId]` | Controleer een bash-taak op de achtergrond |
    | `!stop [sessionId]` | Stop een bash-taak op de achtergrond |
  </Accordion>
</AccordionGroup>

### Dock-opdrachten

Dock-opdrachten schakelen de antwoordroute van de actieve sessie over naar een ander gekoppeld kanaal.
Zie [Kanalen docken](/nl/concepts/channel-docking) voor configuratie en probleemoplossing.

Gegenereerd vanuit kanaalplugins met ondersteuning voor systeemeigen opdrachten:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Dock-opdrachten vereisen `session.identityLinks`. De afzender van de bron en de doelpeer
moeten zich in dezelfde identiteitsgroep bevinden.

### Meegeleverde Plugin-opdrachten

| Opdracht                                                | Beschrijving                                                                                                                                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Schakel Dreaming voor het geheugen in of uit (eigenaar of Gateway-beheerder). Zie [Dreaming](/nl/concepts/dreaming)                                                                              |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Beheer het koppelen van apparaten. Zie [Koppelen](/nl/channels/pairing)                                                                                                                          |
| `/phone status\|arm ...\|disarm`                        | Schakel tijdelijk Node-opdrachten met een hoog risico in (camera/scherm/computer/schrijfbewerkingen). Zie [Computergebruik](/nl/nodes/computer-use)                                             |
| `/voice status\|list\|set <voiceId>`                    | Beheer de Talk-stemconfiguratie. Systeemeigen naam in Discord: `/talkvoice`                                                                                                                   |
| `/card ...`                                             | Verzend vooraf ingestelde uitgebreide LINE-kaarten. Zie [LINE](/nl/channels/line)                                                                                                               |
| `/codex <action> ...`                                   | Koppel, stuur en inspecteer de Codex-app-serverharnas (status, threads, hervatten, model, snel, machtigingen, comprimeren, beoordeling, MCP, Skills en meer). Zie [Codex-harnas](/nl/plugins/codex-harness) |

Alleen voor QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-opdrachten

Door gebruikers aanroepbare Skills worden als slash-opdrachten beschikbaar gesteld:

- `/skill <name> [input]` werkt altijd als algemeen toegangspunt.
- Skills kunnen zich als rechtstreekse opdrachten registreren (bijvoorbeeld `/prose` voor OpenProse).
- De registratie van systeemeigen Skill-opdrachten wordt bestuurd door `commands.nativeSkills` en
  `channels.<provider>.commands.nativeSkills`.
- Namen worden opgeschoond tot `a-z0-9_` (maximaal 32 tekens); bij conflicten worden numerieke achtervoegsels toegevoegd.

<AccordionGroup>
  <Accordion title="Routering van Skill-opdrachten">
    Skill-opdrachten worden standaard als een normaal verzoek naar het model gerouteerd.

    Skills kunnen `command-dispatch: tool` declareren om rechtstreeks naar een tool te routeren
    (deterministisch, zonder tussenkomst van het model). Voorbeeld: `/prose` (OpenProse-Plugin)
    — zie [OpenProse](/nl/prose).

  </Accordion>
  <Accordion title="Argumenten van systeemeigen opdrachten">
    Discord gebruikt automatisch aanvullen voor dynamische opties en knopmenu's wanneer vereiste
    argumenten ontbreken. Telegram en Slack tonen een knopmenu voor opdrachten met
    keuzemogelijkheden. Dynamische keuzen worden bepaald aan de hand van het model van de doelsessie, zodat model-
    specifieke opties zoals `/think`-niveaus de `/model`-overschrijving van de sessie volgen.
  </Accordion>
</AccordionGroup>

## `/tools`: wat de agent nu kan gebruiken

`/tools` beantwoordt een runtime-vraag: **wat deze agent op dit moment in dit
gesprek kan gebruiken** — geen statische configuratiecatalogus.

```text
/tools         # compacte weergave
/tools verbose # met korte beschrijvingen
```

Resultaten zijn beperkt tot de sessie. Een wijziging van agent, kanaal, thread, afzender-
autorisatie of model kan de uitvoer wijzigen. Gebruik voor het bewerken van profielen en overschrijvingen
het paneel Tools in de Control UI of de configuratie-interfaces.

## `/model`: modelselectie

```text
/model             # modelkiezer tonen
/model list        # hetzelfde
/model 3           # selecteren op nummer uit de kiezer
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # modelselectie van de sessie wissen
/model status      # gedetailleerde weergave met eindpunt en API-modus
```

In Discord openen `/model` en `/models` een interactieve kiezer met vervolgkeuzelijsten voor providers en
modellen. De kiezer respecteert `agents.defaults.models`, inclusief
`provider/*`-vermeldingen.

## `/config`: configuratie naar schijf schrijven

<Note>
  Uitsluitend voor eigenaars. Standaard uitgeschakeld — schakel in met `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

De configuratie wordt vóór het schrijven gevalideerd. Ongeldige wijzigingen worden geweigerd. `/config`-
wijzigingen blijven behouden na opnieuw opstarten.

## `/mcp`: MCP-serverconfiguratie

<Note>
  Uitsluitend voor eigenaars. Standaard uitgeschakeld — schakel in met `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` slaat de configuratie op in de OpenClaw-configuratie, niet in de projectinstellingen van de ingebedde agent.
`/mcp show` maskeert velden met inloggegevens, waarden van herkende vlaggen voor inloggegevens
en bekende argumenten met een geheimachtig patroon. Wanneer de opdracht vanuit een groep wordt uitgevoerd, wordt de
configuratie privé naar de eigenaar verzonden; als er geen privéroute naar de eigenaar
beschikbaar is, wordt de opdracht veilig geweigerd en wordt de eigenaar gevraagd het opnieuw te proberen vanuit een rechtstreeks
gesprek.

## `/debug`: overschrijvingen uitsluitend voor de runtime

<Note>
  Uitsluitend voor eigenaars. Standaard uitgeschakeld — schakel in met `commands.debug: true`.
  Overschrijvingen worden onmiddellijk toegepast op nieuwe configuratielezingen, maar schrijven **niet** naar schijf.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: Plugin-beheer

<Note>
  Schrijfbewerkingen uitsluitend voor eigenaars. Standaard uitgeschakeld — schakel in met `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` werkt de Plugin-configuratie bij en laadt de Plugin-runtime van de Gateway
opnieuw voor nieuwe agentbeurten. `/plugins install` start beheerde
Gateways automatisch opnieuw omdat de bronmodules van de Plugin zijn gewijzigd.

## `/trace`: traceeruitvoer van Plugins

```text
/trace          # huidige traceerstatus tonen
/trace on
/trace off
```

`/trace` toont sessiebeperkte traceer-/debugregels van Plugins zonder de volledige uitgebreide
modus. Het vervangt `/debug` (runtime-overschrijvingen) of `/verbose` (normale
tooluitvoer) niet.

## `/btw`: nevenvragen

`/btw` is een snelle nevenvraag over de context van de huidige sessie. Alias: `/side`.

```text
/btw waar zijn we nu mee bezig?
/side wat is er gewijzigd terwijl de hoofduitvoering doorging?
```

In tegenstelling tot een normaal bericht:

- Gebruikt de huidige sessie als achtergrondcontext.
- Wordt in Codex-harnassessies uitgevoerd als een tijdelijke Codex-neventthread.
- Wijzigt de toekomstige sessiecontext **niet**.
- Wordt niet naar de transcriptgeschiedenis geschreven.

Zie [BTW-nevenvragen](/nl/tools/btw) voor het volledige gedrag.

## Opmerkingen per interface

<AccordionGroup>
  <Accordion title="Sessiebereik per interface">
    - **Tekstopdrachten:** worden uitgevoerd in de normale chatsessie (privéberichten delen `main`, groepen hebben hun eigen sessie).
    - **Systeemeigen Discord-opdrachten:** `agent:<agentId>:discord:slash:<userId>`
    - **Systeemeigen Slack-opdrachten:** `agent:<agentId>:slack:slash:<userId>` (voorvoegsel configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
    - **Systeemeigen Telegram-opdrachten:** `telegram:slash:<userId>` (richten zich via `CommandTargetSessionKey` op de chatsessie)
    - **`/login codex`** verzendt apparaatkoppelingscodes uitsluitend via privéchat- of Web UI-antwoordpaden. Bij aanroepen vanuit Telegram-groepen/-onderwerpen wordt de eigenaar gevraagd de bot in een privébericht te benaderen.
    - **`/stop`** richt zich op de actieve chatsessie om de huidige uitvoering af te breken.

  </Accordion>
  <Accordion title="Slack-specifieke details">
    `channels.slack.slashCommand` ondersteunt één opdracht in `/openclaw`-stijl.
    Maak met `commands.native: true` één Slack-slashopdracht per ingebouwde
    opdracht. Registreer `/agentstatus` (niet `/status`), omdat Slack
    `/status` reserveert. De tekstopdracht `/status` werkt nog steeds in Slack-berichten.
  </Accordion>
  <Accordion title="Snel pad en inline-snelkoppelingen">
    - Berichten die uitsluitend uit opdrachten bestaan van afzenders op de toestemmingslijst worden onmiddellijk verwerkt (omzeilen wachtrij en model).
    - Inline-snelkoppelingen (`/help`, `/commands`, `/status`, `/whoami`) werken ook wanneer ze in normale berichten zijn opgenomen en worden verwijderd voordat het model de resterende tekst ziet.
    - Niet-geautoriseerde berichten die uitsluitend uit opdrachten bestaan, worden stilzwijgend genegeerd; inline `/...`-tokens worden als platte tekst behandeld.

  </Accordion>
  <Accordion title="Opmerkingen over argumenten">
    - Opdrachten accepteren optioneel een `:` tussen de opdracht en de argumenten (`/think: high`, `/send: on`).
    - `/new <model>` accepteert een modelalias, `provider/model` of een providernaam (niet-exacte overeenkomst); als er geen overeenkomst is, wordt de tekst als berichtinhoud behandeld.
    - `/allowlist add|remove` vereist `commands.config: true` en respecteert `configWrites` van het kanaal.

  </Accordion>
</AccordionGroup>

## Providergebruik en -status

- **Providergebruik/-quotum** (bijv. "Claude 80% resterend") wordt in `/status` weergegeven voor de huidige modelprovider wanneer gebruiksregistratie is ingeschakeld.
- **Token-/cacheregels** in `/status` kunnen terugvallen op de nieuwste gebruiksvermelding in het transcript wanneer de live momentopname van de sessie weinig gegevens bevat.
- **Uitvoering versus runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie uitvoert: `OpenClaw Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord:** worden beheerd met `/usage off|tokens|full`.
- `/model status` gaat over modellen/authenticatie/eindpunten, niet over gebruik.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Hoe slash-opdrachten voor Skills worden geregistreerd en beperkt.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Bouw een Skill die een eigen slash-opdracht registreert.
  </Card>
  <Card title="BTW" href="/nl/tools/btw" icon="comments">
    Stel tussendoor vragen zonder de sessiecontext te wijzigen.
  </Card>
  <Card title="Bijsturen" href="/nl/tools/steer" icon="compass">
    Stuur de agent tijdens de uitvoering bij met `/steer`.
  </Card>
</CardGroup>
