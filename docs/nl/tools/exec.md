---
read_when:
    - De exec-tool gebruiken of wijzigen
    - Debuggen van stdin- of TTY-gedrag
summary: Gebruik van de exec-tool, stdin-modi en TTY-ondersteuning
title: Uitvoeringstool
x-i18n:
    generated_at: "2026-05-03T21:38:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

Voer shellopdrachten uit in de workspace. Ondersteunt uitvoering op de voorgrond + achtergrond via `process`.
Als `process` niet is toegestaan, draait `exec` synchroon en negeert het `yieldMs`/`background`.
Achtergrondsessies zijn per agent afgebakend; `process` ziet alleen sessies van dezelfde agent.

## Parameters

<ParamField path="command" type="string" required>
Uit te voeren shellopdracht.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Werkdirectory voor de opdracht.
</ParamField>

<ParamField path="env" type="object">
Key/value-omgevingsoverschrijvingen samengevoegd boven op de overgeërfde omgeving.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Zet de opdracht na deze vertraging (ms) automatisch op de achtergrond.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Zet de opdracht direct op de achtergrond in plaats van te wachten op `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Overschrijf de geconfigureerde exec-time-out voor deze aanroep. Stel `timeout: 0` alleen in wanneer de opdracht zonder time-out van het exec-proces moet draaien.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Voer uit in een pseudo-terminal wanneer beschikbaar. Gebruik dit voor TTY-only CLI's, coding agents en terminal-UI's.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Waar uitgevoerd moet worden. `auto` wordt omgezet naar `sandbox` wanneer een sandboxruntime actief is en anders naar `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Handhavingsmodus voor uitvoering via `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Gedrag van de goedkeuringsprompt voor uitvoering via `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Node-id/naam wanneer `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Vraag verhoogde modus aan — verlaat de sandbox naar het geconfigureerde hostpad. `security=full` wordt alleen afgedwongen wanneer verhoogd wordt omgezet naar `full`.
</ParamField>

Opmerkingen:

- `host` staat standaard op `auto`: sandbox wanneer de sandboxruntime actief is voor de sessie, anders Gateway.
- `host` accepteert alleen `auto`, `sandbox`, `gateway` of `node`. Het is geen hostnaamselector; hostnaamachtige waarden worden afgewezen voordat de opdracht draait.
- `auto` is de standaardrouteringsstrategie, geen wildcard. Per-aanroep `host=node` is toegestaan vanuit `auto`; per-aanroep `host=gateway` is alleen toegestaan wanneer er geen sandboxruntime actief is.
- Zonder extra configuratie werkt `host=auto` nog steeds direct: geen sandbox betekent dat het wordt omgezet naar `gateway`; een live sandbox betekent dat het in de sandbox blijft.
- `elevated` verlaat de sandbox naar het geconfigureerde hostpad: standaard `gateway`, of `node` wanneer `tools.exec.host=node` (of wanneer de sessiestandaard `host=node` is). Het is alleen beschikbaar wanneer verhoogde toegang is ingeschakeld voor de huidige sessie/provider.
- `gateway`/`node`-goedkeuringen worden beheerd door `~/.openclaw/exec-approvals.json`.
- `node` vereist een gekoppelde Node (companion app of headless Node-host).
- Als er meerdere Nodes beschikbaar zijn, stel dan `exec.node` of `tools.exec.node` in om er een te selecteren.
- `exec host=node` is het enige shell-uitvoeringspad voor Nodes; de legacy `nodes.run`-wrapper is verwijderd.
- `timeout` geldt voor voorgrond-, achtergrond-, `yieldMs`-, Gateway-, sandbox- en Node-`system.run`-uitvoering. Als dit is weggelaten, gebruikt OpenClaw `tools.exec.timeoutSec`; expliciete `timeout: 0` schakelt de time-out van het exec-proces uit voor die aanroep.
- Op niet-Windows-hosts gebruikt exec `SHELL` wanneer dit is ingesteld; als `SHELL` `fish` is, geeft het de voorkeur aan `bash` (of `sh`)
  uit `PATH` om fish-incompatibele scripts te vermijden, en valt daarna terug op `SHELL` als geen van beide bestaat.
- Op Windows-hosts geeft exec de voorkeur aan PowerShell 7 (`pwsh`)-detectie (Program Files, ProgramW6432, daarna PATH),
  en valt daarna terug op Windows PowerShell 5.1.
- Hostuitvoering (`gateway`/`node`) weigert `env.PATH` en loader-overschrijvingen (`LD_*`/`DYLD_*`) om
  binary hijacking of geïnjecteerde code te voorkomen.
- OpenClaw zet `OPENCLAW_SHELL=exec` in de omgeving van de gespawnde opdracht (inclusief PTY- en sandboxuitvoering), zodat shell-/profielregels exec-toolcontext kunnen detecteren.
- `openclaw channels login` wordt vanuit `exec` geblokkeerd omdat het een interactieve channel-auth-flow is; voer het uit in een terminal op de Gateway-host, of gebruik de channel-native login-tool vanuit chat wanneer die bestaat.
- Belangrijk: sandboxing staat **standaard uit**. Als sandboxing uitstaat, wordt impliciete `host=auto`
  omgezet naar `gateway`. Expliciete `host=sandbox` faalt nog steeds gesloten in plaats van stilzwijgend
  op de Gateway-host te draaien. Schakel sandboxing in of gebruik `host=gateway` met goedkeuringen.
- Script-preflightcontroles (voor veelvoorkomende Python/Node-shellsyntaxisfouten) inspecteren alleen bestanden binnen de
  effectieve `workdir`-grens. Als een scriptpad buiten `workdir` wordt omgezet, wordt preflight voor
  dat bestand overgeslagen.
- Voor langdurig werk dat nu begint, start het één keer en vertrouw op automatische
  voltooiings-wake wanneer dit is ingeschakeld en de opdracht uitvoer schrijft of faalt.
  Gebruik `process` voor logs, status, invoer of interventie; emuleer geen
  planning met slaaplussen, time-outlussen of herhaald pollen.
- Voor werk dat later of volgens een schema moet plaatsvinden, gebruik cron in plaats van
  `exec`-slaap-/vertragingspatronen.

## Config

- `tools.exec.notifyOnExit` (standaard: true): wanneer true, plaatsen exec-sessies op de achtergrond bij afsluiten een systeemevent in de wachtrij en vragen ze een Heartbeat aan.
- `tools.exec.approvalRunningNoticeMs` (standaard: 10000): geef één “running”-melding wanneer een goedkeuringsgebonden exec langer draait dan dit (0 schakelt uit).
- `tools.exec.timeoutSec` (standaard: 1800): standaard time-out per exec-opdracht in seconden. Per-aanroep `timeout` overschrijft dit; per-aanroep `timeout: 0` schakelt de time-out van het exec-proces uit.
- `tools.exec.host` (standaard: `auto`; wordt omgezet naar `sandbox` wanneer de sandboxruntime actief is, anders naar `gateway`)
- `tools.exec.security` (standaard: `deny` voor sandbox, `full` voor Gateway + Node wanneer niet ingesteld)
- `tools.exec.ask` (standaard: `off`)
- Host-exec zonder goedkeuring is de standaard voor Gateway + Node. Als je goedkeurings-/allowlist-gedrag wilt, maak dan zowel `tools.exec.*` als de host-`~/.openclaw/exec-approvals.json` strikter; zie [Exec-goedkeuringen](/nl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO komt uit de hostbeleidsstandaarden (`security=full`, `ask=off`), niet uit `host=auto`. Als je Gateway- of Node-routering wilt afdwingen, stel dan `tools.exec.host` in of gebruik `/exec host=...`.
- In de modus `security=full` plus `ask=off` volgt host-exec direct het geconfigureerde beleid; er is geen extra heuristische command-obfuscation-prefilter of script-preflight-afwijzingslaag.
- `tools.exec.node` (standaard: niet ingesteld)
- `tools.exec.strictInlineEval` (standaard: false): wanneer true, vereisen inline interpreter-eval-vormen zoals `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` en `osascript -e` altijd expliciete goedkeuring. `allow-always` kan nog steeds goedaardige interpreter-/scriptaanroepen bewaren, maar inline-eval-vormen vragen nog steeds elke keer om toestemming.
- `tools.exec.pathPrepend`: lijst met directories om vóór `PATH` te plaatsen voor exec-runs (alleen Gateway + sandbox).
- `tools.exec.safeBins`: stdin-only veilige binaries die zonder expliciete allowlist-vermeldingen kunnen draaien. Zie [Veilige bins](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) voor gedragsdetails.
- `tools.exec.safeBinTrustedDirs`: aanvullende expliciete directories die worden vertrouwd voor `safeBins`-padcontroles. `PATH`-vermeldingen worden nooit automatisch vertrouwd. Ingebouwde standaarden zijn `/bin` en `/usr/bin`.
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

- `host=gateway`: voegt je login-shell-`PATH` samen in de exec-omgeving. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering. De daemon zelf draait nog steeds met een minimale `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: draait `sh -lc` (login-shell) binnen de container, dus `/etc/profile` kan `PATH` resetten.
  OpenClaw voegt `env.PATH` vóór toe na het sourcen van het profiel via een interne env-var (geen shellinterpolatie);
  `tools.exec.pathPrepend` geldt hier ook.
- `host=node`: alleen niet-geblokkeerde env-overschrijvingen die je doorgeeft, worden naar de Node gestuurd. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering en genegeerd door Node-hosts. Als je extra PATH-vermeldingen op een Node nodig hebt,
  configureer dan de omgeving van de Node-hostservice (systemd/launchd) of installeer tools op standaardlocaties.

Node-binding per agent (gebruik de agentlijstindex in config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: het tabblad Nodes bevat een klein paneel “Exec Node-binding” voor dezelfde instellingen.

## Sessieoverschrijvingen (`/exec`)

Gebruik `/exec` om **per-sessie** standaarden in te stellen voor `host`, `security`, `ask` en `node`.
Stuur `/exec` zonder argumenten om de huidige waarden te tonen.

Voorbeeld:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisatiemodel

`/exec` wordt alleen gehonoreerd voor **geautoriseerde afzenders** (channel-allowlists/koppeling plus `commands.useAccessGroups`).
Het werkt alleen **sessiestatus** bij en schrijft geen configuratie. Om exec hard uit te schakelen, weiger je het via toolbeleid
(`tools.deny: ["exec"]` of per agent). Hostgoedkeuringen blijven gelden, tenzij je expliciet
`security=full` en `ask=off` instelt.

## Exec-goedkeuringen (companion app / Node-host)

Gesandboxte agents kunnen goedkeuring per verzoek vereisen voordat `exec` op de Gateway- of Node-host draait.
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het beleid, de allowlist en de UI-flow.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool direct met
`status: "approval-pending"` en een goedkeurings-id. Zodra goedgekeurd (of geweigerd / verlopen),
zendt de Gateway systeemevents uit (`Exec finished` / `Exec denied`). Als de opdracht nog
draait na `tools.exec.approvalRunningNoticeMs`, wordt één `Exec running`-melding verzonden.
Op channels met native goedkeuringskaarten/-knoppen moet de agent eerst vertrouwen op die
native UI en alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat
expliciet zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het
enige pad is.

## Allowlist + veilige bins

Handmatige allowlist-handhaving matcht opgeloste binary-padglobs en kale commandonamen-
globs. Kale namen matchen alleen opdrachten die via PATH worden aangeroepen, dus `rg` kan matchen met
`/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar niet met `./rg` of `/tmp/rg`.
Wanneer `security=allowlist`, worden shellopdrachten alleen automatisch toegestaan als elk pipeline-
segment op de allowlist staat of een veilige bin is. Chaining (`;`, `&&`, `||`) en redirections
worden in allowlist-modus geweigerd, tenzij elk top-level segment voldoet aan de
allowlist (inclusief veilige bins). Redirections blijven niet ondersteund.
Duurzaam `allow-always`-vertrouwen omzeilt die regel niet: een gechainede opdracht vereist nog steeds dat elk
top-level segment matcht.

`autoAllowSkills` is een apart gemakspad in exec-goedkeuringen. Het is niet hetzelfde als
handmatige pad-allowlist-vermeldingen. Voor strikt expliciet vertrouwen houd je `autoAllowSkills` uitgeschakeld.

Gebruik de twee controles voor verschillende taken:

- `tools.exec.safeBins`: kleine, stdin-only streamfilters.
- `tools.exec.safeBinTrustedDirs`: expliciete extra vertrouwde directories voor veilige-bin-uitvoerbare paden.
- `tools.exec.safeBinProfiles`: expliciet argv-beleid voor aangepaste veilige bins.
- allowlist: expliciet vertrouwen voor uitvoerbare paden.

Behandel `safeBins` niet als een generieke toestemmingslijst en voeg geen interpreter-/runtime-binaries toe (bijvoorbeeld `python3`, `node`, `ruby`, `bash`). Als je die nodig hebt, gebruik dan expliciete vermeldingen in de toestemmingslijst en laat goedkeuringsprompts ingeschakeld.
`openclaw security audit` waarschuwt wanneer interpreter-/runtime-vermeldingen in `safeBins` geen expliciete profielen hebben, en `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles`-vermeldingen opzetten.
`openclaw security audit` en `openclaw doctor` waarschuwen ook wanneer je expliciet bins met breed gedrag, zoals `jq`, opnieuw toevoegt aan `safeBins`.
Als je interpreters expliciet toestaat, schakel dan `tools.exec.strictInlineEval` in zodat inline code-eval-vormen nog steeds een nieuwe goedkeuring vereisen.

Zie [Exec-goedkeuringen](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) en [Safe bins versus toestemmingslijst](/nl/tools/exec-approvals-advanced#safe-bins-versus-allowlist) voor volledige beleidsdetails en voorbeelden.

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

Pollen is bedoeld voor status op aanvraag, niet voor wachtlussen. Als automatisch ontwaken bij voltooiing
is ingeschakeld, kan de opdracht de sessie wekken wanneer deze uitvoer produceert of mislukt.

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

Plakken (standaard met haakjes):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` is een subtool van `exec` voor gestructureerde bewerkingen in meerdere bestanden.
Het is standaard ingeschakeld voor OpenAI- en OpenAI Codex-modellen. Gebruik configuratie alleen
wanneer je het wilt uitschakelen of tot specifieke modellen wilt beperken:

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

- Alleen beschikbaar voor OpenAI/OpenAI Codex-modellen.
- Toolbeleid blijft van toepassing; `allow: ["write"]` staat `apply_patch` impliciet toe.
- `deny: ["write"]` weigert `apply_patch` niet; weiger `apply_patch` expliciet of gebruik `deny: ["group:fs"]` wanneer patch-schrijfacties ook geblokkeerd moeten worden.
- Configuratie staat onder `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` is standaard `true`; stel dit in op `false` om de tool voor OpenAI-modellen uit te schakelen.
- `tools.exec.applyPatch.workspaceOnly` is standaard `true` (binnen de workspace). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de workspacemap schrijft/verwijdert.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Sandboxing](/nl/gateway/sandboxing) — opdrachten uitvoeren in gesandboxte omgevingen
- [Achtergrondproces](/nl/gateway/background-process) — langdurig draaiende exec- en process-tool
- [Beveiliging](/nl/gateway/security) — toolbeleid en verhoogde toegang
