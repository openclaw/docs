---
read_when:
    - Veilige binaire bestanden of aangepaste profielen voor veilige binaire bestanden configureren
    - Goedkeuringen doorsturen naar Slack/Discord/Telegram of andere chatkanalen
    - Een native goedkeuringsclient voor een kanaal implementeren
summary: 'Geavanceerde exec-goedkeuringen: veilige binaire bestanden, interpreterkoppeling, doorsturen van goedkeuringen, systeemeigen levering'
title: Exec-goedkeuringen — geavanceerd
x-i18n:
    generated_at: "2026-07-16T16:33:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Geavanceerde onderwerpen voor exec-goedkeuring: het snelle pad `safeBins`, binding van interpreter/runtime
en het doorsturen van goedkeuringen naar chatkanalen (inclusief native bezorging).
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het kernbeleid en de goedkeuringsstroom.

## Veilige binaries (alleen stdin)

`tools.exec.safeBins` benoemt binaries die **alleen stdin** gebruiken (bijvoorbeeld `cut`) en
in allowlist-modus worden uitgevoerd **zonder** expliciete allowlist-vermeldingen. Veilige binaries weigeren
positionele bestandsargumenten en padachtige tokens, zodat ze alleen op de
inkomende stream kunnen werken. Beschouw dit als een beperkt snel pad voor streamfilters, niet als een
algemene vertrouwenslijst.

<Warning>
Voeg **geen** interpreter- of runtime-binaries (bijvoorbeeld `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) toe aan `safeBins`. Als een opdracht door zijn ontwerp code kan evalueren,
subopdrachten kan uitvoeren of bestanden kan lezen, geef dan de voorkeur aan expliciete allowlist-vermeldingen
en houd goedkeuringsprompts ingeschakeld. Aangepaste veilige binaries moeten een expliciet
profiel definiëren in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Standaard veilige binaries:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` en `sort` staan niet in de standaardlijst. Als je ze inschakelt, behoud dan expliciete
allowlist-vermeldingen voor hun workflows die niet uitsluitend stdin gebruiken. Geef voor `grep` in de modus voor veilige binaries
het patroon op met `-e`/`--regexp`; de positionele patroonvorm wordt geweigerd,
zodat bestandsoperanden niet als dubbelzinnige positionele argumenten kunnen worden binnengesmokkeld.

### Argv-validatie en geweigerde vlaggen

Validatie is uitsluitend deterministisch op basis van de argv-vorm (zonder controles
of bestanden op het hostsysteem bestaan), wat voorkomt dat verschillen tussen toestaan en weigeren
als bestandsbestaan-orakel worden gebruikt. Bestandsgerichte opties worden voor standaard veilige binaries geweigerd; lange
opties worden fail-closed gevalideerd (onbekende vlaggen en dubbelzinnige afkortingen worden
geweigerd). Herkende alleen-lezen Booleaanse vlaggen van de standaardbinaries (bijvoorbeeld
`wc -l`, `tr -d`, `uniq -c`) worden geaccepteerd, terwijl niet-herkende korte vlaggen
fail-closed blijven en terugvallen op handmatige goedkeuring.

Geweigerde vlaggen per profiel voor veilige binaries:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Veilige binaries dwingen ook af dat argv-tokens tijdens de uitvoering als **letterlijke tekst**
worden behandeld (geen globbing en geen uitbreiding van `$VARS`) voor segmenten die alleen stdin gebruiken, zodat
patronen zoals `*` of `$HOME/...` niet kunnen worden gebruikt om het lezen van bestanden binnen te smokkelen. `awk`,
`sed` en `jq` worden altijd als veilige binaries geweigerd, omdat niet kan worden
gevalideerd dat hun semantiek uitsluitend stdin gebruikt: `jq` kan omgevingsgegevens lezen en jq-code uit
modules of opstartbestanden laden. Gebruik voor die hulpmiddelen een expliciete allowlist-vermelding of goedkeuringsprompt
in plaats van `safeBins`.

### Vertrouwde mappen voor binaries

Veilige binaries moeten worden gevonden in vertrouwde mappen voor binaries (systeemstandaarden plus
optioneel `tools.exec.safeBinTrustedDirs`). Vermeldingen in `PATH` worden nooit automatisch vertrouwd.
De standaard vertrouwde mappen zijn bewust minimaal: `/bin`, `/usr/bin`. Als
het uitvoerbare bestand van je veilige binary zich in paden van een pakketbeheerder of gebruiker bevindt (bijvoorbeeld
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), voeg deze dan
expliciet toe aan `tools.exec.safeBinTrustedDirs`.

### Shell-koppeling, wrappers en multiplexers

Shell-koppeling (`&&`, `||`, `;`) is toegestaan wanneer elk segment op het hoogste niveau
aan de allowlist voldoet (inclusief veilige binaries of automatische toestemming via Skills). Omleidingen
blijven niet ondersteund in allowlist-modus. Opdrachtsubstitutie (`$()` / backticks) wordt
tijdens het parseren van de allowlist geweigerd, ook binnen dubbele aanhalingstekens; gebruik enkele
aanhalingstekens als je letterlijke `$()`-tekst nodig hebt.

Bij goedkeuringen via de macOS-begeleidende app wordt onbewerkte shelltekst met shellbesturings- of
uitbreidingssyntaxis (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)
behandeld als een gemiste allowlist-overeenkomst, tenzij de shellbinary zelf op de allowlist staat.

Voor shellwrappers (`bash|sh|zsh ... -c/-lc`) worden omgevingsoverschrijvingen die alleen voor het verzoek gelden,
beperkt tot een kleine expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Bij `allow-always`-beslissingen in allowlist-modus slaan transparante dispatchwrappers
(bijvoorbeeld `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) het
pad van het interne uitvoerbare bestand op in plaats van het wrapperpad. Shellmultiplexers
(`busybox`, `toybox`) worden op dezelfde manier uitgepakt voor shellapplets (`sh`, `ash`, enzovoort).
Als een wrapper of multiplexer niet veilig kan worden uitgepakt, wordt er niet automatisch
een allowlist-vermelding opgeslagen.

Als je interpreters zoals `python3` of `node` op de allowlist zet, geef dan de voorkeur aan
`tools.exec.strictInlineEval=true`, zodat inline-evaluatie nog steeds expliciete
goedkeuring vereist. In strikte modus kan `allow-always` nog steeds onschuldige
interpreter-/scriptaanroepen opslaan, maar dragers van inline-evaluatie worden niet
automatisch opgeslagen.

### Veilige binaries tegenover allowlist

| Onderwerp         | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Doel             | Beperkte stdin-filters automatisch toestaan            | Specifieke uitvoerbare bestanden expliciet vertrouwen                              |
| Overeenkomsttype | Naam van uitvoerbaar bestand + argv-beleid voor veilige binary | Glob voor het opgeloste pad van het uitvoerbare bestand, of een glob met alleen de opdrachtnaam voor via PATH aangeroepen opdrachten |
| Argumentbereik   | Beperkt door het profiel voor veilige binaries en regels voor letterlijke tokens | Standaard padovereenkomst; optioneel kan `argPattern` geparseerde argv beperken              |
| Typische voorbeelden | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, aangepaste CLI's                                     |
| Beste toepassing | Teksttransformaties met laag risico in pijplijnen       | Elk hulpmiddel met breder gedrag of neveneffecten                                  |

Configuratielocatie:

- `safeBins` komt uit de configuratie (`tools.exec.safeBins` of `agents.list[].tools.exec.safeBins` per agent).
- `safeBinTrustedDirs` komt uit de configuratie (`tools.exec.safeBinTrustedDirs` of `agents.list[].tools.exec.safeBinTrustedDirs` per agent).
- `safeBinProfiles` komt uit de configuratie (`tools.exec.safeBinProfiles` of `agents.list[].tools.exec.safeBinProfiles` per agent). Profielsleutels per agent overschrijven globale sleutels.
- allowlist-vermeldingen staan in het lokale goedkeuringsbestand van de host onder `agents.<id>.allowlist` (of via de Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` waarschuwt met `tools.exec.safe_bins_interpreter_unprofiled` wanneer interpreter-/runtime-binaries zonder expliciete profielen voorkomen in `safeBins`.
- `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles.<bin>`-vermeldingen genereren als `{}` (controleer en beperk ze daarna verder). Interpreter-/runtime-binaries worden niet automatisch gegenereerd.

Voorbeeld van een aangepast profiel:

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Interpreter-/runtime-opdrachten

Door goedkeuring ondersteunde interpreter-/runtime-uitvoeringen zijn bewust conservatief:

- De exacte argv-/cwd-/env-context wordt altijd gebonden.
- Directe shellscript- en directe runtimebestandsvormen worden waar mogelijk gebonden aan één concrete lokale
  momentopname van een bestand.
- Veelgebruikte wrappervormen van pakketbeheerders die nog steeds naar één direct lokaal bestand verwijzen (bijvoorbeeld
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) worden vóór de binding uitgepakt.
- Als OpenClaw niet precies één concreet lokaal bestand voor een interpreter-/runtime-opdracht kan identificeren
  (bijvoorbeeld pakketscripts, evaluatievormen, runtime-specifieke loaderketens of dubbelzinnige vormen met meerdere bestanden),
  wordt door goedkeuring ondersteunde uitvoering geweigerd in plaats van semantische dekking te claimen die
  niet aanwezig is.
- Geef voor deze workflows de voorkeur aan sandboxing, een afzonderlijke hostgrens of een expliciete vertrouwde
  allowlist/volledige workflow waarbij de operator de bredere runtimesemantiek accepteert.

Wanneer goedkeuringen vereist zijn, retourneert het exec-hulpmiddel onmiddellijk een goedkeurings-id. Gebruik dat id om
latere systeemgebeurtenissen van goedgekeurde uitvoeringen te correleren (`Exec finished` en `Exec running` indien geconfigureerd).
Als er vóór de time-out geen beslissing binnenkomt, wordt het verzoek behandeld als een time-out van de goedkeuring en
weergegeven als definitieve weigering van een hostopdracht. Voor asynchrone goedkeuringen van de hoofdagent met een oorspronkelijke
sessie hervat OpenClaw die sessie ook met een interne follow-up, zodat de agent waarneemt dat
de opdracht niet is uitgevoerd, in plaats van later een ontbrekend resultaat te herstellen. Openstaande exec-goedkeuringen verlopen
standaard na 30 minuten.

### Bezorgingsgedrag van follow-ups

Nadat een goedgekeurde asynchrone exec is voltooid, stuurt OpenClaw een follow-up-`agent`-beurt naar dezelfde sessie.
Geweigerde asynchrone goedkeuringen gebruiken voor de weigeringsstatus hetzelfde follow-uppad naar de hoofdsessie, maar
registreren geen overdrachten voor verhoogde runtimebevoegdheden en voeren de opdracht niet uit. Weigeringen zonder een hervatbare
hoofdsessie worden onderdrukt of via een veilige directe route gerapporteerd wanneer die beschikbaar is.

- Als er een geldig extern bezorgingsdoel bestaat (bezorgbaar kanaal plus doel-`to`), gebruikt de follow-upbezorging dat kanaal.
- In workflows die alleen webchat of een interne sessie gebruiken en geen extern doel hebben, blijft de follow-upbezorging beperkt tot de sessie (`deliver: false`).
- Als een aanroeper expliciet strikte externe bezorging verzoekt zonder een oplosbaar extern kanaal, mislukt het verzoek met `INVALID_REQUEST`.
- Als `bestEffortDeliver` is ingeschakeld en er geen extern kanaal kan worden gevonden, wordt de bezorging teruggebracht tot alleen de sessie in plaats van te mislukken.

## Goedkeuringen doorsturen naar chatkanalen

Je kunt exec-goedkeuringsprompts doorsturen naar elk chatkanaal (inclusief pluginkanalen) en ze goedkeuren
met `/approve`. Hiervoor wordt de normale uitgaande bezorgingspijplijn gebruikt.

Configuratie:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Antwoord in de chat:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

De opdracht `/approve` verwerkt zowel exec-goedkeuringen als Plugin-goedkeuringen. Als de ID niet overeenkomt met een wachtende exec-goedkeuring, worden in plaats daarvan automatisch de Plugin-goedkeuringen gecontroleerd. Deze terugval is beperkt tot fouten van het type "goedkeuring niet gevonden"; bij een echte weigering/fout van een exec-goedkeuring wordt niet stilzwijgend opnieuw geprobeerd als Plugin-goedkeuring.

### Doorsturen van Plugin-goedkeuringen

Voor het doorsturen van Plugin-goedkeuringen wordt dezelfde afleveringspijplijn gebruikt als voor exec-goedkeuringen, maar met een eigen
onafhankelijke configuratie onder `approvals.plugin`. Het in- of uitschakelen van de ene heeft geen invloed op de andere.
Zie voor gedrag bij het ontwikkelen van Plugins, aanvraagvelden en beslissingssemantiek
[Plugin-machtigingsaanvragen](/plugins/plugin-permission-requests).

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

De configuratiestructuur is identiek aan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` en `targets` werken op dezelfde manier.

Kanalen die gedeelde interactieve antwoorden ondersteunen, geven dezelfde goedkeuringsknoppen weer voor zowel exec- als
Plugin-goedkeuringen. Kanalen zonder gedeelde interactieve UI vallen terug op platte tekst met `/approve`-
instructies. Aanvragen voor Plugin-goedkeuringen kunnen de beschikbare beslissingen beperken: goedkeuringsinterfaces gebruiken
de in de aanvraag opgegeven reeks beslissingen en de Gateway weigert pogingen om een beslissing in te dienen die
niet werd aangeboden.

### Goedkeuringen in dezelfde chat op elk kanaal

Wanneer een aanvraag voor een exec- of Plugin-goedkeuring afkomstig is van een afleverbaar chatoppervlak, kan diezelfde chat
deze standaard goedkeuren met `/approve`. Dit geldt naast de bestaande Web UI- en terminal-UI-stromen ook voor Slack, Matrix, Microsoft Teams en
vergelijkbare afleverbare chats, waarbij het normale kanaalautorisatiemodel voor dat gesprek wordt gebruikt. Als de oorspronkelijke chat al opdrachten kan verzenden
en antwoorden kan ontvangen, hebben goedkeuringsaanvragen niet langer een afzonderlijke systeemeigen afleveringsadapter nodig om
wachtend te blijven.

Discord, Telegram en QQ bot ondersteunen ook `/approve` in dezelfde chat, maar deze kanalen gebruiken nog steeds hun
vastgestelde lijst met goedkeurders voor autorisatie, zelfs wanneer systeemeigen aflevering van goedkeuringen is uitgeschakeld.

### Systeemeigen aflevering van goedkeuringen

Sommige kanalen kunnen ook als systeemeigen goedkeuringsclients fungeren: Discord, Slack, Telegram, Matrix en QQ bot.
Systeemeigen clients voegen privéberichten aan goedkeurders, distributie naar de oorspronkelijke chat en kanaalspecifieke interactieve goedkeurings-UX toe
boven op de gedeelde `/approve`-stroom in dezelfde chat.

Wanneer systeemeigen goedkeuringskaarten/-knoppen beschikbaar zijn, is die systeemeigen UI de primaire route voor de agent.
De agent hoort niet ook een dubbele `/approve`-opdracht in platte chattekst te herhalen, tenzij het toolresultaat aangeeft
dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring de enige resterende route is.

Als een systeemeigen goedkeuringsclient is geconfigureerd maar er geen systeemeigen runtime actief is voor het oorspronkelijke
kanaal, houdt OpenClaw de lokale deterministische `/approve`-prompt zichtbaar. Als de systeemeigen runtime
actief is en aflevering probeert, maar geen enkel doel de kaart ontvangt, stuurt OpenClaw in dezelfde chat een terugvalmelding
met de exacte opdracht `/approve <id> <decision>`, zodat de aanvraag nog steeds kan worden afgehandeld.

Algemeen model:

- het exec-beleid van de host bepaalt nog steeds of exec-goedkeuring vereist is
- `approvals.exec` regelt het doorsturen van goedkeuringsprompts naar andere chatbestemmingen
- `channels.<channel>.execApprovals` bepaalt of Discord, Slack, Telegram, QQ bot en vergelijkbare
  kanaalspecifieke systeemeigen clients zijn ingeschakeld
- Slack-Plugin-goedkeuringen kunnen de systeemeigen goedkeuringsclient van Slack gebruiken wanneer de aanvraag uit Slack afkomstig is
  en Slack-Plugin-goedkeurders worden vastgesteld; `approvals.plugin` kan Plugin-goedkeuringen ook naar Slack-
  sessies of -doelen routeren, zelfs wanneer Slack-exec-goedkeuringen zijn uitgeschakeld
- Systeemeigen goedkeuringskaarten van Google Chat verwerken exec- en Plugin-goedkeuringen die afkomstig zijn uit Google
  Chat-ruimten of -threads wanneer stabiele `users/<id>`-goedkeurders worden vastgesteld via `dm.allowFrom` of
  `defaultTo`; ze gebruiken geen reactiegebeurtenissen voor beslissingen
- De aflevering van goedkeuringen via reacties in WhatsApp en Signal wordt beheerst door `approvals.exec` en
  `approvals.plugin`; ze hebben geen `channels.<channel>.execApprovals`-blokken

Systeemeigen goedkeuringsclients schakelen aflevering met privéberichten als eerste optie automatisch in wanneer aan al deze voorwaarden wordt voldaan:

- het kanaal ondersteunt systeemeigen aflevering van goedkeuringen
- goedkeurders kunnen worden vastgesteld via expliciete `execApprovals.approvers` of de identiteit van de eigenaar,
  zoals `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` is niet ingesteld of is `"auto"`

Stel `enabled: false` in om een systeemeigen goedkeuringsclient expliciet uit te schakelen. Stel `enabled: true` in om deze geforceerd
in te schakelen wanneer goedkeurders worden vastgesteld. Openbare aflevering in de oorspronkelijke chat blijft expliciet via
`channels.<channel>.execApprovals.target`. Wanneer systeemeigen `target` aflevering in de oorspronkelijke chat inschakelt,
bevatten goedkeuringsprompts de opdrachttekst.

Veelgestelde vraag: [Waarom zijn er twee configuraties voor exec-goedkeuringen voor chatgoedkeuringen?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: configureer stabiele goedkeurders met `channels.googlechat.dm.allowFrom` of
  `channels.googlechat.defaultTo`; er is geen `execApprovals`-blok vereist
- WhatsApp: gebruik `approvals.exec` en `approvals.plugin` om goedkeuringsprompts naar WhatsApp te routeren
- Signal: gebruik `approvals.exec` en `approvals.plugin` om goedkeuringsprompts naar Signal te routeren

Routering specifiek voor systeemeigen clients:

- Telegram gebruikt standaard privéberichten aan goedkeurders (`target: "dm"`). Schakel over naar `channel` of `both` om
  goedkeuringsprompts ook in de oorspronkelijke Telegram-chat/het oorspronkelijke Telegram-onderwerp weer te geven. Voor Telegram-forumonderwerpen behoudt OpenClaw
  het onderwerp voor de goedkeuringsprompt en de opvolging na goedkeuring.
- Discord- en Telegram-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit
  `commands.ownerAllowFrom`; alleen vastgestelde goedkeurders kunnen goedkeuren of weigeren.
- Slack-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit
  `commands.ownerAllowFrom`. Privéberichten voor Slack-Plugin-goedkeuringen gebruiken Slack-Plugin-goedkeurders uit `allowFrom`
  en de standaardroutering van het account, niet Slack-exec-goedkeurders. Systeemeigen Slack-knoppen behouden het type goedkeurings-ID,
  zodat `plugin:`-ID's Plugin-goedkeuringen kunnen afhandelen zonder een tweede lokale terugvallaag in Slack.
- Systeemeigen kaarten van Google Chat behouden de handmatige `/approve`-terugval in de berichttekst, maar callbacks van kaartknoppen
  bevatten alleen ondoorzichtige actietokens; de goedkeurings-ID en beslissing worden opgehaald uit
  de wachtende status aan de serverzijde.
- WhatsApp-emoji-goedkeuringen verwerken zowel exec- als Plugin-prompts wanneer de overeenkomende routeringsgroep
  op het hoogste niveau naar WhatsApp routeert. Prompts van systeemeigen oorsprong worden rechtstreeks gekoppeld; gedeelde aflevering in doelmodus
  koppelt dezelfde getypeerde goedkeuringsmetadata aan het geaccepteerde ontvangstbewijs van het WhatsApp-bericht.
- Signal-reactiegoedkeuringen verwerken zowel exec- als Plugin-prompts alleen wanneer de overeenkomende routeringsgroep
  op het hoogste niveau is ingeschakeld en naar Signal routeert. Rechtstreekse Signal-exec-goedkeuringen in dezelfde chat kunnen
  de lokale `/approve`-terugval onderdrukken zonder expliciete goedkeurders; voor het afhandelen van Signal-reacties
  zijn nog steeds expliciete Signal-goedkeurders uit `channels.signal.allowFrom` of `defaultTo` vereist.
- Systeemeigen routering via privéberichten/kanalen en reactiesnelkoppelingen van Matrix verwerken zowel exec- als Plugin-goedkeuringen;
  autorisatie van Plugins blijft afkomstig uit `channels.matrix.dm.allowFrom`. Systeemeigen Matrix-prompts
  bevatten aangepaste `com.openclaw.approval`-gebeurtenisinhoud in de eerste promptgebeurtenis, zodat Matrix-clients
  met OpenClaw-ondersteuning de gestructureerde goedkeuringsstatus kunnen lezen, terwijl standaardclients de plattetekstterugval
  `/approve` behouden.
- Systeemeigen goedkeuringsknoppen van Discord en Telegram bevatten in transportprivé-callbackgegevens een expliciet eigenaartype voor exec of Plugin
  en handelen uitsluitend die eigenaar af. Oudere `/approve`-besturingselementen zonder
  type blijven een begrensd compatibiliteitspad: ze proberen alleen eigenaartypen die de actor mag goedkeuren,
  gaan alleen verder na het resultaat 'goedkeuring niet gevonden' en leiden eigenaarschap nooit af uit de goedkeurings-ID.
- De aanvrager hoeft geen goedkeurder te zijn.
- Als geen enkele operator-UI of geconfigureerde goedkeuringsclient de aanvraag kan accepteren, valt de prompt terug op
  `askFallback`.

Gevoelige groepsopdrachten die alleen voor de eigenaar zijn, zoals `/diagnostics` en `/export-trajectory`, gebruiken privéroutering
naar de eigenaar voor goedkeuringsprompts en eindresultaten. OpenClaw probeert eerst een privéroute op hetzelfde
oppervlak waarop de eigenaar de opdracht heeft uitgevoerd. Als dat oppervlak geen privéroute naar de eigenaar heeft, wordt
teruggevallen op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zodat een Discord-groepsopdracht
de goedkeuring en het resultaat nog steeds naar het Telegram-privébericht van de eigenaar kan sturen wanneer Telegram als
primaire privé-interface is geconfigureerd. De groepschat krijgt alleen een korte bevestiging.

Zie:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Officiële mobiele operator-apps

De officiële iOS- en Android-apps kunnen ook wachtende exec-goedkeuringen
van de Gateway beoordelen wanneer een `operator.admin`-verbinding wordt gebruikt of wanneer hun gekoppelde
`operator.approvals`-apparaat expliciet door de aanvraag als doel is aangewezen. Ze lezen
dezelfde opgeschoonde duurzame record die door de
Control UI wordt gebruikt, dienen een typebewuste beslissing in en tonen het canonieke
resultaat van het eerste antwoord van de Gateway. De Apple Watch spiegelt deze goedkeuringsprompts via
de gekoppelde iPhone, met acties voor eenmalig toestaan en weigeren. In de rechtstreekse Watch Gateway-modus
worden goedkeuringen niet beoordeeld.

Een verloren ontvangstbevestiging van de afhandeling maakt de ingediende keuze niet gezaghebbend:
de app schakelt de besturingselementen uit en leest de record opnieuw. Als een ander oppervlak
heeft gewonnen, toont de app die vastgelegde beslissing. Wachtende prompts blijven gekoppeld aan de
Gateway die ze heeft uitgegeven, dus door van actieve Gateway te wisselen kan een
oude goedkeurings-ID niet worden omgeleid.

### macOS IPC-stroom

```
Gateway -> Node-service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac-app (UI + goedkeuringen + system.run)
```

Beveiligingsopmerkingen:

- Unix-socketmodus `0600`, token opgeslagen in `exec-approvals.json`.
- Controle op peer met dezelfde UID.
- Uitdaging/antwoord (nonce + HMAC-token + aanvraaghash) + korte TTL.

## Veelgestelde vragen

### Wanneer worden `accountId` en `threadId` gebruikt voor een goedkeuringsdoel?

Gebruik `accountId` wanneer het kanaal meerdere geconfigureerde identiteiten heeft en de goedkeuringsprompt
via één specifiek account moet worden verzonden. Gebruik `threadId` wanneer de bestemming onderwerpen of
threads ondersteunt en de prompt binnen die thread moet blijven in plaats van in de chat op het hoogste niveau.

Een concreet Telegram-geval is een operationele supergroep met forumonderwerpen en twee Telegram-botaccounts.
De waarde `to` benoemt de supergroep, `accountId` selecteert het botaccount en `threadId`
selecteert het forumonderwerp:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operations bot",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Met deze configuratie worden doorgestuurde exec-goedkeuringen door het Telegram-account `ops-bot` geplaatst in onderwerp
`77` van chat `-1001234567890`. Een doel zonder `accountId` gebruikt het standaardaccount van het kanaal en
een doel zonder `threadId` plaatst het bericht in de bestemming op het hoogste niveau.

### Wanneer goedkeuringen naar een sessie worden verzonden, kan iedereen in die sessie ze dan goedkeuren?

Nee. Levering aan een sessie bepaalt alleen waar de prompt verschijnt. Daarmee wordt niet automatisch elke
deelnemer aan die chat gemachtigd om goedkeuring te verlenen.

Voor generieke `/approve` in dezelfde chat moet de afzender al gemachtigd zijn voor opdrachten in die
kanaalsessie. Als het kanaal expliciete goedkeurders voor goedkeuringen beschikbaar stelt, kunnen die goedkeurders
de actie `/approve` autoriseren, zelfs als ze anders niet gemachtigd zijn voor opdrachten in die sessie.

Sommige kanalen zijn strenger. Discord, Telegram, Matrix, systeemeigen Slack-DM's voor goedkeuringen en vergelijkbare
systeemeigen goedkeuringsclients gebruiken hun vastgestelde lijsten met goedkeurders voor goedkeuringsautorisatie. Zo
kan een Telegram-goedkeuringsprompt voor een forumonderwerp zichtbaar zijn voor iedereen in het onderwerp, maar kunnen alleen numerieke
Telegram-gebruikers-ID's die zijn vastgesteld via `channels.telegram.execApprovals.approvers` of
`commands.ownerAllowFrom` deze goedkeuren of weigeren.

## Gerelateerd

- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals) — kernbeleid en goedkeuringsproces
- [Uitvoeringstool](/nl/tools/exec)
- [Verhoogde modus](/nl/tools/elevated)
- [Skills](/nl/tools/skills) — door skills ondersteund gedrag voor automatisch toestaan
