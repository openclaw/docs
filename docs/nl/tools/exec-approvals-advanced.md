---
read_when:
    - Veilige bins of aangepaste profielen voor veilige bins configureren
    - Goedkeuringen doorsturen naar Slack/Discord/Telegram of andere chatkanalen
    - Een native goedkeuringsclient voor een kanaal implementeren
summary: 'Geavanceerde exec-goedkeuringen: veilige bins, interpreterbinding, goedkeuringsdoorsturing, native levering'
title: Goedkeuringen voor uitvoering — geavanceerd
x-i18n:
    generated_at: "2026-04-29T23:23:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Geavanceerde onderwerpen voor exec-goedkeuring: het snelle pad `safeBins`, interpreter/runtime-binding en goedkeuringsdoorsturing naar chatkanalen (inclusief native bezorging). Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het kernbeleid en de goedkeuringsstroom.

## Veilige bins (alleen stdin)

`tools.exec.safeBins` definieert een kleine lijst met **alleen-stdin** binaries (bijvoorbeeld `cut`) die in allowlist-modus kunnen worden uitgevoerd **zonder** expliciete allowlist-vermeldingen. Veilige bins weigeren positionele bestandsargumenten en padachtige tokens, zodat ze alleen op de binnenkomende stream kunnen werken. Behandel dit als een beperkt snel pad voor streamfilters, niet als een algemene vertrouwenslijst.

<Warning>
Voeg **geen** interpreter- of runtime-binaries (bijvoorbeeld `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) toe aan `safeBins`. Als een opdracht code kan evalueren, subopdrachten kan uitvoeren of ontworpen is om bestanden te lezen, gebruik dan liever expliciete allowlist-vermeldingen en houd goedkeuringsprompts ingeschakeld. Aangepaste veilige bins moeten een expliciet profiel definiëren in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Standaard veilige bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` en `sort` staan niet in de standaardlijst. Als je ze inschakelt, behoud dan expliciete allowlist-vermeldingen voor hun niet-stdin-workflows. Geef voor `grep` in safe-bin-modus het patroon op met `-e`/`--regexp`; de positionele patroonvorm wordt geweigerd, zodat bestandsoperanden niet als dubbelzinnige positionele argumenten kunnen worden binnengesmokkeld.

### Argv-validatie en geweigerde flags

Validatie is deterministisch op basis van alleen de argv-vorm (geen controles op het bestaan van bestanden op het hostsysteem), wat voorkomt dat allow/deny-verschillen als file-existence oracle kunnen werken. Bestandsgerichte opties worden geweigerd voor standaard veilige bins; lange opties worden fail-closed gevalideerd (onbekende flags en dubbelzinnige afkortingen worden geweigerd).

Geweigerde flags per safe-bin-profiel:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Veilige bins dwingen ook af dat argv-tokens tijdens uitvoering als **letterlijke tekst** worden behandeld (geen globbing en geen uitbreiding van `$VARS`) voor alleen-stdin-segmenten, zodat patronen zoals `*` of `$HOME/...` niet kunnen worden gebruikt om bestandslezingen binnen te smokkelen.

### Vertrouwde binary-mappen

Veilige bins moeten worden opgelost vanuit vertrouwde binary-mappen (systeemstandaarden plus optioneel `tools.exec.safeBinTrustedDirs`). `PATH`-vermeldingen worden nooit automatisch vertrouwd. De standaard vertrouwde mappen zijn bewust minimaal: `/bin`, `/usr/bin`. Als je safe-bin-uitvoerbare bestand in pakketbeheerder-/gebruikerspaden staat (bijvoorbeeld `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), voeg die dan expliciet toe aan `tools.exec.safeBinTrustedDirs`.

### Shell-chaining, wrappers en multiplexers

Shell-chaining (`&&`, `||`, `;`) is toegestaan wanneer elk top-level segment voldoet aan de allowlist (inclusief veilige bins of automatische Skills-allow). Omleidingen blijven niet ondersteund in allowlist-modus. Opdrachtvervanging (`$()` / backticks) wordt geweigerd tijdens allowlist-parsing, ook binnen dubbele aanhalingstekens; gebruik enkele aanhalingstekens als je letterlijke `$()`-tekst nodig hebt.

Bij macOS-goedkeuringen via de companion-app wordt ruwe shelltekst met shell-control- of uitbreidingssyntaxis (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) behandeld als een allowlist-misser, tenzij de shell-binary zelf op de allowlist staat.

Voor shell-wrappers (`bash|sh|zsh ... -c/-lc`) worden request-scoped env-overrides teruggebracht tot een kleine expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Voor `allow-always`-beslissingen in allowlist-modus slaan bekende dispatch-wrappers (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) het pad van het interne uitvoerbare bestand op in plaats van het wrapperpad. Shell-multiplexers (`busybox`, `toybox`) worden op dezelfde manier uitgepakt voor shell-applets (`sh`, `ash`, enz.). Als een wrapper of multiplexer niet veilig kan worden uitgepakt, wordt er automatisch geen allowlist-vermelding opgeslagen.

Als je interpreters zoals `python3` of `node` op de allowlist zet, gebruik dan bij voorkeur `tools.exec.strictInlineEval=true`, zodat inline eval nog steeds een expliciete goedkeuring vereist. In strikte modus kan `allow-always` nog steeds onschuldige interpreter-/scriptaanroepen opslaan, maar inline-eval-dragers worden niet automatisch opgeslagen.

### Veilige bins versus allowlist

| Onderwerp        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Doel             | Beperkte stdin-filters automatisch toestaan            | Specifieke uitvoerbare bestanden expliciet vertrouwen                              |
| Matchtype        | Naam van uitvoerbaar bestand + safe-bin argv-beleid    | Glob voor opgelost pad van uitvoerbaar bestand, of kale opdrachtnaamglob voor via PATH aangeroepen opdrachten |
| Argumentscope    | Beperkt door safe-bin-profiel en regels voor letterlijke tokens | Alleen padmatch; argumenten zijn verder je eigen verantwoordelijkheid               |
| Typische voorbeelden | `head`, `tail`, `tr`, `wc`                         | `jq`, `python3`, `node`, `ffmpeg`, aangepaste CLI's                                |
| Beste gebruik    | Teksttransformaties met laag risico in pipelines       | Elk hulpmiddel met breder gedrag of bijwerkingen                                   |

Configuratielocatie:

- `safeBins` komt uit configuratie (`tools.exec.safeBins` of per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` komt uit configuratie (`tools.exec.safeBinTrustedDirs` of per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` komt uit configuratie (`tools.exec.safeBinProfiles` of per-agent `agents.list[].tools.exec.safeBinProfiles`). Profielsleutels per agent overschrijven globale sleutels.
- allowlist-vermeldingen staan in host-lokale `~/.openclaw/exec-approvals.json` onder `agents.<id>.allowlist` (of via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` waarschuwt met `tools.exec.safe_bins_interpreter_unprofiled` wanneer interpreter-/runtime-bins in `safeBins` voorkomen zonder expliciete profielen.
- `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles.<bin>`-vermeldingen scaffolden als `{}` (controleer en verscherp daarna). Interpreter-/runtime-bins worden niet automatisch gescaffold.

Voorbeeld van aangepast profiel:
__OC_I18N_900000__
Als je `jq` expliciet toevoegt aan `safeBins`, weigert OpenClaw nog steeds de `env` builtin in safe-bin-modus, zodat `jq -n env` de hostprocesomgeving niet kan dumpen zonder expliciet allowlist-pad of goedkeuringsprompt.

## Interpreter-/runtime-opdrachten

Uitvoeringen van interpreters/runtimes met goedkeuring zijn bewust conservatief:

- Exacte argv/cwd/env-context wordt altijd gebonden.
- Directe shellscript- en directe runtime-bestandsvormen worden naar beste vermogen gebonden aan één concrete lokale bestandssnapshot.
- Veelvoorkomende wrappervormen van pakketbeheerders die nog steeds naar één direct lokaal bestand oplossen (bijvoorbeeld `pnpm exec`, `pnpm node`, `npm exec`, `npx`) worden uitgepakt vóór binding.
- Als OpenClaw niet exact één concreet lokaal bestand kan identificeren voor een interpreter-/runtime-opdracht (bijvoorbeeld pakketscripts, eval-vormen, runtimespecifieke loaderketens of dubbelzinnige multi-bestandsvormen), wordt uitvoering met goedkeuring geweigerd in plaats van semantische dekking te claimen die er niet is.
- Gebruik voor die workflows bij voorkeur sandboxing, een aparte hostgrens of een expliciete vertrouwde allowlist/volledige workflow waarbij de operator de bredere runtime-semantiek accepteert.

Wanneer goedkeuringen vereist zijn, retourneert het exec-hulpmiddel onmiddellijk met een goedkeurings-id. Gebruik die id om latere systeemgebeurtenissen (`Exec finished` / `Exec denied`) te correleren. Als er vóór de timeout geen beslissing binnenkomt, wordt de aanvraag behandeld als een goedkeuringstime-out en als weigeringsreden weergegeven.

### Gedrag voor follow-upbezorging

Nadat een goedgekeurde async exec is voltooid, stuurt OpenClaw een follow-up `agent`-turn naar dezelfde sessie.

- Als er een geldig extern bezorgdoel bestaat (bezorgbaar kanaal plus doel `to`), gebruikt follow-upbezorging dat kanaal.
- In webchat-only- of interne sessiestromen zonder extern doel blijft follow-upbezorging alleen in de sessie (`deliver: false`).
- Als een caller expliciet strikte externe bezorging aanvraagt zonder oplosbaar extern kanaal, mislukt de aanvraag met `INVALID_REQUEST`.
- Als `bestEffortDeliver` is ingeschakeld en er geen extern kanaal kan worden opgelost, wordt bezorging verlaagd naar alleen-sessie in plaats van te mislukken.

## Goedkeuringsdoorsturing naar chatkanalen

Je kunt exec-goedkeuringsprompts doorsturen naar elk chatkanaal (inclusief Plugin-kanalen) en ze goedkeuren met `/approve`. Dit gebruikt de normale outbound delivery-pipeline.

Configuratie:
__OC_I18N_900001__
Antwoord in chat:
__OC_I18N_900002__
De opdracht `/approve` verwerkt zowel exec-goedkeuringen als Plugin-goedkeuringen. Als de ID niet overeenkomt met een wachtende exec-goedkeuring, controleert deze automatisch in plaats daarvan Plugin-goedkeuringen.

### Doorsturing van Plugin-goedkeuringen

Doorsturing van Plugin-goedkeuringen gebruikt dezelfde delivery-pipeline als exec-goedkeuringen, maar heeft een eigen onafhankelijke configuratie onder `approvals.plugin`. Het in- of uitschakelen van de ene heeft geen invloed op de andere.
__OC_I18N_900003__
De configuratievorm is identiek aan `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` en `targets` werken op dezelfde manier.

Kanalen die gedeelde interactieve antwoorden ondersteunen, renderen dezelfde goedkeuringsknoppen voor zowel exec- als Plugin-goedkeuringen. Kanalen zonder gedeelde interactieve UI vallen terug op platte tekst met `/approve`-instructies.

### Goedkeuringen in dezelfde chat op elk kanaal

Wanneer een exec- of Plugin-goedkeuringsaanvraag afkomstig is van een bezorgbaar chatoppervlak, kan dezelfde chat deze nu standaard goedkeuren met `/approve`. Dit geldt voor kanalen zoals Slack, Matrix en Microsoft Teams, naast de bestaande Web UI- en terminal-UI-stromen.

Dit gedeelde pad voor tekstopdrachten gebruikt het normale kanaal-authenticatiemodel voor dat gesprek. Als de oorspronkelijke chat al opdrachten kan verzenden en antwoorden kan ontvangen, hebben goedkeuringsaanvragen geen aparte native delivery-adapter meer nodig alleen om pending te blijven.

Discord en Telegram ondersteunen ook `/approve` in dezelfde chat, maar die kanalen gebruiken nog steeds hun opgeloste lijst met goedkeurders voor autorisatie, ook wanneer native goedkeuringsbezorging is uitgeschakeld.

Voor Telegram en andere native goedkeuringsclients die de Gateway rechtstreeks aanroepen, is deze fallback bewust begrensd tot fouten waarbij de goedkeuring niet is gevonden. Een echte weigering/fout van een exec-goedkeuring wordt niet stilzwijgend opnieuw geprobeerd als Plugin-goedkeuring.

### Native goedkeuringsbezorging

Sommige kanalen kunnen ook fungeren als native goedkeuringsclients. Native clients voegen DM's naar goedkeurders, fanout naar de oorspronkelijke chat en kanaalspecifieke interactieve goedkeurings-UX toe bovenop de gedeelde `/approve`-stroom in dezelfde chat.

Wanneer native goedkeuringskaarten/-knoppen beschikbaar zijn, is die native UI het primaire
pad voor de agent. De agent mag niet ook een dubbele gewone chatopdracht
`/approve` echoën, tenzij het toolresultaat aangeeft dat chatgoedkeuringen niet beschikbaar zijn of
handmatige goedkeuring het enige resterende pad is.

Als een native goedkeuringsclient is geconfigureerd maar er geen native runtime actief is voor
het oorspronkelijke kanaal, houdt OpenClaw de lokale deterministische `/approve`
prompt zichtbaar. Als de native runtime actief is en levering probeert, maar geen
doel de kaart ontvangt, stuurt OpenClaw een fallbackmelding in dezelfde chat met de
exacte opdracht `/approve <id> <decision>`, zodat het verzoek nog steeds kan worden afgehandeld.

Generiek model:

- het hostuitvoeringsbeleid bepaalt nog steeds of uitvoeringsgoedkeuring vereist is
- `approvals.exec` regelt het doorsturen van goedkeuringsprompts naar andere chatbestemmingen
- `channels.<channel>.execApprovals` regelt of dat kanaal fungeert als native goedkeuringsclient

Native goedkeuringsclients schakelen DM-eerst-levering automatisch in wanneer al het volgende waar is:

- het kanaal ondersteunt native levering van goedkeuringen
- goedkeurders kunnen worden afgeleid uit expliciete `execApprovals.approvers` of eigenaaridentiteit zoals `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` is niet ingesteld of is `"auto"`

Stel `enabled: false` in om een native goedkeuringsclient expliciet uit te schakelen. Stel `enabled: true` in om
deze af te dwingen wanneer goedkeurders kunnen worden afgeleid. Levering in de openbare oorsprongschat blijft expliciet via
`channels.<channel>.execApprovals.target`.

FAQ: [Waarom zijn er twee uitvoeringsgoedkeuringsconfiguraties voor chatgoedkeuringen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Deze native goedkeuringsclients voegen DM-routering en optionele kanaalfanout toe boven op de gedeelde
`/approve`-flow in dezelfde chat en gedeelde goedkeuringsknoppen.

Gedeeld gedrag:

- Slack, Matrix, Microsoft Teams en vergelijkbare leverbare chats gebruiken het normale kanaalauthenticatiemodel
  voor `/approve` in dezelfde chat
- wanneer een native goedkeuringsclient automatisch wordt ingeschakeld, is het standaard native leveringsdoel DM's van goedkeurders
- voor Discord en Telegram kunnen alleen afgeleide goedkeurders goedkeuren of weigeren
- Discord-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- Telegram-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- Slack-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- native Slack-knoppen behouden het soort goedkeurings-id, zodat `plugin:`-id's Plugin-goedkeuringen kunnen oplossen
  zonder een tweede Slack-lokale fallbacklaag
- native Matrix-DM-/kanaalroutering en reactiesnelkoppelingen verwerken zowel uitvoerings- als Plugin-goedkeuringen;
  Plugin-autorisatie komt nog steeds van `channels.matrix.dm.allowFrom`
- native Matrix-prompts bevatten aangepaste eventinhoud `com.openclaw.approval` op het eerste prompt-event,
  zodat OpenClaw-bewuste Matrix-clients gestructureerde goedkeuringsstatus kunnen lezen terwijl standaardclients
  de gewone tekstfallback `/approve` behouden
- de aanvrager hoeft geen goedkeurder te zijn
- de oorspronkelijke chat kan rechtstreeks goedkeuren met `/approve` wanneer die chat al opdrachten en antwoorden ondersteunt
- native Discord-goedkeuringsknoppen routeren op basis van het soort goedkeurings-id: `plugin:`-id's gaan
  rechtstreeks naar Plugin-goedkeuringen, al het andere gaat naar uitvoeringsgoedkeuringen
- native Telegram-goedkeuringsknoppen volgen dezelfde begrensde fallback van uitvoering naar Plugin als `/approve`
- wanneer native `target` levering in de oorsprongschat inschakelt, bevatten goedkeuringsprompts de opdrachttekst
- openstaande uitvoeringsgoedkeuringen verlopen standaard na 30 minuten
- als geen operator-UI of geconfigureerde goedkeuringsclient het verzoek kan accepteren, valt de prompt terug op `askFallback`

Gevoelige groepsopdrachten die alleen voor eigenaars zijn, zoals `/diagnostics` en `/export-trajectory`, gebruiken privéroutering
voor de eigenaar voor goedkeuringsprompts en eindresultaten. OpenClaw probeert eerst een privéroute op hetzelfde
oppervlak waar de eigenaar de opdracht uitvoerde. Als dat oppervlak geen privéroute voor de eigenaar heeft, valt het
terug op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zodat een Discord-groepsopdracht
de goedkeuring en het resultaat nog steeds naar de Telegram-DM van de eigenaar kan sturen wanneer Telegram de geconfigureerde
primaire privé-interface is. De groepschat krijgt alleen een korte bevestiging.

Telegram gebruikt standaard DM's van goedkeurders (`target: "dm"`). Je kunt overschakelen naar `channel` of `both` wanneer je
wilt dat goedkeuringsprompts ook in de oorspronkelijke Telegram-chat/het oorspronkelijke Telegram-onderwerp verschijnen. Voor Telegram-forumonderwerpen
behoudt OpenClaw het onderwerp voor de goedkeuringsprompt en de opvolging na goedkeuring.

Zie:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC-flow
__OC_I18N_900004__
Beveiligingsnotities:

- Unix-socketmodus `0600`, token opgeslagen in `exec-approvals.json`.
- Peercontrole met dezelfde UID.
- Challenge/response (nonce + HMAC-token + aanvraaghash) + korte TTL.

## Gerelateerd

- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals) — kernbeleid en goedkeuringsflow
- [Uitvoeringstool](/nl/tools/exec)
- [Verhoogde modus](/nl/tools/elevated)
- [Skills](/nl/tools/skills) — door Skills ondersteund automatisch-toestaan-gedrag
