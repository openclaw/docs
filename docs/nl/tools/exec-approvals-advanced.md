---
read_when:
    - Veilige bins of aangepaste safe-bin-profielen configureren
    - Goedkeuringen doorsturen naar Slack/Discord/Telegram of andere chatkanalen
    - Een native goedkeuringsclient voor een kanaal implementeren
summary: 'Geavanceerde exec-goedkeuringen: veilige bins, interpreterbinding, goedkeuringsdoorsturing, native levering'
title: Goedkeuringen voor uitvoering — geavanceerd
x-i18n:
    generated_at: "2026-05-06T09:35:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Geavanceerde onderwerpen voor exec-goedkeuring: het `safeBins`-snelle pad, interpreter-/runtimebinding en het doorsturen van goedkeuringen naar chatkanalen (inclusief native aflevering). Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het kernbeleid en de goedkeuringsstroom.

## Safe bins (alleen stdin)

`tools.exec.safeBins` definieert een kleine lijst met **alleen-stdin** binaries (bijvoorbeeld `cut`) die in allowlist-modus kunnen worden uitgevoerd **zonder** expliciete allowlist-items. Safe bins weigeren positionele bestandsargumenten en padachtige tokens, zodat ze alleen op de inkomende stream kunnen werken. Behandel dit als een nauw snel pad voor streamfilters, niet als een algemene vertrouwenslijst.

<Warning>
Voeg **geen** interpreter- of runtimebinaries (bijvoorbeeld `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) toe aan `safeBins`. Als een opdracht code kan evalueren, subopdrachten kan uitvoeren of ontworpen is om bestanden te lezen, geef dan de voorkeur aan expliciete allowlist-items en laat goedkeuringsprompts ingeschakeld. Aangepaste safe bins moeten een expliciet profiel definiëren in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Standaard safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` en `sort` staan niet in de standaardlijst. Als je hiervoor kiest, behoud dan expliciete allowlist-items voor hun workflows zonder stdin. Geef voor `grep` in safe-bin-modus het patroon op met `-e`/`--regexp`; de positionele patroonvorm wordt geweigerd, zodat bestandsoperanden niet als dubbelzinnige positionele argumenten kunnen worden binnengesmokkeld.

### Argv-validatie en geweigerde vlaggen

Validatie is deterministisch op basis van alleen de argv-vorm (geen controles op het bestaan van hostbestanden), wat voorkomt dat verschillen tussen toestaan en weigeren als bestandsbestaan-orakel kunnen werken. Bestandsgerichte opties worden geweigerd voor standaard safe bins; lange opties worden fail-closed gevalideerd (onbekende vlaggen en dubbelzinnige afkortingen worden geweigerd).

Geweigerde vlaggen per safe-bin-profiel:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins dwingen ook af dat argv-tokens tijdens uitvoering als **letterlijke tekst** worden behandeld (geen globbing en geen uitbreiding van `$VARS`) voor segmenten met alleen stdin, zodat patronen zoals `*` of `$HOME/...` niet kunnen worden gebruikt om bestandslezingen binnen te smokkelen.

### Vertrouwde binarymappen

Safe bins moeten worden opgelost vanuit vertrouwde binarymappen (systeemstandaarden plus optioneel `tools.exec.safeBinTrustedDirs`). `PATH`-items worden nooit automatisch vertrouwd. Standaard vertrouwde mappen zijn bewust minimaal: `/bin`, `/usr/bin`. Als je safe-bin-executable in package-manager-/gebruikerspaden staat (bijvoorbeeld `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), voeg die dan expliciet toe aan `tools.exec.safeBinTrustedDirs`.

### Shell-koppeling, wrappers en multiplexers

Shell-koppeling (`&&`, `||`, `;`) is toegestaan wanneer elk top-level segment voldoet aan de allowlist (inclusief safe bins of automatische toestaan via Skills). Redirections blijven niet ondersteund in allowlist-modus. Command substitution (`$()` / backticks) wordt geweigerd tijdens allowlist-parsing, ook binnen dubbele aanhalingstekens; gebruik enkele aanhalingstekens als je letterlijke `$()`-tekst nodig hebt.

Bij goedkeuringen via de macOS-companion-app wordt ruwe shelltekst met shellbesturing of uitbreidingssyntaxis (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) behandeld als een allowlist-miss, tenzij de shellbinary zelf op de allowlist staat.

Voor shell-wrappers (`bash|sh|zsh ... -c/-lc`) worden request-scoped env-overschrijvingen teruggebracht tot een kleine expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Bij `allow-always`-beslissingen in allowlist-modus slaan bekende dispatch-wrappers (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) het pad van de interne executable op in plaats van het wrapperpad. Shell-multiplexers (`busybox`, `toybox`) worden op dezelfde manier uitgepakt voor shell-applets (`sh`, `ash`, enz.). Als een wrapper of multiplexer niet veilig kan worden uitgepakt, wordt er automatisch geen allowlist-item opgeslagen.

Als je interpreters zoals `python3` of `node` op de allowlist zet, geef dan de voorkeur aan `tools.exec.strictInlineEval=true`, zodat inline eval nog steeds expliciete goedkeuring vereist. In strikte modus kan `allow-always` nog steeds goedaardige interpreter-/scriptaanroepen opslaan, maar inline-eval-dragers worden niet automatisch opgeslagen.

### Safe bins versus allowlist

| Onderwerp            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Doel             | Smalle stdin-filters automatisch toestaan                        | Specifieke executables expliciet vertrouwen                                              |
| Matchtype       | Executable-naam + safe-bin argv-beleid                 | Opgeloste executable-padglob, of kale opdrachtnaamglob voor via PATH aangeroepen opdrachten |
| Argumentbereik   | Beperkt door safe-bin-profiel en regels voor letterlijke tokens | Standaard padmatch; optioneel kan `argPattern` geparseerde argv beperken              |
| Typische voorbeelden | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, aangepaste CLI's                                     |
| Beste gebruik         | Teksttransformaties met laag risico in pipelines                  | Elk hulpmiddel met breder gedrag of neveneffecten                                     |

Configuratielocatie:

- `safeBins` komt uit config (`tools.exec.safeBins` of per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` komt uit config (`tools.exec.safeBinTrustedDirs` of per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` komt uit config (`tools.exec.safeBinProfiles` of per-agent `agents.list[].tools.exec.safeBinProfiles`). Profielsleutels per agent overschrijven globale sleutels.
- allowlist-items staan in host-lokale `~/.openclaw/exec-approvals.json` onder `agents.<id>.allowlist` (of via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` waarschuwt met `tools.exec.safe_bins_interpreter_unprofiled` wanneer interpreter-/runtimebins in `safeBins` staan zonder expliciete profielen.
- `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles.<bin>`-items als `{}` scaffolden (controleer en verscherp ze daarna). Interpreter-/runtimebins worden niet automatisch gescaffold.

Voorbeeld van aangepast profiel:
__OC_I18N_900000__
Als je `jq` expliciet toevoegt aan `safeBins`, weigert OpenClaw nog steeds de `env` builtin in safe-bin-modus, zodat `jq -n env` de hostprocesomgeving niet kan dumpen zonder een expliciet allowlist-pad of goedkeuringsprompt.

## Interpreter-/runtimeopdrachten

Door goedkeuring ondersteunde interpreter-/runtime-uitvoeringen zijn bewust conservatief:

- Exacte argv-/cwd-/env-context wordt altijd gebonden.
- Directe shellscript- en directe runtimebestandsvormen worden naar beste vermogen gebonden aan één concrete lokale bestandssnapshot.
- Gangbare wrappervormen van package managers die nog steeds naar één direct lokaal bestand oplossen (bijvoorbeeld `pnpm exec`, `pnpm node`, `npm exec`, `npx`) worden uitgepakt voordat ze worden gebonden.
- Als OpenClaw niet precies één concreet lokaal bestand voor een interpreter-/runtimeopdracht kan identificeren (bijvoorbeeld package-scripts, eval-vormen, runtime-specifieke loaderketens of dubbelzinnige multi-bestandsvormen), wordt door goedkeuring ondersteunde uitvoering geweigerd in plaats van semantische dekking te claimen die er niet is.
- Geef voor die workflows de voorkeur aan sandboxing, een aparte hostgrens of een expliciet vertrouwde allowlist/volledige workflow waarbij de operator de bredere runtimesemantiek accepteert.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool onmiddellijk met een goedkeurings-ID. Gebruik die ID om latere systeemgebeurtenissen (`Exec finished` / `Exec denied`) te correleren. Als er vóór de timeout geen beslissing binnenkomt, wordt het verzoek behandeld als een goedkeuringstimeout en getoond als weigeringsreden.

### Gedrag voor vervolglevering

Nadat een goedgekeurde async exec is voltooid, stuurt OpenClaw een vervolg-`agent`-turn naar dezelfde sessie.

- Als er een geldig extern afleverdoel bestaat (afleverbaar kanaal plus doel `to`), gebruikt vervolglevering dat kanaal.
- In webchat-only of interne sessiestromen zonder extern doel blijft vervolglevering alleen sessiegebonden (`deliver: false`).
- Als een caller expliciet strikte externe levering aanvraagt zonder oplosbaar extern kanaal, mislukt het verzoek met `INVALID_REQUEST`.
- Als `bestEffortDeliver` is ingeschakeld en er geen extern kanaal kan worden opgelost, wordt levering verlaagd naar alleen sessie in plaats van te mislukken.

## Goedkeuringsdoorsturing naar chatkanalen

Je kunt exec-goedkeuringsprompts doorsturen naar elk chatkanaal (inclusief Plugin-kanalen) en ze goedkeuren met `/approve`. Dit gebruikt de normale outbound delivery-pipeline.

Config:
__OC_I18N_900001__
Antwoord in chat:
__OC_I18N_900002__
De opdracht `/approve` verwerkt zowel exec-goedkeuringen als Plugin-goedkeuringen. Als de ID niet overeenkomt met een wachtende exec-goedkeuring, controleert deze automatisch in plaats daarvan Plugin-goedkeuringen.

### Doorsturing van Plugin-goedkeuringen

Doorsturing van Plugin-goedkeuringen gebruikt dezelfde delivery-pipeline als exec-goedkeuringen, maar heeft een eigen onafhankelijke config onder `approvals.plugin`. Het in- of uitschakelen van de ene heeft geen invloed op de andere.
__OC_I18N_900003__
De config-vorm is identiek aan `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` en `targets` werken op dezelfde manier.

Kanalen die gedeelde interactieve antwoorden ondersteunen, tonen dezelfde goedkeuringsknoppen voor zowel exec- als Plugin-goedkeuringen. Kanalen zonder gedeelde interactieve UI vallen terug op platte tekst met `/approve`-instructies.

### Goedkeuringen in dezelfde chat op elk kanaal

Wanneer een exec- of Plugin-goedkeuringsverzoek afkomstig is van een afleverbaar chatoppervlak, kan dezelfde chat dit nu standaard goedkeuren met `/approve`. Dit geldt voor kanalen zoals Slack, Matrix en Microsoft Teams naast de bestaande Web UI- en terminal-UI-stromen.

Dit gedeelde tekstcommandopad gebruikt het normale kanaalauthenticatiemodel voor dat gesprek. Als de oorspronkelijke chat al opdrachten kan verzenden en antwoorden kan ontvangen, hebben goedkeuringsverzoeken niet langer een aparte native delivery-adapter nodig om in behandeling te blijven.

Discord en Telegram ondersteunen ook `/approve` in dezelfde chat, maar die kanalen gebruiken nog steeds hun opgeloste lijst met goedkeurders voor autorisatie, zelfs wanneer native goedkeuringslevering is uitgeschakeld.

Voor Telegram en andere native goedkeuringsclients die de Gateway rechtstreeks aanroepen, is deze fallback bewust beperkt tot fouten waarbij "goedkeuring niet gevonden" is. Een echte weigering/fout van exec-goedkeuring probeert niet stilzwijgend opnieuw als Plugin-goedkeuring.

### Native goedkeuringslevering

Sommige kanalen kunnen ook fungeren als native goedkeuringsclients. Native clients voegen DM's naar goedkeurders, fanout naar de oorspronkelijke chat en kanaalspecifieke interactieve goedkeurings-UX toe bovenop de gedeelde `/approve`-stroom in dezelfde chat.

Wanneer native goedkeuringskaarten/-knoppen beschikbaar zijn, is die native UI het primaire
pad voor de agent. De agent moet niet ook een dubbele platte chatopdracht
`/approve` echoën, tenzij het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of
handmatige goedkeuring het enige overgebleven pad is.

Als een native goedkeuringsclient is geconfigureerd maar er geen native runtime actief is voor
het oorspronkelijke kanaal, houdt OpenClaw de lokale deterministische `/approve`-prompt zichtbaar.
Als de native runtime actief is en levering probeert, maar geen doel de kaart ontvangt, stuurt
OpenClaw een fallbackmelding in dezelfde chat met de exacte opdracht
`/approve <id> <decision>`, zodat de aanvraag nog steeds kan worden afgehandeld.

Generiek model:

- het host-execbeleid bepaalt nog steeds of exec-goedkeuring vereist is
- `approvals.exec` regelt het doorsturen van goedkeuringsprompts naar andere chatbestemmingen
- `channels.<channel>.execApprovals` regelt of dat kanaal als native goedkeuringsclient fungeert

Native goedkeuringsclients schakelen DM-eerst-levering automatisch in wanneer al het volgende waar is:

- het kanaal ondersteunt native goedkeuringslevering
- goedkeurders kunnen worden opgelost uit expliciete `execApprovals.approvers` of eigenaaridentiteit
  zoals `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` is niet ingesteld of is `"auto"`

Stel `enabled: false` in om een native goedkeuringsclient expliciet uit te schakelen. Stel `enabled: true` in om
deze geforceerd in te schakelen wanneer goedkeurders worden opgelost. Levering naar de openbare oorspronkelijke chat blijft expliciet via
`channels.<channel>.execApprovals.target`.

FAQ: [Waarom zijn er twee exec-goedkeuringsconfiguraties voor chatgoedkeuringen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Deze native goedkeuringsclients voegen DM-routering en optionele kanaalfanout toe boven op de gedeelde
`/approve`-flow in dezelfde chat en gedeelde goedkeuringsknoppen.

Gedeeld gedrag:

- Slack, Matrix, Microsoft Teams en vergelijkbare leverbare chats gebruiken het normale kanaalauthenticatiemodel
  voor `/approve` in dezelfde chat
- wanneer een native goedkeuringsclient automatisch wordt ingeschakeld, is het standaard native leveringsdoel de DM's van goedkeurders
- voor Discord en Telegram kunnen alleen opgeloste goedkeurders goedkeuren of weigeren
- Discord-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- Telegram-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- Slack-goedkeurders kunnen expliciet zijn (`execApprovals.approvers`) of worden afgeleid uit `commands.ownerAllowFrom`
- Slack-native knoppen behouden het soort goedkeurings-id, zodat `plugin:`-id's Plugin-goedkeuringen kunnen oplossen
  zonder een tweede Slack-lokale fallbacklaag
- Matrix-native DM-/kanaalroutering en reactiesnelkoppelingen verwerken zowel exec- als Plugin-goedkeuringen;
  Plugin-autorisatie komt nog steeds van `channels.matrix.dm.allowFrom`
- Matrix-native prompts bevatten `com.openclaw.approval`-aangepaste eventinhoud bij het eerste prompt-event,
  zodat Matrix-clients die OpenClaw begrijpen gestructureerde goedkeuringsstatus kunnen lezen, terwijl standaardclients
  de plattetekstfallback `/approve` behouden
- de aanvrager hoeft geen goedkeurder te zijn
- de oorspronkelijke chat kan direct goedkeuren met `/approve` wanneer die chat al opdrachten en antwoorden ondersteunt
- native Discord-goedkeuringsknoppen routeren op basis van het soort goedkeurings-id: `plugin:`-id's gaan
  rechtstreeks naar Plugin-goedkeuringen, al het overige gaat naar exec-goedkeuringen
- native Telegram-goedkeuringsknoppen volgen dezelfde begrensde exec-naar-Plugin-fallback als `/approve`
- wanneer native `target` levering naar de oorspronkelijke chat inschakelt, bevatten goedkeuringsprompts de opdrachttekst
- wachtende exec-goedkeuringen verlopen standaard na 30 minuten
- als geen operator-UI of geconfigureerde goedkeuringsclient de aanvraag kan accepteren, valt de prompt terug op `askFallback`

Gevoelige opdrachten voor groepen die alleen voor eigenaars zijn, zoals `/diagnostics` en `/export-trajectory`, gebruiken private
eigenaarsroutering voor goedkeuringsprompts en eindresultaten. OpenClaw probeert eerst een private route op hetzelfde
oppervlak waar de eigenaar de opdracht uitvoerde. Als dat oppervlak geen private eigenaarsroute heeft, valt het
terug op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zodat een Discord-groepsopdracht
de goedkeuring en het resultaat nog steeds naar de Telegram-DM van de eigenaar kan sturen wanneer Telegram de geconfigureerde
primaire private interface is. De groepschat krijgt alleen een korte bevestiging.

Telegram gebruikt standaard DM's van goedkeurders (`target: "dm"`). Je kunt overschakelen naar `channel` of `both` wanneer je
wilt dat goedkeuringsprompts ook in de oorspronkelijke Telegram-chat/-topic verschijnen. Voor Telegram-forumtopics
behoudt OpenClaw de topic voor de goedkeuringsprompt en de opvolging na goedkeuring.

Zie:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC-flow
__OC_I18N_900004__
Beveiligingsnotities:

- Unix-socketmodus `0600`, token opgeslagen in `exec-approvals.json`.
- Controle van peer met dezelfde UID.
- Challenge/response (nonce + HMAC-token + aanvraaghash) + korte TTL.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — kernbeleid en goedkeuringsflow
- [Exec-tool](/nl/tools/exec)
- [Verhoogde modus](/nl/tools/elevated)
- [Skills](/nl/tools/skills) — automatisch-toestaan-gedrag ondersteund door Skills
