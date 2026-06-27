---
read_when:
    - De exec-tool gebruiken of wijzigen
    - stdin- of TTY-gedrag debuggen
summary: Gebruik van de exec-tool, stdin-modi en TTY-ondersteuning
title: Uitvoeringstool
x-i18n:
    generated_at: "2026-06-27T18:25:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Voer shellopdrachten uit in de workspace. `exec` is een muterend shelloppervlak: opdrachten kunnen bestanden maken, bewerken of verwijderen overal waar de geselecteerde host of het sandbox-bestandssysteem dat toestaat. Het uitschakelen van OpenClaw-bestandssysteemtools zoals `write`, `edit` of `apply_patch` maakt `exec` niet alleen-lezen.

Ondersteunt uitvoering op de voorgrond en achtergrond via `process`. Als `process` niet is toegestaan, voert `exec` synchroon uit en negeert het `yieldMs`/`background`.
Achtergrondsessies zijn per agent gescoped; `process` ziet alleen sessies van dezelfde agent.

## Parameters

<ParamField path="command" type="string" required>
Shellopdracht om uit te voeren.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Werkdirectory voor de opdracht.
</ParamField>

<ParamField path="env" type="object">
Key/value-omgevingsoverschrijvingen die boven op de geërfde omgeving worden samengevoegd.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Zet de opdracht automatisch op de achtergrond na deze vertraging (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Zet de opdracht onmiddellijk op de achtergrond in plaats van te wachten op `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Overschrijf de geconfigureerde exec-time-out voor deze aanroep. Stel `timeout: 0` alleen in wanneer de opdracht zonder time-out van het exec-proces moet draaien.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Voer uit in een pseudo-terminal wanneer beschikbaar. Gebruik dit voor TTY-only CLI's, coding agents en terminal-UI's.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Waar moet worden uitgevoerd. `auto` wordt opgelost naar `sandbox` wanneer een sandboxruntime actief is en anders naar `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Genegeerd voor normale toolaanroepen. `gateway`- / `node`-beveiliging wordt beheerd door
`tools.exec.security` en het hostgoedkeuringsbestand; verhoogde modus kan
`security=full` alleen afdwingen wanneer de operator expliciet verhoogde toegang verleent.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
De basisvraagmodus komt uit `tools.exec.ask` en hostgoedkeuringen.
Voor modelaanroepen afkomstig uit kanalen wordt `ask` per aanroep genegeerd wanneer de
effectieve hostvraag `off` is; anders kan deze alleen worden aangescherpt naar een strengere
modus. Vertrouwde interne/API-aanroepers die exec-tools construeren met een
expliciete `ask`-waarde blijven ongewijzigd.
</ParamField>

<ParamField path="node" type="string">
Node-id/naam wanneer `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Vraag verhoogde modus aan — ontsnap uit de sandbox naar het geconfigureerde hostpad. `security=full` wordt alleen afgedwongen wanneer verhoogd oplost naar `full`.
</ParamField>

Opmerkingen:

- `host` staat standaard op `auto`: sandbox wanneer een sandboxruntime actief is voor de sessie, anders gateway.
- `host` accepteert alleen `auto`, `sandbox`, `gateway` of `node`. Het is geen hostname-selector; waarden die op hostnames lijken, worden geweigerd voordat de opdracht draait.
- `auto` is de standaardrouteringsstrategie, geen wildcard. Per aanroep is `host=node` toegestaan vanuit `auto`; per aanroep is `host=gateway` alleen toegestaan wanneer er geen sandboxruntime actief is.
- `tools.exec.mode` is de genormaliseerde beleidsknop. Waarden zijn `deny`, `allowlist`, `ask`, `auto` en `full`. `auto` voert deterministische allowlist-/safe-bin-matches rechtstreeks uit en routeert elk resterend geval voor exec-goedkeuring via OpenClaw's native automatische reviewer voordat een mens wordt gevraagd. `ask` / `ask=always` vraagt nog steeds elke keer een mens.
- Zonder extra config werkt `host=auto` nog steeds gewoon: geen sandbox betekent dat het oplost naar `gateway`; een live sandbox betekent dat het in de sandbox blijft.
- `elevated` ontsnapt uit de sandbox naar het geconfigureerde hostpad: standaard `gateway`, of `node` wanneer `tools.exec.host=node` (of de sessiestandaard `host=node` is). Het is alleen beschikbaar wanneer verhoogde toegang is ingeschakeld voor de huidige sessie/provider.
- `gateway`/`node`-goedkeuringen worden beheerd door het hostgoedkeuringsbestand.
- `node` vereist een gekoppelde node (companion-app of headless node-host).
- Als meerdere nodes beschikbaar zijn, stel dan `exec.node` of `tools.exec.node` in om er één te selecteren.
- `exec host=node` is het enige shelluitvoeringspad voor nodes; de verouderde `nodes.run`-wrapper is verwijderd.
- `timeout` geldt voor uitvoering op de voorgrond, achtergrond, `yieldMs`, gateway, sandbox en node `system.run`. Als het wordt weggelaten, gebruikt OpenClaw `tools.exec.timeoutSec`; expliciete `timeout: 0` schakelt de time-out van het exec-proces voor die aanroep uit.
- Op niet-Windows-hosts gebruikt exec `SHELL` wanneer ingesteld; als `SHELL` `fish` is, geeft het de voorkeur aan `bash` (of `sh`)
  uit `PATH` om fish-incompatibele scripts te vermijden, en valt daarna terug op `SHELL` als geen van beide bestaat.
- Op Windows-hosts geeft exec de voorkeur aan PowerShell 7 (`pwsh`)-detectie (Program Files, ProgramW6432, daarna PATH),
  en valt daarna terug op Windows PowerShell 5.1.
- Op niet-Windows gateway-hosts gebruiken bash- en zsh-execopdrachten een opstartsnapshot. OpenClaw legt sourcebare
  aliassen/functies en een kleine veilige omgevingsset uit shellopstartbestanden vast in
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, en sourcet die snapshot daarna vóór elke execopdracht.
  Variabelen die op geheimen lijken worden uitgesloten; sandbox- en node-exec gebruiken deze snapshot niet. Stel
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in de Gateway-procesomgeving in om dit snapshotpad uit te schakelen.
- Hostuitvoering (`gateway`/`node`) weigert `env.PATH` en loader-overschrijvingen (`LD_*`/`DYLD_*`) om
  binary hijacking of geïnjecteerde code te voorkomen.
- OpenClaw stelt `OPENCLAW_SHELL=exec` in de omgeving van de gespawnde opdracht in (inclusief PTY- en sandboxuitvoering), zodat shell-/profielregels exec-toolcontext kunnen detecteren.
- Voor runs afkomstig uit kanalen stelt OpenClaw ook een smalle JSON-payload met afzender-/chatidentiteit beschikbaar in
  `OPENCLAW_CHANNEL_CONTEXT` wanneer het kanaal die id's heeft geleverd.
- `openclaw channels login` wordt geblokkeerd vanuit `exec` omdat het een interactieve kanaal-auth-flow is; voer het uit in een terminal op de gateway-host, of gebruik de kanaaleigen login-tool vanuit chat wanneer die bestaat.
- Belangrijk: sandboxing staat **standaard uit**. Als sandboxing uit staat, lost impliciete `host=auto`
  op naar `gateway`. Expliciete `host=sandbox` faalt nog steeds gesloten in plaats van stilzwijgend
  op de gateway-host te draaien. Schakel sandboxing in of gebruik `host=gateway` met goedkeuringen.
- Script-preflightcontroles (voor veelvoorkomende Python/Node-shellsyntaxisfouten) inspecteren alleen bestanden binnen de
  effectieve `workdir`-grens. Als een scriptpad buiten `workdir` oplost, wordt preflight voor
  dat bestand overgeslagen.
- Voor langlopende werkzaamheden die nu starten: start ze één keer en vertrouw op automatisch
  voltooiingswekken wanneer dit is ingeschakeld en de opdracht uitvoer produceert of faalt.
  Gebruik `process` voor logs, status, invoer of interventie; emuleer geen
  planning met slaaplussen, time-outlussen of herhaald pollen.
- Voor werk dat later of volgens een schema moet gebeuren, gebruik Cron in plaats van
  `exec`-slaap-/vertragingspatronen.

## Config

- `tools.exec.notifyOnExit` (standaard: true): wanneer true, plaatsen op de achtergrond gezette execsessies een systeemevent in de wachtrij en vragen ze bij afsluiten een Heartbeat aan.
- `tools.exec.approvalRunningNoticeMs` (standaard: 10000): geef één enkele melding "actief" wanneer een exec met goedkeuringspoort langer draait dan dit (0 schakelt uit).
- `tools.exec.timeoutSec` (standaard: 1800): standaard exec-time-out per opdracht in seconden. `timeout` per aanroep overschrijft dit; `timeout: 0` per aanroep schakelt de time-out van het exec-proces uit.
- `tools.exec.host` (standaard: `auto`; lost op naar `sandbox` wanneer sandboxruntime actief is, anders `gateway`)
- `tools.exec.security` (standaard: `deny` voor sandbox, `full` voor gateway + node wanneer niet ingesteld)
- `tools.exec.ask` (standaard: `off`)
- Host-exec zonder goedkeuring is de standaard voor gateway + node. Als je goedkeurings-/allowlistgedrag wilt, maak dan zowel `tools.exec.*` als het hostgoedkeuringsbestand strenger; zie [Exec-goedkeuringen](/nl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO komt uit de hostbeleidsstandaarden (`security=full`, `ask=off`), niet uit `host=auto`. Als je gateway- of node-routering wilt afdwingen, stel dan `tools.exec.host` in of gebruik `/exec host=...`.
- In de modus `security=full` plus `ask=off` volgt host-exec rechtstreeks het geconfigureerde beleid; er is geen extra heuristische prefilter voor opdrachtobfuscatie of script-preflightweigering.
- `tools.exec.node` (standaard: niet ingesteld)
- `tools.exec.strictInlineEval` (standaard: false): wanneer true vereisen inline interpreter-evalvormen zoals `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` en `osascript -e` reviewer- of expliciete goedkeuring. In `mode=auto` kan het normale exec-goedkeuringspad de native automatische reviewer een duidelijk laag-risico eenmalige opdracht laten toestaan; directe node-host `system.run`-aanroepen vereisen nog steeds expliciete goedkeuring omdat ze de opdracht niet aan een menselijke goedkeuringsroute kunnen doorgeven. Als de reviewer daarom vraagt, gaat het verzoek naar een mens. `allow-always` kan nog steeds goedaardige interpreter-/scriptaanroepen persistent maken, maar inline-evalvormen worden geen duurzame toestemmingsregels.
- `tools.exec.commandHighlighting` (standaard: false): wanneer true kunnen goedkeuringsprompts parser-afgeleide opdrachtsegmenten in de opdrachttekst markeren. Stel dit globaal of per agent in op `true` om markering van opdrachttekst in te schakelen zonder het exec-goedkeuringsbeleid te wijzigen.
- `tools.exec.pathPrepend`: lijst met directories om vóór `PATH` te plaatsen voor exec-runs (alleen gateway + sandbox).
- `tools.exec.safeBins`: stdin-only veilige binaries die zonder expliciete allowlist-items kunnen draaien. Zie voor gedragsdetails [Veilige binaries](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: aanvullende expliciete directories die worden vertrouwd voor `safeBins`-padcontroles. `PATH`-items worden nooit automatisch vertrouwd. Ingebouwde standaarden zijn `/bin` en `/usr/bin`.
- `tools.exec.safeBinProfiles`: optioneel aangepast argv-beleid per veilige binary (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Voorbeeld:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH-afhandeling

- `host=gateway`: voegt de `PATH` van je login-shell samen in de execomgeving. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering. De daemon zelf draait nog steeds met een minimale `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Om te voorkomen dat gebruikersshellconfiguratie (zoals `~/.zshenv` of `/etc/zshenv`) prioriteitspaden tijdens het opstarten overschrijft, worden `tools.exec.pathPrepend`-items veilig vóór de uiteindelijke `PATH` binnen de shellopdracht geplaatst, direct vóór uitvoering.
- `host=sandbox`: draait `sh -lc` (login-shell) binnen de container, dus `/etc/profile` kan `PATH` resetten.
  OpenClaw plaatst `env.PATH` na het sourcen van het profiel vóór via een interne env-var (geen shellinterpolatie);
  `tools.exec.pathPrepend` geldt hier ook.
- `host=node`: alleen niet-geblokkeerde env-overschrijvingen die je doorgeeft, worden naar de node gestuurd. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering en genegeerd door node-hosts. Als je extra PATH-items op een node nodig hebt,
  configureer dan de serviceomgeving van de node-host (systemd/launchd) of installeer tools op standaardlocaties.

Node-binding per agent (gebruik de agentlijstindex in config):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: het tabblad Nodes bevat een klein paneel "Exec-nodebinding" voor dezelfde instellingen.

## Sessie-overschrijvingen (`/exec`)

Gebruik `/exec` om **per sessie** standaarden in te stellen voor `host`, `security`, `ask` en `node`.
Stuur `/exec` zonder argumenten om de huidige waarden te tonen.

Voorbeeld:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisatiemodel

`/exec` wordt alleen gehonoreerd voor **geautoriseerde afzenders** (kanaal-allowlists/koppeling plus `commands.useAccessGroups`).
Het werkt alleen **sessiestatus** bij en schrijft geen configuratie. Geautoriseerde afzenders van externe kanalen mogen
deze sessiestandaarden instellen. Interne gateway-/webchatclients hebben `operator.admin` nodig om ze permanent op te slaan.
Om exec hard uit te schakelen, weiger je het via toolbeleid (`tools.deny: ["exec"]` of per agent). Hostgoedkeuringen
blijven gelden, tenzij je expliciet `security=full` en `ask=off` instelt.

## Exec-goedkeuringen (companion-app / Node-host)

Agents in een sandbox kunnen per aanvraag goedkeuring vereisen voordat `exec` op de gateway of Node-host wordt uitgevoerd.
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het beleid, de allowlist en de UI-flow.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool onmiddellijk met
`status: "approval-pending"` en een goedkeurings-id. Zodra goedgekeurd (of geweigerd / verlopen),
zendt de Gateway opdrachtvoortgang en systeemgebeurtenissen voor voltooiing alleen uit voor goedgekeurde runs
(`Exec running` / `Exec finished`). Geweigerde of verlopen goedkeuringen zijn terminaal en
wekken de agentsessie niet met een systeemgebeurtenis voor weigering.
Op kanalen met native goedkeuringskaarten/-knoppen moet de agent eerst op die
native UI vertrouwen en alleen een handmatige `/approve`-opdracht opnemen wanneer het
toolresultaat expliciet zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het
enige pad is.

## Allowlist + veilige bins

Handmatige allowlist-afdwinging matcht opgeloste globs voor binaire paden en
globs voor kale opdrachtnamen. Kale namen matchen alleen opdrachten die via PATH worden aangeroepen, dus `rg` kan
`/opt/homebrew/bin/rg` matchen wanneer de opdracht `rg` is, maar niet `./rg` of `/tmp/rg`.
Wanneer `security=allowlist` is, worden shellopdrachten alleen automatisch toegestaan als elk pijplijnsegment
op de allowlist staat of een veilige bin is. Chaining (`;`, `&&`, `||`) en omleidingen
worden in allowlist-modus geweigerd, tenzij elk topniveausegment aan de
allowlist voldoet (inclusief veilige bins). Omleidingen blijven niet ondersteund.
Duurzaam `allow-always`-vertrouwen omzeilt die regel niet: een chained opdracht vereist nog steeds dat elk
topniveausegment matcht.

`autoAllowSkills` is een afzonderlijk gemakspad in exec-goedkeuringen. Het is niet hetzelfde als
handmatige allowlist-items voor paden. Houd `autoAllowSkills` uitgeschakeld voor strikt expliciet vertrouwen.

Gebruik de twee besturingselementen voor verschillende taken:

- `tools.exec.safeBins`: kleine, alleen-stdin streamfilters.
- `tools.exec.safeBinTrustedDirs`: expliciete extra vertrouwde mappen voor uitvoerbare paden van veilige bins.
- `tools.exec.safeBinProfiles`: expliciet argv-beleid voor aangepaste veilige bins.
- allowlist: expliciet vertrouwen voor uitvoerbare paden.

Behandel `safeBins` niet als een generieke allowlist en voeg geen interpreter-/runtime-binaries toe (bijvoorbeeld `python3`, `node`, `ruby`, `bash`). Als je die nodig hebt, gebruik dan expliciete allowlist-items en laat goedkeuringsprompts ingeschakeld.
`openclaw security audit` waarschuwt wanneer interpreter-/runtime-items in `safeBins` geen expliciete profielen hebben, en `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles`-items scaffolden.
`openclaw security audit` en `openclaw doctor` waarschuwen ook wanneer je expliciet bins met breed gedrag, zoals `jq`, weer aan `safeBins` toevoegt.
Als je interpreters expliciet op de allowlist zet, schakel dan `tools.exec.strictInlineEval` in zodat inline code-eval-vormen nog steeds reviewer- of expliciete goedkeuring vereisen.

Zie voor volledige beleidsdetails en voorbeelden [Exec-goedkeuringen](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) en [Veilige bins versus allowlist](/nl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Voorbeelden

Voorgrond:

```json
{ "tool": "exec", "command": "ls -la" }
```

Achtergrond + pollen:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Pollen is bedoeld voor status op aanvraag, niet voor wachtlussen. Als automatisch wekken bij voltooiing
is ingeschakeld, kan de opdracht de sessie wekken wanneer deze uitvoer produceert of mislukt.

Toetsen verzenden (tmux-stijl):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Indienen (alleen CR verzenden):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Plakken (standaard bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` is een subtool van `exec` voor gestructureerde bewerkingen over meerdere bestanden.
Deze is standaard ingeschakeld voor OpenAI- en OpenAI Codex-modellen. Gebruik configuratie alleen
wanneer je deze wilt uitschakelen of beperken tot specifieke modellen:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Opmerkingen:

- Alleen beschikbaar voor OpenAI-/OpenAI Codex-modellen.
- Toolbeleid blijft van toepassing; `allow: ["write"]` staat impliciet `apply_patch` toe.
- `deny: ["write"]` weigert `apply_patch` niet; weiger `apply_patch` expliciet of gebruik `deny: ["group:fs"]` wanneer patch-schrijfbewerkingen ook geblokkeerd moeten worden.
- Configuratie staat onder `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` is standaard `true`; stel dit in op `false` om de tool voor OpenAI-modellen uit te schakelen.
- `tools.exec.applyPatch.workspaceOnly` is standaard `true` (beperkt tot de workspace). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de workspacemap schrijft/verwijdert.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Sandboxing](/nl/gateway/sandboxing) — opdrachten uitvoeren in sandboxomgevingen
- [Achtergrondproces](/nl/gateway/background-process) — langlopende exec- en process-tool
- [Beveiliging](/nl/gateway/security) — toolbeleid en verhoogde toegang
