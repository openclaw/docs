---
read_when:
    - Veilige bins of aangepaste veilige-binprofielen configureren
    - Goedkeuringen doorsturen naar Slack/Discord/Telegram of andere chatkanalen
    - Een native goedkeuringsclient implementeren voor een kanaal
summary: 'Geavanceerde exec-goedkeuringen: veilige binaries, interpreterbinding, goedkeuringsdoorgifte, native levering'
title: Uitvoeringsgoedkeuringen — geavanceerd
x-i18n:
    generated_at: "2026-06-27T18:25:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Geavanceerde onderwerpen voor exec-goedkeuringen: de snelle route `safeBins`, interpreter-/runtimebinding en doorsturen van goedkeuringen naar chatkanalen (inclusief native bezorging).
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het kernbeleid en de goedkeuringsflow.

## Veilige bins (alleen stdin)

`tools.exec.safeBins` definieert een kleine lijst met binaire bestanden die **alleen stdin** gebruiken (bijvoorbeeld `cut`) en die in allowlist-modus **zonder** expliciete allowlist-vermeldingen kunnen worden uitgevoerd. Veilige bins weigeren positionele bestandsargumenten en padachtige tokens, zodat ze alleen op de binnenkomende stream kunnen werken. Behandel dit als een smalle snelle route voor streamfilters, niet als een algemene vertrouwenslijst.

<Warning>
Voeg **geen** interpreter- of runtime-binaries (bijvoorbeeld `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) toe aan `safeBins`. Als een opdracht code kan evalueren, subopdrachten kan uitvoeren of standaard bestanden kan lezen, geef dan de voorkeur aan expliciete allowlist-vermeldingen en houd goedkeuringsprompts ingeschakeld. Aangepaste veilige bins moeten een expliciet profiel definiëren in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Standaard veilige bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` en `sort` staan niet in de standaardlijst. Als je ze expliciet inschakelt, behoud dan expliciete allowlist-vermeldingen voor hun workflows die niet via stdin lopen. Geef voor `grep` in safe-bin-modus het patroon op met `-e`/`--regexp`; de positionele patroonvorm wordt geweigerd, zodat bestandsoperanden niet als dubbelzinnige positionele argumenten kunnen worden meegesmokkeld.

### Argv-validatie en geweigerde vlaggen

Validatie is deterministisch op basis van alleen de argv-vorm (geen controles op het bestaan van bestanden op het hostsysteem), wat voorkomt dat allow/deny-verschillen als oracle voor bestandsbestaan werken. Bestandsgerichte opties worden geweigerd voor standaard veilige bins; lange opties worden fail-closed gevalideerd (onbekende vlaggen en dubbelzinnige afkortingen worden geweigerd).

Geweigerde vlaggen per safe-bin-profiel:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Veilige bins dwingen ook af dat argv-tokens tijdens uitvoering als **letterlijke tekst** worden behandeld (geen globbing en geen uitbreiding van `$VARS`) voor segmenten die alleen stdin gebruiken, zodat patronen zoals `*` of `$HOME/...` niet kunnen worden gebruikt om bestandslezingen mee te smokkelen.

### Vertrouwde binaire mappen

Veilige bins moeten worden herleid vanuit vertrouwde binaire mappen (systeemstandaarden plus optioneel `tools.exec.safeBinTrustedDirs`). `PATH`-vermeldingen worden nooit automatisch vertrouwd. De standaard vertrouwde mappen zijn bewust minimaal: `/bin`, `/usr/bin`. Als je safe-bin-executable in package-manager-/gebruikerspaden staat (bijvoorbeeld `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), voeg die dan expliciet toe aan `tools.exec.safeBinTrustedDirs`.

### Shellketens, wrappers en multiplexers

Shellketens (`&&`, `||`, `;`) zijn toegestaan wanneer elk segment op topniveau voldoet aan de allowlist (inclusief veilige bins of automatische toestemming via Skills). Redirections blijven niet ondersteund in allowlist-modus. Opdrachtsubstitutie (`$()` / backticks) wordt geweigerd tijdens allowlist-parsing, ook binnen dubbele aanhalingstekens; gebruik enkele aanhalingstekens als je letterlijke `$()`-tekst nodig hebt.

Bij goedkeuringen via de macOS companion-app wordt ruwe shelltekst die shellcontrole- of uitbreidingssyntaxis bevat (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) behandeld als een allowlist-misser, tenzij de shellbinary zelf op de allowlist staat.

Voor shellwrappers (`bash|sh|zsh ... -c/-lc`) worden request-scoped env-overrides teruggebracht tot een kleine expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Voor `allow-always`-beslissingen in allowlist-modus slaan bekende dispatch-wrappers (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) het pad van de innerlijke executable op in plaats van het wrapperpad. Shellmultiplexers (`busybox`, `toybox`) worden voor shellapplets (`sh`, `ash`, enz.) op dezelfde manier uitgepakt. Als een wrapper of multiplexer niet veilig kan worden uitgepakt, wordt er automatisch geen allowlist-vermelding opgeslagen.

Als je interpreters zoals `python3` of `node` op de allowlist zet, geef dan de voorkeur aan `tools.exec.strictInlineEval=true`, zodat inline eval nog steeds expliciete goedkeuring vereist. In strikte modus kan `allow-always` nog steeds onschuldige interpreter-/scriptaanroepen opslaan, maar inline-eval-dragers worden niet automatisch opgeslagen.

### Veilige bins versus allowlist

| Onderwerp        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                   |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Doel             | Smalle stdin-filters automatisch toestaan              | Specifieke executables expliciet vertrouwen                                         |
| Matchtype        | Executablenaam + safe-bin-argv-beleid                  | Opgeloste executable-padglob, of kale opdrachtnaamglob voor via PATH aangeroepen opdrachten |
| Argumentbereik   | Beperkt door safe-bin-profiel en regels voor letterlijke tokens | Padmatch standaard; optioneel kan `argPattern` geparsede argv beperken              |
| Typische voorbeelden | `head`, `tail`, `tr`, `wc`                         | `jq`, `python3`, `node`, `ffmpeg`, aangepaste CLI's                                 |
| Beste gebruik    | Teksttransformaties met laag risico in pipelines       | Elk hulpmiddel met breder gedrag of bijwerkingen                                    |

Configuratielocatie:

- `safeBins` komt uit config (`tools.exec.safeBins` of per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` komt uit config (`tools.exec.safeBinTrustedDirs` of per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` komt uit config (`tools.exec.safeBinProfiles` of per-agent `agents.list[].tools.exec.safeBinProfiles`). Profielsleutels per agent overschrijven globale sleutels.
- allowlist-vermeldingen staan in het host-lokale goedkeuringsbestand onder `agents.<id>.allowlist` (of via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` waarschuwt met `tools.exec.safe_bins_interpreter_unprofiled` wanneer interpreter-/runtime-bins in `safeBins` voorkomen zonder expliciete profielen.
- `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles.<bin>`-vermeldingen als `{}` scaffolden (controleer en verscherp daarna). Interpreter-/runtime-bins worden niet automatisch gescaffold.

Voorbeeld van aangepast profiel:
__OC_I18N_900000__
Als je `jq` expliciet opneemt in `safeBins`, weigert OpenClaw nog steeds de `env` builtin in safe-bin-modus, zodat `jq -n env` de omgeving van het hostproces niet kan dumpen zonder expliciet allowlist-pad of goedkeuringsprompt.

## Interpreter-/runtimeopdrachten

Door goedkeuring ondersteunde interpreter-/runtime-uitvoeringen zijn bewust conservatief:

- Exacte argv-/cwd-/env-context wordt altijd gebonden.
- Directe shellscript- en directe runtimebestandsvormen worden naar beste vermogen gebonden aan één concrete lokale bestandssnapshot.
- Veelvoorkomende wrappervormen van package managers die nog steeds naar één direct lokaal bestand herleiden (bijvoorbeeld `pnpm exec`, `pnpm node`, `npm exec`, `npx`) worden uitgepakt vóór binding.
- Als OpenClaw niet precies één concreet lokaal bestand voor een interpreter-/runtimeopdracht kan identificeren (bijvoorbeeld packagescripts, eval-vormen, runtime-specifieke loaderketens of dubbelzinnige multi-bestandsvormen), wordt door goedkeuring ondersteunde uitvoering geweigerd in plaats van semantische dekking te claimen die er niet is.
- Geef voor die workflows de voorkeur aan sandboxing, een aparte hostgrens of een expliciete vertrouwde allowlist-/volledige workflow waarbij de operator de bredere runtimesemantiek accepteert.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool onmiddellijk een goedkeurings-id. Gebruik die id om latere systeemgebeurtenissen van goedgekeurde uitvoeringen te correleren (`Exec finished`, en `Exec running` wanneer geconfigureerd). Als er vóór de timeout geen beslissing binnenkomt, wordt het verzoek behandeld als een goedkeuringstimeout en weergegeven als een terminale weigering van de hostopdracht. Voor asynchrone goedkeuringen van de hoofdagent met een oorspronkelijke sessie hervat OpenClaw die sessie ook met een interne follow-up, zodat de agent ziet dat de opdracht niet is uitgevoerd in plaats van later een ontbrekend resultaat te repareren.

### Gedrag van follow-upbezorging

Nadat een goedgekeurde asynchrone exec is voltooid, stuurt OpenClaw een follow-up `agent`-turn naar dezelfde sessie. Geweigerde asynchrone goedkeuringen gebruiken hetzelfde follow-uppad van de hoofdsessie voor de weigeringsstatus, maar registreren geen verhoogde runtimehandoffs en voeren de opdracht niet uit. Weigeringen zonder hervatbare hoofdsessie worden onderdrukt of gerapporteerd via een veilige directe route wanneer die bestaat.

- Als er een geldig extern bezorgdoel bestaat (bezorgbaar kanaal plus doel `to`), gebruikt follow-upbezorging dat kanaal.
- In webchat-only of interne sessieflows zonder extern doel blijft follow-upbezorging alleen sessiegebonden (`deliver: false`).
- Als een caller expliciet strikte externe bezorging aanvraagt zonder herleidbaar extern kanaal, mislukt het verzoek met `INVALID_REQUEST`.
- Als `bestEffortDeliver` is ingeschakeld en er geen extern kanaal kan worden herleid, wordt bezorging verlaagd naar alleen sessiegebonden in plaats van te mislukken.

## Goedkeuringen doorsturen naar chatkanalen

Je kunt exec-goedkeuringsprompts doorsturen naar elk chatkanaal (inclusief Pluginkanalen) en ze goedkeuren met `/approve`. Dit gebruikt de normale outbound-bezorgpipeline.

Config:
__OC_I18N_900001__
Antwoord in chat:
__OC_I18N_900002__
De opdracht `/approve` verwerkt zowel exec-goedkeuringen als Plugin-goedkeuringen. Als de ID niet overeenkomt met een wachtende exec-goedkeuring, controleert de opdracht automatisch in plaats daarvan Plugin-goedkeuringen.

### Doorsturen van Plugin-goedkeuringen

Het doorsturen van Plugin-goedkeuringen gebruikt dezelfde bezorgpipeline als exec-goedkeuringen, maar heeft een eigen onafhankelijke config onder `approvals.plugin`. Het in- of uitschakelen van de ene heeft geen invloed op de andere. Zie [Plugin-machtigingsverzoeken](/plugins/plugin-permission-requests) voor Plugin-authoring-gedrag, requestvelden en beslissingssemantiek.
__OC_I18N_900003__
De configvorm is identiek aan `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` en `targets` werken op dezelfde manier.

Kanalen die gedeelde interactieve antwoorden ondersteunen, renderen dezelfde goedkeuringsknoppen voor zowel exec- als Plugin-goedkeuringen. Kanalen zonder gedeelde interactieve UI vallen terug op platte tekst met `/approve`-instructies.
Plugin-goedkeuringsverzoeken kunnen de beschikbare beslissingen beperken. Goedkeuringsoppervlakken gebruiken de door het verzoek gedeclareerde beslissingsset, en de Gateway weigert pogingen om een beslissing in te dienen die niet is aangeboden.

### Goedkeuringen in dezelfde chat op elk kanaal

Wanneer een exec- of Plugin-goedkeuringsverzoek afkomstig is van een bezorgbaar chatoppervlak, kan dezelfde chat het nu standaard goedkeuren met `/approve`. Dit geldt naast de bestaande Web UI- en terminal-UI-flows ook voor kanalen zoals Slack, Matrix en Microsoft Teams.

Dit gedeelde pad voor tekstopdrachten gebruikt het normale kanaal-authenticatiemodel voor dat gesprek. Als de
oorspronkelijke chat al opdrachten kan versturen en antwoorden kan ontvangen, hebben goedkeuringsverzoeken geen
aparte native bezorgadapter meer nodig om alleen maar in behandeling te blijven.

Discord en Telegram ondersteunen ook `/approve` in dezelfde chat, maar die kanalen gebruiken nog steeds hun
opgeloste lijst met goedkeurders voor autorisatie, zelfs wanneer native goedkeuringsbezorging is uitgeschakeld.

Voor Telegram en andere native goedkeuringsclients die de Gateway rechtstreeks aanroepen,
is deze fallback bewust beperkt tot fouten waarbij "goedkeuring niet gevonden" is. Een echte
weigering/fout voor exec-goedkeuring probeert niet stilzwijgend opnieuw als Plugin-goedkeuring.

### Native goedkeuringsbezorging

Sommige kanalen kunnen ook als native goedkeuringsclients fungeren. Native clients voegen goedkeurders-DM's, fanout naar de oorspronkelijke chat
en kanaalspecifieke interactieve goedkeurings-UX toe bovenop de gedeelde `/approve`-flow in dezelfde chat.

Wanneer native goedkeuringskaarten/knoppen beschikbaar zijn, is die native UI het primaire
pad voor agents. De agent moet niet ook een dubbele platte chatopdracht
`/approve` echoën, tenzij het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of
handmatige goedkeuring het enige resterende pad is.

Als een native goedkeuringsclient is geconfigureerd maar er geen native runtime actief is voor
het oorspronkelijke kanaal, houdt OpenClaw de lokale deterministische `/approve`-prompt zichtbaar. Als de native runtime actief is en bezorging probeert maar geen
doel de kaart ontvangt, stuurt OpenClaw een fallbackmelding in dezelfde chat met de
exacte opdracht `/approve <id> <decision>`, zodat het verzoek nog steeds kan worden afgehandeld.

Generiek model:

- hostbeleid voor exec bepaalt nog steeds of exec-goedkeuring vereist is
- `approvals.exec` regelt het doorsturen van goedkeuringsprompts naar andere chatbestemmingen
- `channels.<channel>.execApprovals` regelt of Discord, Slack, Telegram en vergelijkbare
  kanaalspecifieke native clients zijn ingeschakeld
- Slack Plugin-goedkeuringen kunnen Slacks native goedkeuringsclient gebruiken wanneer het verzoek uit Slack komt
  en Slack Plugin-goedkeurders worden opgelost; `approvals.plugin` kan Plugin-goedkeuringen ook routeren naar Slack
  sessies of doelen, zelfs wanneer Slack exec-goedkeuringen zijn uitgeschakeld
- Google Chat native goedkeuringskaarten verwerken exec- en Plugin-goedkeuringen die afkomstig zijn uit Google
  Chat-ruimtes of threads wanneer stabiele `users/<id>`-goedkeurders worden opgelost uit `dm.allowFrom` of
  `defaultTo`; ze gebruiken geen reactiegebeurtenissen voor beslissingen
- WhatsApp- en Signal-reactiegoedkeuringsbezorging worden begrensd door `approvals.exec` en
  `approvals.plugin`; ze hebben geen `channels.<channel>.execApprovals`-blokken

Native goedkeuringsclients schakelen DM-eerst-bezorging automatisch in wanneer al het volgende waar is:

- het kanaal ondersteunt native goedkeuringsbezorging
- goedkeurders kunnen worden opgelost uit expliciete `execApprovals.approvers` of eigenaar-
  identiteit zoals `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` is niet ingesteld of is `"auto"`

Stel `enabled: false` in om een native goedkeuringsclient expliciet uit te schakelen. Stel `enabled: true` in om
deze te forceren wanneer goedkeurders worden opgelost. Publieke bezorging naar de oorspronkelijke chat blijft expliciet via
`channels.<channel>.execApprovals.target`.

FAQ: [Waarom zijn er twee exec-goedkeuringsconfiguraties voor chatgoedkeuringen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: configureer stabiele goedkeurders met `channels.googlechat.dm.allowFrom` of
  `channels.googlechat.defaultTo`; er is geen `execApprovals`-blok vereist
- WhatsApp: gebruik `approvals.exec` en `approvals.plugin` om goedkeuringsprompts naar WhatsApp te routeren
- Signal: gebruik `approvals.exec` en `approvals.plugin` om goedkeuringsprompts naar Signal te routeren

Deze native goedkeuringsclients voegen DM-routering en optionele kanaalfanout toe bovenop de gedeelde
`/approve`-flow in dezelfde chat en gedeelde goedkeuringsknoppen.

Gedeeld gedrag:

- Slack, Matrix, Microsoft Teams en vergelijkbare bezorgbare chats gebruiken het normale kanaal-authenticatiemodel
  voor `/approve` in dezelfde chat
- wanneer een native goedkeuringsclient automatisch wordt ingeschakeld, is het standaard native bezorgdoel goedkeurders-DM's
- voor Discord en Telegram kunnen alleen opgeloste goedkeurders goedkeuren of weigeren
- Discord-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- Telegram-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- Slack-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- Slack Plugin-goedkeurings-DM's gebruiken Slack Plugin-goedkeurders uit `allowFrom` en standaardroutering
  van accounts, niet Slack exec-goedkeurders
- Slack native knoppen behouden het type goedkeurings-id, zodat `plugin:`-id's Plugin-goedkeuringen kunnen oplossen
  zonder een tweede Slack-lokale fallbacklaag
- Google Chat native kaarten behouden de handmatige `/approve`-fallback in berichttekst, maar callbacks van kaartknoppen
  dragen alleen ondoorzichtige actietokens; goedkeurings-id en beslissing worden hersteld uit server-side
  in behandeling zijnde status
- WhatsApp-emoji-goedkeuringen verwerken zowel exec- als Plugin-prompts alleen wanneer de overeenkomende forwardingfamilie op topniveau
  is ingeschakeld en naar WhatsApp routeert; WhatsApp-forwarding met alleen doel blijft op
  het gedeelde forwardingpad, tenzij dit overeenkomt met hetzelfde native oorsprongsdoel
- Signal-reactiegoedkeuringen verwerken zowel exec- als Plugin-prompts alleen wanneer de overeenkomende forwardingfamilie op topniveau
  is ingeschakeld en naar Signal routeert. Rechtstreekse Signal-exec-goedkeuringen in dezelfde chat kunnen
  de lokale `/approve`-fallback onderdrukken zonder expliciete goedkeurders; Signal-reactieoplossing
  vereist nog steeds expliciete Signal-goedkeurders uit `channels.signal.allowFrom` of `defaultTo`.
- Matrix native DM-/kanaalroutering en reactiesnelkoppelingen verwerken zowel exec- als Plugin-goedkeuringen;
  Plugin-autorisatie komt nog steeds uit `channels.matrix.dm.allowFrom`
- Matrix native prompts bevatten aangepaste eventinhoud `com.openclaw.approval` in de eerste prompt-
  gebeurtenis, zodat OpenClaw-bewuste Matrix-clients gestructureerde goedkeuringsstatus kunnen lezen terwijl standaardclients
  de platte-tekstfallback `/approve` behouden
- de aanvrager hoeft geen goedkeurder te zijn
- de oorspronkelijke chat kan rechtstreeks goedkeuren met `/approve` wanneer die chat al opdrachten en antwoorden ondersteunt
- native Discord-goedkeuringsknoppen routeren op basis van het type goedkeurings-id: `plugin:`-id's gaan
  rechtstreeks naar Plugin-goedkeuringen, al het andere gaat naar exec-goedkeuringen
- native Telegram-goedkeuringsknoppen volgen dezelfde begrensde exec-naar-Plugin-fallback als `/approve`
- wanneer native `target` bezorging naar de oorspronkelijke chat inschakelt, bevatten goedkeuringsprompts de opdrachttekst
- in behandeling zijnde exec-goedkeuringen verlopen standaard na 30 minuten
- als geen operator-UI of geconfigureerde goedkeuringsclient het verzoek kan accepteren, valt de prompt terug op `askFallback`

Gevoelige opdrachten voor alleen eigenaars in groepen, zoals `/diagnostics` en `/export-trajectory`, gebruiken privé-
eigenaarroutering voor goedkeuringsprompts en eindresultaten. OpenClaw probeert eerst een privéroute op het
zelfde oppervlak waar de eigenaar de opdracht uitvoerde. Als dat oppervlak geen privé-eigenaarroute heeft, valt het
terug op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zodat een Discord-groepsopdracht
de goedkeuring en het resultaat nog steeds naar de Telegram-DM van de eigenaar kan sturen wanneer Telegram de geconfigureerde
primaire privé-interface is. De groepschat krijgt alleen een korte bevestiging.

Telegram gebruikt standaard goedkeurders-DM's (`target: "dm"`). Je kunt overschakelen naar `channel` of `both` wanneer je
wilt dat goedkeuringsprompts ook in de oorspronkelijke Telegram-chat/topic verschijnen. Voor Telegram-forumtopics
behoudt OpenClaw het topic voor de goedkeuringsprompt en de opvolging na goedkeuring.

Zie:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC-flow
__OC_I18N_900004__
Beveiligingsnotities:

- Unix-socketmodus `0600`, token opgeslagen in `exec-approvals.json`.
- Controle van peer met dezelfde UID.
- Challenge/response (nonce + HMAC-token + requesthash) + korte TTL.

## FAQ

### Wanneer zouden `accountId` en `threadId` worden gebruikt op een goedkeuringsdoel?

Gebruik `accountId` wanneer het kanaal meerdere geconfigureerde identiteiten heeft en de goedkeuringsprompt
via één specifiek account moet vertrekken. Gebruik `threadId` wanneer de bestemming topics of
threads ondersteunt en de prompt binnen die thread moet blijven in plaats van in de chat op topniveau.

Een concreet Telegram-geval is een operations-supergroep met forumtopics en twee Telegram-bot-
accounts. De `to`-waarde benoemt de supergroep, `accountId` selecteert het botaccount en `threadId`
selecteert het forumtopic:
__OC_I18N_900005__
Met die setup worden doorgestuurde exec-goedkeuringen door het Telegram-account `ops-bot` geplaatst in topic
`77` van chat `-1001234567890`. Een doel zonder `accountId` gebruikt het standaardaccount van het kanaal, en
een doel zonder `threadId` plaatst in de bestemming op topniveau.

### Wanneer goedkeuringen naar een sessie worden gestuurd, kan iedereen in die sessie ze dan goedkeuren?

Nee. Sessiebezorging bepaalt alleen waar de prompt verschijnt. Het autoriseert op zichzelf niet elke
deelnemer in die chat om goed te keuren.

Voor generieke `/approve` in dezelfde chat moet de afzender al geautoriseerd zijn voor opdrachten in die
kanaalsessie. Als het kanaal expliciete goedkeuringsgoedkeurders beschikbaar stelt, kunnen die goedkeurders
de `/approve`-actie autoriseren, zelfs wanneer ze verder niet opdrachtgeautoriseerd zijn in die sessie.

Sommige kanalen zijn strenger. Discord, Telegram, Matrix, Slack native goedkeurings-DM's en vergelijkbare
native goedkeuringsclients gebruiken hun opgeloste goedkeurderslijsten voor goedkeuringsautorisatie. Bijvoorbeeld:
een Telegram-forumtopic-goedkeuringsprompt kan zichtbaar zijn voor iedereen in het topic, maar alleen numerieke
Telegram-gebruikers-ID's die zijn opgelost uit `channels.telegram.execApprovals.approvers` of
`commands.ownerAllowFrom` kunnen deze goedkeuren of weigeren.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — kernbeleid en goedkeuringsflow
- [Exec-tool](/nl/tools/exec)
- [Verhoogde modus](/nl/tools/elevated)
- [Skills](/nl/tools/skills) — door Skills ondersteund auto-allow-gedrag
