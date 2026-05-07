---
read_when:
    - Veilige bins of aangepaste veilige-binprofielen configureren
    - Goedkeuringen doorsturen naar Slack/Discord/Telegram of andere chatkanalen
    - Een native goedkeuringsclient voor een kanaal implementeren
summary: 'Geavanceerde exec-goedkeuringen: veilige bins, interpreterbinding, goedkeuringsdoorgifte, native levering'
title: Uitvoeringsgoedkeuringen — geavanceerd
x-i18n:
    generated_at: "2026-05-07T01:54:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Geavanceerde onderwerpen voor exec-goedkeuringen: het `safeBins`-snelle pad, interpreter/runtime-
binding, en goedkeuringsdoorsturing naar chatkanalen (inclusief native levering).
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het kernbeleid en de goedkeuringsflow.

## Veilige bins (alleen stdin)

`tools.exec.safeBins` definieert een kleine lijst met **alleen-stdin** binaries (bijvoorbeeld
`cut`) die in allowlist-modus **zonder** expliciete allowlist-vermeldingen kunnen worden
uitgevoerd. Veilige bins weigeren positionele bestandsargumenten en padachtige tokens, zodat ze
alleen op de inkomende stream kunnen werken. Behandel dit als een smal snel pad voor
streamfilters, niet als een algemene vertrouwenslijst.

<Warning>
Voeg **geen** interpreter- of runtime-binaries (bijvoorbeeld `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) toe aan `safeBins`. Als een opdracht code kan evalueren,
subopdrachten kan uitvoeren of standaard bestanden kan lezen, geef dan de voorkeur aan expliciete
allowlist-vermeldingen en houd goedkeuringsprompts ingeschakeld. Aangepaste veilige bins moeten een expliciet
profiel definiëren in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Standaard veilige bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` en `sort` staan niet in de standaardlijst. Als je je hiervoor aanmeldt, behoud dan expliciete
allowlist-vermeldingen voor hun niet-stdin-workflows. Geef voor `grep` in safe-bin-modus
het patroon op met `-e`/`--regexp`; de positionele patroonvorm wordt geweigerd,
zodat bestandsoperanden niet als dubbelzinnige positionele argumenten kunnen worden meegesmokkeld.

### Argv-validatie en geweigerde vlaggen

Validatie is deterministisch op basis van alleen de vorm van argv (geen bestaanscontroles op het
hostbestandssysteem), wat oracle-gedrag rond bestandbestaan door verschillen tussen toestaan/weigeren
voorkomt. Bestandsgerichte opties worden geweigerd voor standaard veilige bins; lange
opties worden fail-closed gevalideerd (onbekende vlaggen en dubbelzinnige afkortingen worden
geweigerd).

Geweigerde vlaggen per safe-bin-profiel:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Veilige bins dwingen argv-tokens ook om tijdens uitvoering als **letterlijke tekst** te worden behandeld
(geen globbing en geen uitbreiding van `$VARS`) voor alleen-stdin-segmenten, zodat patronen
zoals `*` of `$HOME/...` niet kunnen worden gebruikt om bestandslezingen mee te smokkelen.

### Vertrouwde binary-mappen

Veilige bins moeten worden opgelost vanuit vertrouwde binary-mappen (systeemstandaarden plus
optioneel `tools.exec.safeBinTrustedDirs`). `PATH`-vermeldingen worden nooit automatisch vertrouwd.
Standaard vertrouwde mappen zijn bewust minimaal: `/bin`, `/usr/bin`. Als
je safe-bin-uitvoerbaar bestand in package-manager-/gebruikerspaden staat (bijvoorbeeld
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), voeg die dan
expliciet toe aan `tools.exec.safeBinTrustedDirs`.

### Shell-ketening, wrappers en multiplexers

Shell-ketening (`&&`, `||`, `;`) is toegestaan wanneer elk top-level segment
voldoet aan de allowlist (inclusief veilige bins of automatisch toestaan door Skills). Redirects
blijven niet ondersteund in allowlist-modus. Opdrachtvervanging (`$()` / backticks) wordt
geweigerd tijdens allowlist-parsing, ook binnen dubbele aanhalingstekens; gebruik enkele
aanhalingstekens als je letterlijke `$()`-tekst nodig hebt.

Bij macOS companion-app-goedkeuringen wordt onbewerkte shelltekst die shellbesturing of
uitbreidingssyntaxis bevat (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) behandeld
als een allowlist-miss, tenzij de shell-binary zelf in de allowlist staat.

Voor shell-wrappers (`bash|sh|zsh ... -c/-lc`) worden request-scoped env-overschrijvingen
teruggebracht tot een kleine expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Voor `allow-always`-beslissingen in allowlist-modus bewaren bekende dispatch-wrappers (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) het binnenste uitvoerbare pad in plaats
van het wrapperpad. Shell-multiplexers (`busybox`, `toybox`) worden op dezelfde manier uitgepakt voor
shell-applets (`sh`, `ash`, enz.). Als een wrapper of multiplexer niet veilig
kan worden uitgepakt, wordt er automatisch geen allowlist-vermelding bewaard.

Als je interpreters zoals `python3` of `node` in de allowlist zet, geef dan de voorkeur aan
`tools.exec.strictInlineEval=true`, zodat inline eval nog steeds een expliciete
goedkeuring vereist. In strikte modus kan `allow-always` nog steeds goedaardige
interpreter-/scriptaanroepen bewaren, maar inline-eval-dragers worden niet automatisch
bewaard.

### Veilige bins versus allowlist

| Onderwerp        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Doel             | Smalle stdin-filters automatisch toestaan              | Specifieke uitvoerbare bestanden expliciet vertrouwen                              |
| Matchtype        | Naam van uitvoerbaar bestand + safe-bin argv-beleid    | Opgeloste glob voor uitvoerbaar pad, of kale glob voor opdrachtnaam voor via PATH aangeroepen opdrachten |
| Argumentscope    | Beperkt door safe-bin-profiel en regels voor letterlijke tokens | Padmatch standaard; optioneel kan `argPattern` geparste argv beperken              |
| Typische voorbeelden | `head`, `tail`, `tr`, `wc`                         | `jq`, `python3`, `node`, `ffmpeg`, aangepaste CLI's                                |
| Beste gebruik    | Teksttransformaties met laag risico in pipelines       | Elk hulpmiddel met breder gedrag of bijwerkingen                                   |

Configuratielocatie:

- `safeBins` komt uit config (`tools.exec.safeBins` of per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` komt uit config (`tools.exec.safeBinTrustedDirs` of per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` komt uit config (`tools.exec.safeBinProfiles` of per-agent `agents.list[].tools.exec.safeBinProfiles`). Per-agent profielsleutels overschrijven globale sleutels.
- allowlist-vermeldingen staan in host-lokale `~/.openclaw/exec-approvals.json` onder `agents.<id>.allowlist` (of via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` waarschuwt met `tools.exec.safe_bins_interpreter_unprofiled` wanneer interpreter-/runtime-bins in `safeBins` verschijnen zonder expliciete profielen.
- `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles.<bin>`-vermeldingen scaffolden als `{}` (controleer en verscherp daarna). Interpreter-/runtime-bins worden niet automatisch gescaffold.

Voorbeeld van aangepast profiel:
__OC_I18N_900000__
Als je `jq` expliciet aanmeldt voor `safeBins`, weigert OpenClaw nog steeds de `env`-builtin in safe-bin-
modus, zodat `jq -n env` de hostprocesomgeving niet kan dumpen zonder een expliciet allowlist-pad
of goedkeuringsprompt.

## Interpreter-/runtime-opdrachten

Door goedkeuring ondersteunde interpreter-/runtime-runs zijn bewust conservatief:

- Exacte argv-/cwd-/env-context wordt altijd gebonden.
- Directe shellscript- en directe runtime-bestandsvormen worden naar beste vermogen gebonden aan één concrete lokale
  bestandssnapshot.
- Veelvoorkomende package-manager-wrappervormen die nog steeds naar één direct lokaal bestand oplossen (bijvoorbeeld
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) worden uitgepakt vóór binding.
- Als OpenClaw niet exact één concreet lokaal bestand kan identificeren voor een interpreter-/runtime-opdracht
  (bijvoorbeeld package-scripts, eval-vormen, runtime-specifieke loaderketens of dubbelzinnige multi-file-
  vormen), wordt door goedkeuring ondersteunde uitvoering geweigerd in plaats van semantische dekking te claimen die het
  niet heeft.
- Geef voor die workflows de voorkeur aan sandboxing, een aparte hostgrens of een expliciete vertrouwde
  allowlist/volledige workflow waarbij de operator de bredere runtime-semantiek accepteert.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool onmiddellijk met een goedkeurings-id. Gebruik dat id om
latere systeemgebeurtenissen (`Exec finished` / `Exec denied`) te correleren. Als er geen beslissing arriveert vóór de
timeout, wordt de aanvraag behandeld als een goedkeuringstime-out en weergegeven als weigeringsreden.

### Gedrag voor follow-up-levering

Nadat een goedgekeurde async exec is voltooid, stuurt OpenClaw een follow-up `agent`-beurt naar dezelfde sessie.

- Als er een geldig extern leveringsdoel bestaat (leverbaar kanaal plus doel `to`), gebruikt follow-up-levering dat kanaal.
- In webchat-only of interne sessieflows zonder extern doel blijft follow-up-levering alleen sessiegebonden (`deliver: false`).
- Als een aanroeper expliciet strikte externe levering aanvraagt zonder oplosbaar extern kanaal, mislukt de aanvraag met `INVALID_REQUEST`.
- Als `bestEffortDeliver` is ingeschakeld en er geen extern kanaal kan worden opgelost, wordt levering verlaagd naar alleen sessie in plaats van te mislukken.

## Goedkeuringsdoorsturing naar chatkanalen

Je kunt exec-goedkeuringsprompts doorsturen naar elk chatkanaal (inclusief Plugin-kanalen) en ze goedkeuren
met `/approve`. Dit gebruikt de normale uitgaande leveringspipeline.

Config:
__OC_I18N_900001__
Antwoord in chat:
__OC_I18N_900002__
De opdracht `/approve` verwerkt zowel exec-goedkeuringen als Plugin-goedkeuringen. Als de ID niet overeenkomt met een wachtende exec-goedkeuring, controleert deze automatisch in plaats daarvan Plugin-goedkeuringen.

### Doorsturen van Plugin-goedkeuringen

Het doorsturen van Plugin-goedkeuringen gebruikt dezelfde leveringspipeline als exec-goedkeuringen, maar heeft een eigen
onafhankelijke config onder `approvals.plugin`. Het in- of uitschakelen van de ene heeft geen invloed op de andere.
__OC_I18N_900003__
De config-vorm is identiek aan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` en `targets` werken op dezelfde manier.

Kanalen die gedeelde interactieve antwoorden ondersteunen, tonen dezelfde goedkeuringsknoppen voor zowel exec- als
Plugin-goedkeuringen. Kanalen zonder gedeelde interactieve UI vallen terug op platte tekst met `/approve`-
instructies.
Plugin-goedkeuringsaanvragen kunnen de beschikbare beslissingen beperken. Goedkeuringsoppervlakken gebruiken de door de aanvraag
gedeclareerde beslissingsset, en de Gateway weigert pogingen om een beslissing in te dienen die niet is aangeboden.

### Goedkeuringen in dezelfde chat op elk kanaal

Wanneer een exec- of Plugin-goedkeuringsaanvraag afkomstig is van een leverbaar chatoppervlak, kan dezelfde chat
deze nu standaard goedkeuren met `/approve`. Dit geldt voor kanalen zoals Slack, Matrix en
Microsoft Teams naast de bestaande Web UI- en terminal-UI-flows.

Dit gedeelde pad voor tekstopdrachten gebruikt het normale kanaalauthenticatiemodel voor dat gesprek. Als de
oorspronkelijke chat al opdrachten kan verzenden en antwoorden kan ontvangen, hebben goedkeuringsaanvragen niet langer
een aparte native leveringsadapter nodig alleen om in behandeling te blijven.

Discord en Telegram ondersteunen ook `/approve` in dezelfde chat, maar die kanalen gebruiken nog steeds hun
opgeloste approverlijst voor autorisatie, zelfs wanneer native goedkeuringslevering is uitgeschakeld.

Voor Telegram en andere native goedkeuringsclients die de Gateway direct aanroepen,
is deze fallback bewust begrensd tot fouten met "goedkeuring niet gevonden". Een echte
weigering/fout van een exec-goedkeuring probeert niet stilzwijgend opnieuw als Plugin-goedkeuring.

### Native goedkeuringslevering

Sommige kanalen kunnen ook als native goedkeuringsclients fungeren. Native clients voegen goedkeurder-DM's, fan-out naar de oorspronkelijke chat en kanaalspecifieke interactieve goedkeurings-UX toe boven op de gedeelde `/approve`-flow in dezelfde chat.

Wanneer native goedkeuringskaarten/-knoppen beschikbaar zijn, is die native UI het primaire pad voor de agent. De agent moet niet ook een dubbele platte chatopdracht `/approve` herhalen, tenzij het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het enige resterende pad is.

Als een native goedkeuringsclient is geconfigureerd maar er geen native runtime actief is voor het oorspronkelijke kanaal, houdt OpenClaw de lokale deterministische `/approve`-prompt zichtbaar. Als de native runtime actief is en aflevering probeert maar geen doel de kaart ontvangt, stuurt OpenClaw een fallbackmelding in dezelfde chat met de exacte opdracht `/approve <id> <decision>`, zodat het verzoek nog steeds kan worden afgehandeld.

Generiek model:

- het hostbeleid voor exec bepaalt nog steeds of exec-goedkeuring vereist is
- `approvals.exec` beheert het doorsturen van goedkeuringsprompts naar andere chatbestemmingen
- `channels.<channel>.execApprovals` beheert of dat kanaal als native goedkeuringsclient fungeert

Native goedkeuringsclients schakelen DM-eerste aflevering automatisch in wanneer al het volgende waar is:

- het kanaal ondersteunt native goedkeuringsaflevering
- goedkeurders kunnen worden afgeleid uit expliciete `execApprovals.approvers` of eigenaaridentiteit zoals `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` is niet ingesteld of is `"auto"`

Stel `enabled: false` in om een native goedkeuringsclient expliciet uit te schakelen. Stel `enabled: true` in om deze geforceerd in te schakelen wanneer goedkeurders worden gevonden. Openbare aflevering naar de oorspronkelijke chat blijft expliciet via `channels.<channel>.execApprovals.target`.

Veelgestelde vragen: [Waarom zijn er twee exec-goedkeuringsconfiguraties voor chatgoedkeuringen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Deze native goedkeuringsclients voegen DM-routering en optionele kanaalfan-out toe boven op de gedeelde `/approve`-flow in dezelfde chat en gedeelde goedkeuringsknoppen.

Gedeeld gedrag:

- Slack, Matrix, Microsoft Teams en vergelijkbare afleverbare chats gebruiken het normale kanaalauthenticatiemodel voor `/approve` in dezelfde chat
- wanneer een native goedkeuringsclient automatisch wordt ingeschakeld, is het standaarddoel voor native aflevering goedkeurder-DM's
- voor Discord en Telegram kunnen alleen gevonden goedkeurders goedkeuren of weigeren
- Discord-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of afgeleid worden uit `commands.ownerAllowFrom`
- Telegram-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of afgeleid worden uit `commands.ownerAllowFrom`
- Slack-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of afgeleid worden uit `commands.ownerAllowFrom`
- native Slack-knoppen behouden het type goedkeurings-id, zodat `plugin:`-id's Plugin-goedkeuringen kunnen oplossen zonder een tweede Slack-lokale fallbacklaag
- native Matrix-DM-/kanaalroutering en reactiesnelkoppelingen verwerken zowel exec- als Plugin-goedkeuringen; Plugin-autorisatie komt nog steeds uit `channels.matrix.dm.allowFrom`
- native Matrix-prompts bevatten `com.openclaw.approval`-inhoud voor aangepaste events op het eerste prompt-event, zodat Matrix-clients die OpenClaw begrijpen gestructureerde goedkeuringsstatus kunnen lezen terwijl standaardclients de plattetekst-fallback `/approve` behouden
- de aanvrager hoeft geen goedkeurder te zijn
- de oorspronkelijke chat kan rechtstreeks goedkeuren met `/approve` wanneer die chat al opdrachten en antwoorden ondersteunt
- native Discord-goedkeuringsknoppen routeren op type goedkeurings-id: `plugin:`-id's gaan rechtstreeks naar Plugin-goedkeuringen, al het andere gaat naar exec-goedkeuringen
- native Telegram-goedkeuringsknoppen volgen dezelfde begrensde exec-naar-Plugin-fallback als `/approve`
- wanneer native `target` aflevering naar de oorspronkelijke chat inschakelt, bevatten goedkeuringsprompts de opdrachttekst
- openstaande exec-goedkeuringen verlopen standaard na 30 minuten
- als geen operator-UI of geconfigureerde goedkeuringsclient het verzoek kan accepteren, valt de prompt terug op `askFallback`

Gevoelige groepsopdrachten die alleen voor eigenaren zijn, zoals `/diagnostics` en `/export-trajectory`, gebruiken privérouting voor eigenaren voor goedkeuringsprompts en eindresultaten. OpenClaw probeert eerst een privéroute op hetzelfde oppervlak waarop de eigenaar de opdracht uitvoerde. Als dat oppervlak geen privéroute voor eigenaren heeft, valt het terug op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zodat een Discord-groepsopdracht de goedkeuring en het resultaat nog steeds naar de Telegram-DM van de eigenaar kan sturen wanneer Telegram als de primaire privéinterface is geconfigureerd. De groepschat krijgt alleen een korte bevestiging.

Telegram gebruikt standaard goedkeurder-DM's (`target: "dm"`). Je kunt overschakelen naar `channel` of `both` wanneer je wilt dat goedkeuringsprompts ook in de oorspronkelijke Telegram-chat/-topic verschijnen. Voor Telegram-forumtopics behoudt OpenClaw de topic voor de goedkeuringsprompt en de opvolging na goedkeuring.

Zie:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC-flow
__OC_I18N_900004__
Beveiligingsopmerkingen:

- Unix-socketmodus `0600`, token opgeslagen in `exec-approvals.json`.
- Controle van peer met dezelfde UID.
- Challenge/response (nonce + HMAC-token + requesthash) + korte TTL.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — kernbeleid en goedkeuringsflow
- [Exec-tool](/nl/tools/exec)
- [Verhoogde modus](/nl/tools/elevated)
- [Skills](/nl/tools/skills) — gedrag voor automatisch toestaan op basis van Skills
