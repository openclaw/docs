---
read_when:
    - De exec-tool gebruiken of wijzigen
    - stdin- of TTY-gedrag debuggen
summary: Gebruik van de exec-tool, stdin-modi en TTY-ondersteuning
title: Uitvoeringstool
x-i18n:
    generated_at: "2026-05-02T22:23:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

Voer shellopdrachten uit in de werkruimte. Ondersteunt uitvoering op de voorgrond + achtergrond via `process`.
Als `process` niet is toegestaan, voert `exec` synchroon uit en negeert het `yieldMs`/`background`.
Achtergrondsessies zijn per agent gescoped; `process` ziet alleen sessies van dezelfde agent.

## Parameters

<ParamField path="command" type="string" required>
Uit te voeren shellopdracht.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Werkmap voor de opdracht.
</ParamField>

<ParamField path="env" type="object">
Key/value-omgevingsoverschrijvingen die boven op de geërfde omgeving worden samengevoegd.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Zet de opdracht na deze vertraging (ms) automatisch op de achtergrond.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Zet de opdracht onmiddellijk op de achtergrond in plaats van te wachten op `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Overschrijf de geconfigureerde exec-time-out voor deze aanroep. Stel `timeout: 0` alleen in wanneer de opdracht zonder time-out van het exec-proces moet worden uitgevoerd.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Voer uit in een pseudo-terminal wanneer beschikbaar. Gebruik voor TTY-only CLI's, coderingsagenten en terminal-UI's.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Waar moet worden uitgevoerd. `auto` wordt omgezet naar `sandbox` wanneer een sandboxruntime actief is en anders naar `gateway`.
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
Vraag verhoogde modus aan — ontsnap uit de sandbox naar het geconfigureerde hostpad. `security=full` wordt alleen afgedwongen wanneer verhoogde modus naar `full` wordt omgezet.
</ParamField>

Opmerkingen:

- `host` staat standaard op `auto`: sandbox wanneer een sandboxruntime actief is voor de sessie, anders gateway.
- `host` accepteert alleen `auto`, `sandbox`, `gateway` of `node`. Het is geen hostnaamselector; hostnaamachtige waarden worden geweigerd voordat de opdracht wordt uitgevoerd.
- `auto` is de standaardrouteringsstrategie, geen wildcard. Per aanroep is `host=node` toegestaan vanuit `auto`; per aanroep is `host=gateway` alleen toegestaan wanneer er geen sandboxruntime actief is.
- Zonder extra configuratie werkt `host=auto` nog steeds vanzelf: geen sandbox betekent dat het naar `gateway` wordt omgezet; een live sandbox betekent dat het in de sandbox blijft.
- `elevated` ontsnapt uit de sandbox naar het geconfigureerde hostpad: standaard `gateway`, of `node` wanneer `tools.exec.host=node` (of de sessiestandaard `host=node` is). Dit is alleen beschikbaar wanneer verhoogde toegang is ingeschakeld voor de huidige sessie/provider.
- `gateway`/`node`-goedkeuringen worden beheerd door `~/.openclaw/exec-approvals.json`.
- `node` vereist een gekoppelde Node (companion-app of headless Node-host).
- Als er meerdere Nodes beschikbaar zijn, stel dan `exec.node` of `tools.exec.node` in om er een te selecteren.
- `exec host=node` is het enige shell-uitvoeringspad voor Nodes; de verouderde `nodes.run`-wrapper is verwijderd.
- `timeout` geldt voor uitvoering op de voorgrond, achtergrond, `yieldMs`, gateway, sandbox en Node `system.run`. Als dit wordt weggelaten, gebruikt OpenClaw `tools.exec.timeoutSec`; expliciete `timeout: 0` schakelt de time-out van het exec-proces voor die aanroep uit.
- Op niet-Windows-hosts gebruikt exec `SHELL` wanneer ingesteld; als `SHELL` `fish` is, geeft het de voorkeur aan `bash` (of `sh`)
  uit `PATH` om scripts te vermijden die incompatibel zijn met fish, en valt daarna terug op `SHELL` als geen van beide bestaat.
- Op Windows-hosts geeft exec de voorkeur aan detectie van PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, daarna PATH),
  en valt daarna terug op Windows PowerShell 5.1.
- Hostuitvoering (`gateway`/`node`) weigert `env.PATH` en loader-overschrijvingen (`LD_*`/`DYLD_*`) om
  binaire kaping of geïnjecteerde code te voorkomen.
- OpenClaw stelt `OPENCLAW_SHELL=exec` in de omgeving van de gespawnde opdracht in (inclusief PTY- en sandboxuitvoering), zodat shell-/profielregels de context van de exec-tool kunnen detecteren.
- `openclaw channels login` wordt geblokkeerd vanuit `exec` omdat het een interactieve channel-auth-flow is; voer het uit in een terminal op de Gateway-host, of gebruik de kanaaleigen login-tool vanuit chat wanneer die bestaat.
- Belangrijk: sandboxing staat **standaard uit**. Als sandboxing uit staat, wordt impliciete `host=auto`
  omgezet naar `gateway`. Expliciete `host=sandbox` faalt nog steeds gesloten in plaats van stilzwijgend
  op de Gateway-host te draaien. Schakel sandboxing in of gebruik `host=gateway` met goedkeuringen.
- Script-preflightcontroles (voor veelvoorkomende Python/Node-shellsyntaxisfouten) inspecteren alleen bestanden binnen de
  effectieve `workdir`-grens. Als een scriptpad buiten `workdir` wordt omgezet, wordt preflight voor
  dat bestand overgeslagen.
- Voor langlopende werkzaamheden die nu starten, start ze eenmaal en vertrouw op automatische
  voltooiingswake wanneer die is ingeschakeld en de opdracht uitvoer produceert of faalt.
  Gebruik `process` voor logs, status, invoer of interventie; emuleer geen
  planning met slaaplussen, time-outlussen of herhaald pollen.
- Voor werk dat later of volgens een schema moet plaatsvinden, gebruik Cron in plaats van
  `exec`-slaap-/vertragingspatronen.

## Configuratie

- `tools.exec.notifyOnExit` (standaard: true): wanneer true, plaatsen exec-sessies die op de achtergrond zijn gezet een systeemgebeurtenis in de wachtrij en vragen ze bij afsluiten een Heartbeat aan.
- `tools.exec.approvalRunningNoticeMs` (standaard: 10000): geef één enkele melding “actief” weer wanneer een door goedkeuring gated exec langer draait dan dit (0 schakelt uit).
- `tools.exec.timeoutSec` (standaard: 1800): standaard exec-time-out per opdracht in seconden. Per-aanroep `timeout` overschrijft dit; per-aanroep `timeout: 0` schakelt de time-out van het exec-proces uit.
- `tools.exec.host` (standaard: `auto`; wordt omgezet naar `sandbox` wanneer sandboxruntime actief is, anders `gateway`)
- `tools.exec.security` (standaard: `deny` voor sandbox, `full` voor gateway + node wanneer niet ingesteld)
- `tools.exec.ask` (standaard: `off`)
- Host-exec zonder goedkeuring is de standaard voor gateway + node. Als je goedkeuringen/allowlist-gedrag wilt, verscherp dan zowel `tools.exec.*` als de host `~/.openclaw/exec-approvals.json`; zie [Exec-goedkeuringen](/nl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO komt voort uit de standaardwaarden van het hostbeleid (`security=full`, `ask=off`), niet uit `host=auto`. Als je gateway- of node-routering wilt afdwingen, stel dan `tools.exec.host` in of gebruik `/exec host=...`.
- In de modus `security=full` plus `ask=off` volgt host-exec direct het geconfigureerde beleid; er is geen extra heuristische prefilter voor opdrachtverhulling of script-preflight-weigeringslaag.
- `tools.exec.node` (standaard: niet ingesteld)
- `tools.exec.strictInlineEval` (standaard: false): wanneer true, vereisen inline interpreter-eval-vormen zoals `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` en `osascript -e` altijd expliciete goedkeuring. `allow-always` kan nog steeds goedaardige interpreter-/scriptaanroepen blijvend toestaan, maar inline-eval-vormen vragen nog steeds elke keer om goedkeuring.
- `tools.exec.pathPrepend`: lijst met mappen die vóór `PATH` worden geplaatst voor exec-runs (alleen gateway + sandbox).
- `tools.exec.safeBins`: stdin-only veilige binaire bestanden die zonder expliciete allowlist-vermeldingen kunnen draaien. Zie [Veilige bins](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) voor gedragsdetails.
- `tools.exec.safeBinTrustedDirs`: aanvullende expliciete mappen die worden vertrouwd voor `safeBins`-padcontroles. `PATH`-vermeldingen worden nooit automatisch vertrouwd. Ingebouwde standaardwaarden zijn `/bin` en `/usr/bin`.
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

- `host=gateway`: voegt de `PATH` van je login-shell samen in de exec-omgeving. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering. De daemon zelf draait nog steeds met een minimale `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: voert `sh -lc` (login-shell) uit binnen de container, dus `/etc/profile` kan `PATH` resetten.
  OpenClaw plaatst `env.PATH` vóór de rest na het sourcen van het profiel via een interne omgevingsvariabele (geen shellinterpolatie);
  `tools.exec.pathPrepend` geldt hier ook.
- `host=node`: alleen niet-geblokkeerde omgevingsoverschrijvingen die je doorgeeft, worden naar de Node gestuurd. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering en genegeerd door Node-hosts. Als je aanvullende PATH-vermeldingen op een Node nodig hebt,
  configureer dan de serviceomgeving van de Node-host (systemd/launchd) of installeer tools op standaardlocaties.

Node-binding per agent (gebruik de agentlijstindex in configuratie):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control-UI: het tabblad Nodes bevat een klein paneel “Exec-nodebinding” voor dezelfde instellingen.

## Sessie-overschrijvingen (`/exec`)

Gebruik `/exec` om **per-sessie** standaardwaarden in te stellen voor `host`, `security`, `ask` en `node`.
Stuur `/exec` zonder argumenten om de huidige waarden te tonen.

Voorbeeld:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisatiemodel

`/exec` wordt alleen gehonoreerd voor **geautoriseerde afzenders** (kanaal-allowlists/koppeling plus `commands.useAccessGroups`).
Het werkt alleen **sessiestatus** bij en schrijft geen configuratie. Om exec hard uit te schakelen, weiger het via toolbeleid
(`tools.deny: ["exec"]` of per agent). Hostgoedkeuringen blijven gelden tenzij je expliciet
`security=full` en `ask=off` instelt.

## Exec-goedkeuringen (companion-app / Node-host)

Agents in een sandbox kunnen per-request goedkeuring vereisen voordat `exec` op de Gateway- of Node-host draait.
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het beleid, de allowlist en de UI-flow.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool onmiddellijk met
`status: "approval-pending"` en een goedkeurings-id. Na goedkeuring (of weigering / time-out)
zendt de Gateway systeemgebeurtenissen uit (`Exec finished` / `Exec denied`). Als de opdracht nog steeds
actief is na `tools.exec.approvalRunningNoticeMs`, wordt één enkele melding `Exec running` uitgezonden.
Op kanalen met native goedkeuringskaarten/-knoppen moet de agent eerst vertrouwen op die
native UI en alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat
expliciet zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het
enige pad is.

## Allowlist + veilige bins

Handmatige allowlist-handhaving matcht opgeloste globpatronen voor binaire paden en kale globpatronen voor opdrachtnamen.
Kale namen matchen alleen opdrachten die via PATH worden aangeroepen, dus `rg` kan matchen met
`/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar niet met `./rg` of `/tmp/rg`.
Wanneer `security=allowlist` is, worden shellopdrachten alleen automatisch toegestaan als elk pipeline-
segment op de allowlist staat of een veilige bin is. Chaining (`;`, `&&`, `||`) en omleidingen
worden in allowlist-modus geweigerd tenzij elk top-level segment voldoet aan de
allowlist (inclusief veilige bins). Omleidingen blijven niet ondersteund.
Duurzaam `allow-always`-vertrouwen omzeilt die regel niet: een chained opdracht vereist nog steeds dat elk
top-level segment matcht.

`autoAllowSkills` is een afzonderlijk gemakspad in exec-goedkeuringen. Het is niet hetzelfde als
handmatige pad-allowlist-vermeldingen. Houd `autoAllowSkills` uitgeschakeld voor strikt expliciet vertrouwen.

Gebruik de twee besturingen voor verschillende taken:

- `tools.exec.safeBins`: kleine, stdin-only streamfilters.
- `tools.exec.safeBinTrustedDirs`: expliciete extra vertrouwde mappen voor uitvoerbare paden van veilige bins.
- `tools.exec.safeBinProfiles`: expliciet argv-beleid voor aangepaste veilige bins.
- allowlist: expliciet vertrouwen voor uitvoerbare paden.

Behandel `safeBins` niet als een generieke toestaanlijst en voeg geen interpreter-/runtime-binaries toe (bijvoorbeeld `python3`, `node`, `ruby`, `bash`). Als je die nodig hebt, gebruik dan expliciete vermeldingen in de toestaanlijst en laat goedkeuringsprompts ingeschakeld.
`openclaw security audit` waarschuwt wanneer interpreter-/runtime-vermeldingen in `safeBins` expliciete profielen missen, en `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles`-vermeldingen scaffolden.
`openclaw security audit` en `openclaw doctor` waarschuwen ook wanneer je expliciet bins met breed gedrag, zoals `jq`, weer toevoegt aan `safeBins`.
Als je interpreters expliciet toestaat, schakel dan `tools.exec.strictInlineEval` in, zodat inline vormen voor code-evaluatie nog steeds een nieuwe goedkeuring vereisen.

Zie voor volledige beleidsdetails en voorbeelden [Exec-goedkeuringen](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) en [Veilige bins versus toestaanlijst](/nl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Voorbeelden

Voorgrond:

```json
{ "tool": "exec", "command": "ls -la" }
```

Achtergrond + peilen:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Peilen is bedoeld voor status op aanvraag, niet voor wachtlussen. Als automatisch wekken bij voltooiing
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

Plakken (standaard bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` is een subtool van `exec` voor gestructureerde bewerkingen in meerdere bestanden.
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
- Configuratie staat onder `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` is standaard `true`; zet dit op `false` om de tool voor OpenAI-modellen uit te schakelen.
- `tools.exec.applyPatch.workspaceOnly` is standaard `true` (beperkt tot de workspace). Zet dit alleen op `false` als je bewust wilt dat `apply_patch` buiten de workspace-map schrijft/verwijdert.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Sandboxing](/nl/gateway/sandboxing) — opdrachten uitvoeren in sandbox-omgevingen
- [Achtergrondproces](/nl/gateway/background-process) — langdurig draaiende exec- en process-tool
- [Beveiliging](/nl/gateway/security) — toolbeleid en verhoogde toegang
