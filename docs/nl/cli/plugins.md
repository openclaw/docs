---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt Plugin-laadfouten opsporen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-29T22:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68d6a2734c7b4a3608467c64426f48bdf8dc1a36e33b51ba024313fc36762b5b
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway plugins, hook packs en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin-systeem" href="/nl/tools/plugin">
    Eindgebruikershandleiding voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Plugin-bundels" href="/nl/plugins/bundles">
    Compatibiliteitsmodel voor bundels.
  </Card>
  <Card title="Plugin-manifest" href="/nl/plugins/manifest">
    Manifestvelden en configuratieschema.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security">
    Beveiligingsverharding voor Plugin-installaties.
  </Card>
</CardGroup>

## Opdrachten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Voor onderzoek naar trage installatie, inspectie, verwijdering of registry-vernieuwing voer je de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-Plugin); andere vereisen `plugins enable`.

Native OpenClaw plugins moeten `openclaw.plugin.json` meeleveren met een inline JSON Schema (`configSchema`, zelfs als het leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitvoer van uitgebreide lijst/info toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelcapaciteiten.
</Note>

### Installeren

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Kale pakketnamen worden eerst gecontroleerd in ClawHub en daarna in npm. Behandel Plugin-installaties alsof je code uitvoert. Geef de voorkeur aan vastgezette versies.
</Warning>

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en direct-installatiepad. Tijdens de migratie naar
ClawHub levert OpenClaw nog steeds enkele OpenClaw-eigen `@openclaw/*` Plugin-pakketten
op npm; die pakketversies kunnen achterlopen op de gebundelde bron tussen Plugin-release
trains. Als npm een OpenClaw-eigen Plugin-pakket als verouderd meldt, is die
gepubliceerde versie een oud extern artefact; gebruik de Plugin die met
de huidige OpenClaw is gebundeld of een lokale checkout totdat een nieuwer npm-pakket is gepubliceerd.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-includes en herstel bij ongeldige configuratie">
    Als je `plugins`-sectie wordt ondersteund door een single-file `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat included bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie ongeldig is tijdens installatie, faalt `plugins install` normaal gesproken gesloten en vertelt het je eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten van de Gateway wordt ongeldige configuratie voor één Plugin geïsoleerd tot die Plugin zodat andere kanalen en plugins kunnen blijven draaien; `openclaw doctor --fix` kan de ongeldige Plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en herinstalleren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde Plugin of hook pack ter plekke. Gebruik dit wanneer je bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-Plugin geef je de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een Plugin-id die al is geïnstalleerd, stopt OpenClaw en wijst het je op `plugins update <id-or-npm-spec>` voor een normale upgrade, of op `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` geldt alleen voor npm-installaties. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor false positives in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan zelfs wanneer de ingebouwde scanner `critical`-bevindingen meldt, maar het omzeilt **niet** beleidsblokkades van Plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag geldt voor Plugin-installatie-/updateflows. Door de Gateway ondersteunde installatie van skill-afhankelijkheden gebruikt de overeenkomende request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een aparte ClawHub skill-download-/installatieflow blijft.

    Als een Plugin die je op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de uitgeversstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hook packs die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde hook-zichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/file-specs en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties draaien projectlokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer je ClawHub-lookup wilt overslaan en direct vanaf npm wilt installeren. Kale pakketspecs geven nog steeds de voorkeur aan ClawHub en vallen alleen terug op npm wanneer ClawHub dat pakket of die versie niet heeft.

    Kale specs en `@latest` blijven op de stabiele track. Als npm een van beide naar een prerelease resolveert, stopt OpenClaw en vraagt het je expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prerelease-versie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een gebundelde Plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de gebundelde Plugin direct. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw Plugin-archieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte Plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Claude marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw geeft nu ook de voorkeur aan ClawHub voor kale npm-veilige Plugin-specs. Het valt alleen terug op npm als ClawHub dat pakket of die versie niet heeft:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om alleen-npm-resolutie af te dwingen, bijvoorbeeld wanneer ClawHub onbereikbaar is of je weet dat het pakket alleen op npm bestaat:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw downloadt het pakketarchief van ClawHub, controleert de geadverteerde Plugin-API-/minimale Gateway-compatibiliteit en installeert het vervolgens via het normale archiefpad. Vastgelegde installaties bewaren hun ClawHub-bronmetadata voor latere updates.
Ongeversioneerde ClawHub-installaties behouden een ongeversioneerde vastgelegde spec zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgezet op die selector.

#### Marketplace-shorthand

Gebruik de `plugin@marketplace`-shorthand wanneer de marketplace-naam bestaat in Claude's lokale registrycache op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` wanneer je de marketplace-bron expliciet wilt doorgeven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace-bronnen">
    - een bij Claude bekende marketplace-naam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-reposhorthand zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanaf GitHub of git worden geladen, moeten Plugin-vermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-Plugin-bronnen uit externe manifesten.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentlayout)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden geïnstalleerd in de normale Plugin-root en nemen deel aan dezelfde lijst-/info-/inschakel-/uitschakelflow. Momenteel worden bundel-skills, Claude command-skills, Claude `settings.json`-standaarden, Claude `.lsp.json`-/door manifest gedeclareerde `lspServers`-standaarden, Cursor command-skills en compatibele Codex-hookdirectories ondersteund; andere gedetecteerde bundelcapaciteiten worden getoond in diagnostiek/info maar zijn nog niet gekoppeld aan runtime-uitvoering.
</Note>

### Lijst

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Toon alleen ingeschakelde plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Schakel van de tabelweergave naar detailregels per Plugin met bron-/oorsprong-/versie-/activeringsmetadata.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registrydiagnostiek.
</ParamField>

<Note>
`plugins list` leest eerst het persistent opgeslagen lokale pluginregister, met een alleen uit het manifest afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor planning bij een koude start, maar het is geen live-runtimeprobe van een al draaiend Gateway-proces. Start na het wijzigen van plugincode, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/container-deployments of je het daadwerkelijke `openclaw gateway run`-kindproces opnieuw start, en niet alleen een wrapperproces.
</Note>

Voor werk aan meegeleverde plugins binnen een verpakte Docker-image mount je de
bronmap van de plugin bindend over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-overlay
voor `/app/dist/extensions/synology-chat`; een gewone gekopieerde bronmap
blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --json` toont geregistreerde hooks en diagnostiek van een inspectiepass waarbij de module is geladen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, het configuratiepad en de RPC-gezondheid.
- Niet-meegeleverde conversatiehooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om te voorkomen dat een lokale map wordt gekopieerd (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gelinkte installaties het bronpad hergebruiken in plaats van over een beheerde installatiedoelmap heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde pluginindex, terwijl het standaardgedrag niet-gepind blijft.
</Note>

### Pluginindex

Plugininstallatiemetadata is door de machine beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor defecte of ontbrekende pluginmanifests. De `plugins`-array is de uit het manifest afgeleide cold-registercache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en het cold-pluginregister.

Wanneer OpenClaw meegeleverde legacy-`plugins.installs`-records in de configuratie ziet, verplaatst het die naar de pluginindex en verwijdert het de configuratiesleutel; als een van beide schrijfacties mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de persistent opgeslagen pluginindex, allow-/denylist-vermeldingen voor plugins en gelinkte `plugins.load.paths`-vermeldingen wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert verwijderen ook de bijgehouden beheerde installatiemap wanneer die zich binnen de plugin-extensieroot van OpenClaw bevindt. Voor active-memory-plugins wordt het geheugenslot teruggezet naar `memory-core`.

<Note>
`--keep-config` wordt ondersteund als verouderd alias voor `--keep-files`.
</Note>

### Bijwerken

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates worden toegepast op bijgehouden plugininstallaties in de beheerde pluginindex en op bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-spec oplossen">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte gepinde versies ook bij latere `update <id>`-uitvoeringen gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het bijgehouden pluginrecord, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-spec vast voor toekomstige updates op basis van id.

    Het doorgeven van de npm-pakketnaam zonder versie of tag herleidt ook naar het bijgehouden pluginrecord. Gebruik dit wanneer een plugin aan een exacte versie was gepind en je die terug wilt verplaatsen naar de standaard releaselijn van het register.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie aan de hand van de npm-registermetadata. Als de geïnstalleerde versie en vastgelegde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer er een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactdrift. De interactieve opdracht `openclaw plugins update` toont de verwachte en daadwerkelijke hashes en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet voortzettingsbeleid meegeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij bijwerken">
    `--dangerously-force-unsafe-install` is ook beschikbaar bij `plugins update` als break-glass-override voor vals-positieven in de ingebouwde scan op gevaarlijke code tijdens pluginupdates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering door scanfouten, en het geldt alleen voor pluginupdates, niet voor hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Diepe introspectie voor één plugin. Toont identiteit, laadstatus, bron, geregistreerde mogelijkheden, hooks, tools, opdrachten, services, Gateway-methoden, HTTP-routes, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en gedetecteerde ondersteuning voor MCP- of LSP-servers.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk tijdens runtime registreert:

- **plain-capability** — één mogelijkheidstype (bijv. een provider-only plugin)
- **hybrid-capability** — meerdere mogelijkheidstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen mogelijkheden of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen mogelijkheden

Zie [Pluginvormen](/nl/plugins/architecture#plugin-shapes) voor meer over het mogelijkhedenmodel.

<Note>
De vlag `--json` geeft een machineleesbaar rapport weer dat geschikt is voor scripting en audits. `inspect --all` rendert een vlootbrede tabel met kolommen voor vorm, mogelijkheidstypen, compatibiliteitsmeldingen, bundelmogelijkheden en hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert pluginlaadfouten, manifest-/discoverydiagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, wordt `No plugin issues detected.` afgedrukt.

Voer bij modulevormfouten, zoals ontbrekende `register`-/`activate`-exports, opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportvorm in de diagnostische output op te nemen.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale pluginregister is het persistent opgeslagen cold-readmodel van OpenClaw voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en bijdrage-eigenaarschap. Normale opstart, lookup van provider-eigenaren, kanaalsetupclassificatie en plugininventaris kunnen het lezen zonder pluginruntimemodules te importeren.

Gebruik `plugins registry` om te inspecteren of het persistent opgeslagen register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen uit de persistent opgeslagen pluginindex, het configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten in het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel bij opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace-list accepteert een lokaal marketplacepad, een `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparste marketplace-manifest en de pluginvermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Communityplugins](/nl/plugins/community)
