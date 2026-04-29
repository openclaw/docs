---
read_when:
    - De exec-tool gebruiken of aanpassen
    - Debuggen van stdin- of TTY-gedrag
summary: Gebruik van de exec-tool, stdin-modi en TTY-ondersteuning
title: Exec-tool
x-i18n:
    generated_at: "2026-04-29T23:23:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

Voer shellopdrachten uit in de werkruimte. Ondersteunt uitvoering op de voorgrond en achtergrond via `process`.
Als `process` niet is toegestaan, voert `exec` synchroon uit en negeert het `yieldMs`/`background`.
Achtergrondsessies zijn per agent scoped; `process` ziet alleen sessies van dezelfde agent.

## Parameters

<ParamField path="command" type="string" required>
Uit te voeren shellopdracht.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Werkmap voor de opdracht.
</ParamField>

<ParamField path="env" type="object">
Key/value-omgevingsoverschrijvingen samengevoegd boven op de geërfde omgeving.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Plaats de opdracht automatisch op de achtergrond na deze vertraging (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Plaats de opdracht onmiddellijk op de achtergrond in plaats van te wachten op `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Overschrijf de geconfigureerde exec-time-out voor deze aanroep. Stel `timeout: 0` alleen in wanneer de opdracht zonder exec-procestime-out moet worden uitgevoerd.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Voer uit in een pseudo-terminal wanneer beschikbaar. Gebruik dit voor CLI's die alleen met een TTY werken, coding agents en terminal-UI's.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Waar moet worden uitgevoerd. `auto` wordt opgelost naar `sandbox` wanneer een sandbox-runtime actief is en anders naar `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Handhavingsmodus voor uitvoering via `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Gedrag van goedkeuringsprompt voor uitvoering via `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Node-id/-naam wanneer `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Vraag verhoogde modus aan — ontsnap uit de sandbox naar het geconfigureerde hostpad. `security=full` wordt alleen afgedwongen wanneer verhoogd wordt opgelost naar `full`.
</ParamField>

Notities:

- `host` is standaard `auto`: sandbox wanneer sandbox-runtime actief is voor de sessie, anders gateway.
- `host` accepteert alleen `auto`, `sandbox`, `gateway` of `node`. Het is geen hostnaamselector; waarden die op hostnamen lijken worden afgewezen voordat de opdracht wordt uitgevoerd.
- `auto` is de standaard routeringsstrategie, geen jokerteken. Per-aanroep `host=node` is toegestaan vanuit `auto`; per-aanroep `host=gateway` is alleen toegestaan wanneer er geen sandbox-runtime actief is.
- Zonder extra configuratie werkt `host=auto` nog steeds gewoon: geen sandbox betekent dat het wordt opgelost naar `gateway`; een live sandbox betekent dat het in de sandbox blijft.
- `elevated` ontsnapt uit de sandbox naar het geconfigureerde hostpad: standaard `gateway`, of `node` wanneer `tools.exec.host=node` (of de sessiestandaard `host=node` is). Het is alleen beschikbaar wanneer verhoogde toegang is ingeschakeld voor de huidige sessie/provider.
- Goedkeuringen voor `gateway`/`node` worden beheerd door `~/.openclaw/exec-approvals.json`.
- `node` vereist een gekoppelde node (companion-app of headless node-host).
- Als er meerdere nodes beschikbaar zijn, stel dan `exec.node` of `tools.exec.node` in om er een te selecteren.
- `exec host=node` is het enige pad voor shelluitvoering voor nodes; de oude `nodes.run`-wrapper is verwijderd.
- `timeout` is van toepassing op uitvoering op de voorgrond, achtergrond, `yieldMs`, gateway, sandbox en node `system.run`. Als deze wordt weggelaten, gebruikt OpenClaw `tools.exec.timeoutSec`; expliciete `timeout: 0` schakelt de exec-procestime-out voor die aanroep uit.
- Op niet-Windows-hosts gebruikt exec `SHELL` wanneer ingesteld; als `SHELL` `fish` is, geeft het de voorkeur aan `bash` (of `sh`)
  uit `PATH` om scripts te vermijden die niet compatibel zijn met fish, en valt daarna terug op `SHELL` als geen van beide bestaat.
- Op Windows-hosts geeft exec de voorkeur aan ontdekking van PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, daarna PATH),
  en valt daarna terug op Windows PowerShell 5.1.
- Hostuitvoering (`gateway`/`node`) wijst `env.PATH` en loader-overschrijvingen (`LD_*`/`DYLD_*`) af om
  het kapen van binaries of geïnjecteerde code te voorkomen.
- OpenClaw stelt `OPENCLAW_SHELL=exec` in de opdrachtomgeving van de gestartte opdracht in (inclusief PTY- en sandboxuitvoering), zodat shell-/profielregels exec-toolcontext kunnen detecteren.
- `openclaw channels login` wordt geblokkeerd vanuit `exec` omdat het een interactieve channel-auth-flow is; voer het uit in een terminal op de gateway-host, of gebruik de channel-native login-tool vanuit chat wanneer die bestaat.
- Belangrijk: sandboxing staat **standaard uit**. Als sandboxing uitstaat, wordt impliciet `host=auto`
  opgelost naar `gateway`. Expliciet `host=sandbox` faalt nog steeds gesloten in plaats van stilzwijgend
  op de gateway-host uit te voeren. Schakel sandboxing in of gebruik `host=gateway` met goedkeuringen.
- Script-preflightcontroles (voor veelvoorkomende Python-/Node-shellsyntaxfouten) inspecteren alleen bestanden binnen de
  effectieve `workdir`-grens. Als een scriptpad buiten `workdir` wordt opgelost, wordt preflight voor
  dat bestand overgeslagen.
- Voor langlopende werkzaamheden die nu starten: start ze eenmaal en vertrouw op automatische
  voltooiingswake wanneer die is ingeschakeld en de opdracht uitvoer produceert of faalt.
  Gebruik `process` voor logs, status, invoer of interventie; emuleer geen
  planning met slaaplussen, time-outlussen of herhaalde polling.
- Voor werk dat later of volgens een schema moet plaatsvinden, gebruik cron in plaats van
  `exec`-slaap-/vertragingspatronen.

## Configuratie

- `tools.exec.notifyOnExit` (standaard: true): wanneer true, plaatsen op de achtergrond gezette exec-sessies een systeemgebeurtenis in de wachtrij en vragen ze bij afsluiten een Heartbeat aan.
- `tools.exec.approvalRunningNoticeMs` (standaard: 10000): emit één “running”-melding wanneer een exec met verplichte goedkeuring langer draait dan dit (0 schakelt uit).
- `tools.exec.timeoutSec` (standaard: 1800): standaard exec-time-out per opdracht in seconden. Per-aanroep `timeout` overschrijft deze; per-aanroep `timeout: 0` schakelt de exec-procestime-out uit.
- `tools.exec.host` (standaard: `auto`; wordt opgelost naar `sandbox` wanneer sandbox-runtime actief is, anders `gateway`)
- `tools.exec.security` (standaard: `deny` voor sandbox, `full` voor gateway + node wanneer niet ingesteld)
- `tools.exec.ask` (standaard: `off`)
- Host-exec zonder goedkeuring is standaard voor gateway + node. Als u goedkeurings-/toestemmingslijstgedrag wilt, verstrak dan zowel `tools.exec.*` als de host `~/.openclaw/exec-approvals.json`; zie [Exec-goedkeuringen](/nl/tools/exec-approvals#no-approval-yolo-mode).
- YOLO komt voort uit de standaardwaarden van het hostbeleid (`security=full`, `ask=off`), niet uit `host=auto`. Als u gateway- of node-routering wilt afdwingen, stel dan `tools.exec.host` in of gebruik `/exec host=...`.
- In de modus `security=full` plus `ask=off` volgt host-exec direct het geconfigureerde beleid; er is geen extra heuristische prefilter voor opdrachtverduistering of script-preflightafwijzingslaag.
- `tools.exec.node` (standaard: niet ingesteld)
- `tools.exec.strictInlineEval` (standaard: false): wanneer true, vereisen inline interpreter-evalvormen zoals `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` en `osascript -e` altijd expliciete goedkeuring. `allow-always` kan nog steeds goedaardige interpreter-/scriptaanroepen blijven toestaan, maar inline-evalvormen vragen nog steeds elke keer om bevestiging.
- `tools.exec.pathPrepend`: lijst met mappen die vóór `PATH` moeten worden geplaatst voor exec-runs (alleen gateway + sandbox).
- `tools.exec.safeBins`: veilige binaries met alleen stdin die zonder expliciete toestemmingslijstvermeldingen kunnen worden uitgevoerd. Zie [Veilige bins](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) voor gedragsdetails.
- `tools.exec.safeBinTrustedDirs`: aanvullende expliciete mappen die worden vertrouwd voor `safeBins`-padcontroles. `PATH`-items worden nooit automatisch vertrouwd. Ingebouwde standaardwaarden zijn `/bin` en `/usr/bin`.
- `tools.exec.safeBinProfiles`: optioneel aangepast argv-beleid per veilige bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: voegt uw login-shell-`PATH` samen in de exec-omgeving. `env.PATH`-overschrijvingen worden
  afgewezen voor hostuitvoering. De daemon zelf draait nog steeds met een minimale `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: voert `sh -lc` (login-shell) uit binnen de container, dus `/etc/profile` kan `PATH` resetten.
  OpenClaw plaatst `env.PATH` vóór na het sourcen van het profiel via een interne env-var (geen shellinterpolatie);
  `tools.exec.pathPrepend` is hier ook van toepassing.
- `host=node`: alleen niet-geblokkeerde env-overschrijvingen die u doorgeeft, worden naar de node verzonden. `env.PATH`-overschrijvingen worden
  afgewezen voor hostuitvoering en genegeerd door node-hosts. Als u extra PATH-items op een node nodig hebt,
  configureer dan de serviceomgeving van de node-host (systemd/launchd) of installeer tools op standaardlocaties.

Node-binding per agent (gebruik de agentlijstindex in configuratie):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: het tabblad Nodes bevat een klein paneel “Exec node binding” voor dezelfde instellingen.

## Sessieoverschrijvingen (`/exec`)

Gebruik `/exec` om **per-sessie** standaardwaarden voor `host`, `security`, `ask` en `node` in te stellen.
Verzend `/exec` zonder argumenten om de huidige waarden te tonen.

Voorbeeld:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisatiemodel

`/exec` wordt alleen gehonoreerd voor **geautoriseerde afzenders** (channel-toestemmingslijsten/koppeling plus `commands.useAccessGroups`).
Het werkt alleen **sessiestatus** bij en schrijft geen configuratie. Om exec hard uit te schakelen, weigert u het via toolbeleid
(`tools.deny: ["exec"]` of per agent). Hostgoedkeuringen blijven van toepassing tenzij u expliciet
`security=full` en `ask=off` instelt.

## Exec-goedkeuringen (companion-app / node-host)

Gesandboxte agents kunnen per-requestgoedkeuring vereisen voordat `exec` op de gateway- of node-host wordt uitgevoerd.
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het beleid, de toestemmingslijst en de UI-flow.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool onmiddellijk met
`status: "approval-pending"` en een goedkeurings-id. Zodra goedgekeurd (of geweigerd / verlopen),
emit de Gateway systeemgebeurtenissen (`Exec finished` / `Exec denied`). Als de opdracht nog steeds
draait na `tools.exec.approvalRunningNoticeMs`, wordt één `Exec running`-melding geëmiteerd.
Op channels met native goedkeuringskaarten/-knoppen moet de agent eerst op die
native UI vertrouwen en alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat
expliciet zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het
enige pad is.

## Toestemmingslijst + veilige bins

Handmatige handhaving van de toestemmingslijst matcht opgeloste binary-padglobs en kale commandonaam-
globs. Kale namen matchen alleen opdrachten die via PATH worden aangeroepen, dus `rg` kan matchen met
`/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar niet met `./rg` of `/tmp/rg`.
Wanneer `security=allowlist`, worden shellopdrachten alleen automatisch toegestaan als elk pipeline-
segment op de toestemmingslijst staat of een veilige bin is. Koppeling (`;`, `&&`, `||`) en omleidingen
worden in toestemmingslijstmodus afgewezen tenzij elk top-level segment voldoet aan de
toestemmingslijst (inclusief veilige bins). Omleidingen blijven niet ondersteund.
Duurzaam `allow-always`-vertrouwen omzeilt die regel niet: een gekoppelde opdracht vereist nog steeds dat elk
top-level segment matcht.

`autoAllowSkills` is een afzonderlijk gemakspad in exec-goedkeuringen. Het is niet hetzelfde als
handmatige padvermeldingen in de toestemmingslijst. Houd `autoAllowSkills` uitgeschakeld voor strikt expliciet vertrouwen.

Gebruik de twee controles voor verschillende taken:

- `tools.exec.safeBins`: kleine, alleen-stdin streamfilters.
- `tools.exec.safeBinTrustedDirs`: expliciete extra vertrouwde mappen voor uitvoerbare paden van veilige bins.
- `tools.exec.safeBinProfiles`: expliciet argv-beleid voor aangepaste veilige bins.
- toestemmingslijst: expliciet vertrouwen voor uitvoerbare paden.

Behandel `safeBins` niet als een generieke allowlist, en voeg geen interpreter-/runtime-binaries toe (bijvoorbeeld `python3`, `node`, `ruby`, `bash`). Als je die nodig hebt, gebruik dan expliciete allowlist-vermeldingen en houd goedkeuringsprompts ingeschakeld.
`openclaw security audit` waarschuwt wanneer interpreter-/runtime-vermeldingen in `safeBins` expliciete profielen missen, en `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles`-vermeldingen scaffolden.
`openclaw security audit` en `openclaw doctor` waarschuwen ook wanneer je expliciet bins met breed gedrag, zoals `jq`, opnieuw aan `safeBins` toevoegt.
Als je interpreters expliciet op de allowlist zet, schakel dan `tools.exec.strictInlineEval` in zodat inline code-evaluatievormen nog steeds nieuwe goedkeuring vereisen.

Zie [Exec-goedkeuringen](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) en [Veilige bins versus allowlist](/nl/tools/exec-approvals-advanced#safe-bins-versus-allowlist) voor volledige beleidsdetails en voorbeelden.

## Voorbeelden

Voorgrond:

```json
{ "tool": "exec", "command": "ls -la" }
```

Achtergrond + polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling is voor status op aanvraag, niet voor wachtlussen. Als automatisch ontwaken bij voltooiing
is ingeschakeld, kan de opdracht de sessie wekken wanneer deze uitvoer produceert of faalt.

Toetsen sturen (tmux-stijl):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Indienen (alleen CR sturen):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Plakken (standaard bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` is een subtool van `exec` voor gestructureerde bewerkingen in meerdere bestanden.
Het is standaard ingeschakeld voor OpenAI- en OpenAI Codex-modellen. Gebruik configuratie alleen
wanneer je het wilt uitschakelen of beperken tot specifieke modellen:

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
- Configuratie bevindt zich onder `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` is standaard `true`; stel dit in op `false` om de tool voor OpenAI-modellen uit te schakelen.
- `tools.exec.applyPatch.workspaceOnly` is standaard `true` (binnen de workspace). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de workspace-directory schrijft/verwijdert.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Sandboxing](/nl/gateway/sandboxing) — opdrachten uitvoeren in sandboxomgevingen
- [Achtergrondproces](/nl/gateway/background-process) — langlopende exec- en process-tool
- [Beveiliging](/nl/gateway/security) — toolbeleid en verhoogde toegang
