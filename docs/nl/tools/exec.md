---
read_when:
    - De exec-tool gebruiken of wijzigen
    - Stdin- of TTY-gedrag debuggen
summary: Gebruik van exec-tool, stdin-modi en TTY-ondersteuning
title: Uitvoeringstool
x-i18n:
    generated_at: "2026-05-06T09:35:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9892f030f1eeb83ca0cebac462c469e5f9f000763e4c96d62d82b819f98c3084
    source_path: tools/exec.md
    workflow: 16
---

Shellopdrachten uitvoeren in de werkruimte. Ondersteunt uitvoering op de voorgrond + achtergrond via `process`.
Als `process` niet is toegestaan, draait `exec` synchroon en negeert het `yieldMs`/`background`.
Achtergrondsessies hebben een bereik per agent; `process` ziet alleen sessies van dezelfde agent.

## Parameters

<ParamField path="command" type="string" required>
Uit te voeren shellopdracht.
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
Zet de opdracht direct op de achtergrond in plaats van te wachten op `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Overschrijf de geconfigureerde exec-time-out voor deze aanroep. Stel `timeout: 0` alleen in wanneer de opdracht zonder time-out van het exec-proces moet draaien.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Draai in een pseudo-terminal wanneer beschikbaar. Gebruik dit voor TTY-only CLI's, coding agents en terminal-UI's.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Waar moet worden uitgevoerd. `auto` wordt omgezet naar `sandbox` wanneer een sandboxruntime actief is en anders naar `gateway`.
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
Vraag verhoogde modus aan — ontsnap uit de sandbox naar het geconfigureerde hostpad. `security=full` wordt alleen afgedwongen wanneer verhoogd wordt omgezet naar `full`.
</ParamField>

Opmerkingen:

- `host` staat standaard op `auto`: sandbox wanneer een sandboxruntime actief is voor de sessie, anders gateway.
- `host` accepteert alleen `auto`, `sandbox`, `gateway` of `node`. Het is geen hostnaamselector; hostnaamachtige waarden worden geweigerd voordat de opdracht draait.
- `auto` is de standaard routeringsstrategie, geen wildcard. Per aanroep is `host=node` toegestaan vanuit `auto`; per aanroep is `host=gateway` alleen toegestaan wanneer er geen sandboxruntime actief is.
- Zonder extra configuratie werkt `host=auto` nog steeds gewoon: geen sandbox betekent dat het wordt omgezet naar `gateway`; een live sandbox betekent dat het in de sandbox blijft.
- `elevated` ontsnapt uit de sandbox naar het geconfigureerde hostpad: standaard `gateway`, of `node` wanneer `tools.exec.host=node` (of de sessiestandaard `host=node` is). Het is alleen beschikbaar wanneer verhoogde toegang is ingeschakeld voor de huidige sessie/provider.
- Goedkeuringen voor `gateway`/`node` worden beheerd door `~/.openclaw/exec-approvals.json`.
- `node` vereist een gekoppelde node (begeleidende app of headless node-host).
- Als er meerdere nodes beschikbaar zijn, stel dan `exec.node` of `tools.exec.node` in om er een te selecteren.
- `exec host=node` is het enige shell-uitvoeringspad voor nodes; de oude `nodes.run`-wrapper is verwijderd.
- `timeout` geldt voor voorgrond-, achtergrond-, `yieldMs`-, gateway-, sandbox- en node-`system.run`-uitvoering. Als dit wordt weggelaten, gebruikt OpenClaw `tools.exec.timeoutSec`; expliciet `timeout: 0` schakelt de time-out van het exec-proces voor die aanroep uit.
- Op niet-Windows-hosts gebruikt exec `SHELL` wanneer ingesteld; als `SHELL` `fish` is, geeft het de voorkeur aan `bash` (of `sh`)
  uit `PATH` om scripts te vermijden die niet compatibel zijn met fish, en valt daarna terug op `SHELL` als geen van beide bestaat.
- Op Windows-hosts geeft exec de voorkeur aan detectie van PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, daarna PATH),
  en valt daarna terug op Windows PowerShell 5.1.
- Hostuitvoering (`gateway`/`node`) weigert `env.PATH` en loader-overschrijvingen (`LD_*`/`DYLD_*`) om
  binary hijacking of geïnjecteerde code te voorkomen.
- OpenClaw stelt `OPENCLAW_SHELL=exec` in de omgeving van de gestarte opdracht in (inclusief PTY- en sandboxuitvoering), zodat shell-/profielregels exec-toolcontext kunnen detecteren.
- `openclaw channels login` wordt geblokkeerd vanuit `exec` omdat het een interactieve channel-auth-flow is; draai het in een terminal op de gateway-host, of gebruik de channel-native logintool vanuit chat wanneer die bestaat.
- Belangrijk: sandboxing is **standaard uitgeschakeld**. Als sandboxing uit staat, wordt impliciet `host=auto`
  omgezet naar `gateway`. Expliciet `host=sandbox` faalt nog steeds gesloten in plaats van stilzwijgend
  op de gateway-host te draaien. Schakel sandboxing in of gebruik `host=gateway` met goedkeuringen.
- Script-preflightcontroles (voor veelvoorkomende Python/Node-shellsyntaxfouten) inspecteren alleen bestanden binnen de
  effectieve `workdir`-grens. Als een scriptpad buiten `workdir` wordt omgezet, wordt preflight voor
  dat bestand overgeslagen.
- Voor langlopend werk dat nu start, start het één keer en vertrouw op automatische
  completion wake wanneer die is ingeschakeld en de opdracht uitvoer geeft of faalt.
  Gebruik `process` voor logs, status, invoer of interventie; simuleer geen
  planning met slaaplussen, time-outlussen of herhaald pollen.
- Voor werk dat later of volgens een schema moet plaatsvinden, gebruik cron in plaats van
  `exec`-slaap-/vertragingspatronen.

## Configuratie

- `tools.exec.notifyOnExit` (standaard: true): wanneer true, plaatsen naar de achtergrond verplaatste exec-sessies een systeemevent in de wachtrij en vragen ze bij afsluiten om een Heartbeat.
- `tools.exec.approvalRunningNoticeMs` (standaard: 10000): geef één enkele melding "draait" wanneer een exec met verplichte goedkeuring langer draait dan dit (0 schakelt dit uit).
- `tools.exec.timeoutSec` (standaard: 1800): standaard exec-time-out per opdracht in seconden. Per-aanroep `timeout` overschrijft dit; per-aanroep `timeout: 0` schakelt de time-out van het exec-proces uit.
- `tools.exec.host` (standaard: `auto`; wordt omgezet naar `sandbox` wanneer een sandboxruntime actief is, anders naar `gateway`)
- `tools.exec.security` (standaard: `deny` voor sandbox, `full` voor gateway + node wanneer niet ingesteld)
- `tools.exec.ask` (standaard: `off`)
- Host-exec zonder goedkeuring is de standaard voor gateway + node. Als je goedkeuringen/allowlist-gedrag wilt, maak dan zowel `tools.exec.*` als het hostbestand `~/.openclaw/exec-approvals.json` strikter; zie [Exec-goedkeuringen](/nl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO komt uit de hostbeleidsstandaarden (`security=full`, `ask=off`), niet uit `host=auto`. Als je routering naar gateway of node wilt afdwingen, stel dan `tools.exec.host` in of gebruik `/exec host=...`.
- In de modus `security=full` plus `ask=off` volgt host-exec direct het geconfigureerde beleid; er is geen extra heuristische voorfilter voor opdrachtverhulling of script-preflightweigeringslaag.
- `tools.exec.node` (standaard: niet ingesteld)
- `tools.exec.strictInlineEval` (standaard: false): wanneer true, vereisen inline interpreter-eval-vormen zoals `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` en `osascript -e` altijd expliciete goedkeuring. `allow-always` kan nog steeds goedaardige interpreter-/scriptaanroepen bewaren, maar inline-eval-vormen vragen nog steeds elke keer om bevestiging.
- `tools.exec.pathPrepend`: lijst met directories die vóór `PATH` worden geplaatst voor exec-runs (alleen gateway + sandbox).
- `tools.exec.safeBins`: stdin-only veilige binaries die zonder expliciete allowlist-vermeldingen kunnen draaien. Zie [Veilige bins](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) voor gedragsdetails.
- `tools.exec.safeBinTrustedDirs`: aanvullende expliciete directories die worden vertrouwd voor `safeBins`-padcontroles. `PATH`-items worden nooit automatisch vertrouwd. Ingebouwde standaarden zijn `/bin` en `/usr/bin`.
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
  OpenClaw plaatst `env.PATH` vooraan na het sourcen van het profiel via een interne env-var (geen shellinterpolatie);
  `tools.exec.pathPrepend` geldt hier ook.
- `host=node`: alleen niet-geblokkeerde env-overschrijvingen die je doorgeeft, worden naar de node gestuurd. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering en genegeerd door node-hosts. Als je extra PATH-items op een node nodig hebt,
  configureer dan de serviceomgeving van de node-host (systemd/launchd) of installeer tools op standaardlocaties.

Node-binding per agent (gebruik de agentlijstindex in config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control-UI: het tabblad Nodes bevat een klein paneel "Exec-nodebinding" voor dezelfde instellingen.

## Sessie-overschrijvingen (`/exec`)

Gebruik `/exec` om **per-sessie** standaarden voor `host`, `security`, `ask` en `node` in te stellen.
Stuur `/exec` zonder argumenten om de huidige waarden te tonen.

Voorbeeld:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisatiemodel

`/exec` wordt alleen gerespecteerd voor **geautoriseerde afzenders** (channel-allowlists/koppeling plus `commands.useAccessGroups`).
Het werkt alleen **sessiestatus** bij en schrijft geen config. Om exec hard uit te schakelen, weiger het via toolbeleid
(`tools.deny: ["exec"]` of per agent). Hostgoedkeuringen blijven van toepassing tenzij je expliciet
`security=full` en `ask=off` instelt.

## Exec-goedkeuringen (begeleidende app / node-host)

Gesandboxte agents kunnen goedkeuring per verzoek vereisen voordat `exec` op de gateway- of node-host draait.
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het beleid, de allowlist en de UI-flow.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool direct met
`status: "approval-pending"` en een goedkeurings-id. Na goedkeuring (of weigering / time-out)
zendt de Gateway systeemevents uit (`Exec finished` / `Exec denied`). Als de opdracht nog
draait na `tools.exec.approvalRunningNoticeMs`, wordt één enkele melding `Exec running` uitgezonden.
Op channels met native goedkeuringskaarten/knoppen moet de agent eerst op die
native UI vertrouwen en alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat
expliciet zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het
enige pad is.

## Allowlist + veilige bins

Handmatige allowlist-handhaving matcht opgeloste binary-padglobs en kale opdrachtnaam-
globs. Kale namen matchen alleen opdrachten die via PATH worden aangeroepen, dus `rg` kan matchen met
`/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar niet met `./rg` of `/tmp/rg`.
Wanneer `security=allowlist`, worden shellopdrachten alleen automatisch toegestaan als elk pipeline-
segment op de allowlist staat of een veilige bin is. Chaining (`;`, `&&`, `||`) en omleidingen
worden in allowlist-modus geweigerd tenzij elk segment op topniveau aan de
allowlist voldoet (inclusief veilige bins). Omleidingen blijven niet ondersteund.
Duurzaam `allow-always`-vertrouwen omzeilt die regel niet: een geketende opdracht vereist nog steeds dat elk
segment op topniveau matcht.

`autoAllowSkills` is een apart gemakspad in exec-goedkeuringen. Het is niet hetzelfde als
handmatige pad-allowlist-vermeldingen. Houd `autoAllowSkills` uitgeschakeld voor strikt expliciet vertrouwen.

Gebruik de twee controles voor verschillende taken:

- `tools.exec.safeBins`: kleine, stdin-only streamfilters.
- `tools.exec.safeBinTrustedDirs`: expliciete extra vertrouwde directories voor uitvoerbare paden van veilige bins.
- `tools.exec.safeBinProfiles`: expliciet argv-beleid voor aangepaste veilige bins.
- allowlist: expliciet vertrouwen voor uitvoerbare paden.

Behandel `safeBins` niet als een generieke lijst met toegestane items en voeg geen interpreter-/runtime-binaries toe (bijvoorbeeld `python3`, `node`, `ruby`, `bash`). Als je die nodig hebt, gebruik dan expliciete vermeldingen in de toegestane lijst en laat goedkeuringsprompts ingeschakeld.
`openclaw security audit` waarschuwt wanneer interpreter-/runtime-vermeldingen in `safeBins` expliciete profielen missen, en `openclaw doctor --fix` kan ontbrekende aangepaste vermeldingen voor `safeBinProfiles` aanmaken.
`openclaw security audit` en `openclaw doctor` waarschuwen ook wanneer je expliciet bins met breed gedrag, zoals `jq`, weer toevoegt aan `safeBins`.
Als je interpreters expliciet toestaat, schakel dan `tools.exec.strictInlineEval` in, zodat vormen voor inline code-evaluatie nog steeds een nieuwe goedkeuring vereisen.

Zie [Exec-goedkeuringen](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) en [Veilige bins versus toegestane lijst](/nl/tools/exec-approvals-advanced#safe-bins-versus-allowlist) voor alle beleidsdetails en voorbeelden.

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

Plakken (standaard tussen brackets):

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
- Toolbeleid blijft van toepassing; `allow: ["write"]` staat `apply_patch` impliciet toe.
- `deny: ["write"]` weigert `apply_patch` niet; weiger `apply_patch` expliciet of gebruik `deny: ["group:fs"]` wanneer patch-schrijfacties ook moeten worden geblokkeerd.
- Configuratie staat onder `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` is standaard `true`; stel dit in op `false` om de tool voor OpenAI-modellen uit te schakelen.
- `tools.exec.applyPatch.workspaceOnly` is standaard `true` (beperkt tot de werkruimte). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de werkruimtemap schrijft/verwijdert.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Sandboxing](/nl/gateway/sandboxing) — opdrachten uitvoeren in gesandboxte omgevingen
- [Achtergrondproces](/nl/gateway/background-process) — langlopende exec- en proces-tool
- [Beveiliging](/nl/gateway/security) — toolbeleid en verhoogde toegang
