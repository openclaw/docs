---
read_when:
    - De exec-tool gebruiken of wijzigen
    - stdin- of TTY-gedrag debuggen
summary: Gebruik van de Exec-tool, stdin-modi en TTY-ondersteuning
title: Uitvoeringstool
x-i18n:
    generated_at: "2026-05-11T20:52:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

Voer shell-opdrachten uit in de workspace. `exec` is een muterend shell-oppervlak: opdrachten kunnen bestanden maken, bewerken of verwijderen waar het geselecteerde host- of sandbox-bestandssysteem dat toestaat. Het uitschakelen van OpenClaw-bestandssysteemtools zoals `write`, `edit` of `apply_patch` maakt `exec` niet alleen-lezen.

Ondersteunt voorgrond- en achtergronduitvoering via `process`. Als `process` niet is toegestaan, wordt `exec` synchroon uitgevoerd en negeert het `yieldMs`/`background`.
Achtergrondsessies zijn per agent gescoped; `process` ziet alleen sessies van dezelfde agent.

## Parameters

<ParamField path="command" type="string" required>
Uit te voeren shell-opdracht.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Werkmap voor de opdracht.
</ParamField>

<ParamField path="env" type="object">
Sleutel/waarde-omgevingsoverschrijvingen die bovenop de geërfde omgeving worden samengevoegd.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Zet de opdracht automatisch op de achtergrond na deze vertraging (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Zet de opdracht onmiddellijk op de achtergrond in plaats van te wachten op `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Overschrijf de geconfigureerde exec-time-out voor deze aanroep. Stel `timeout: 0` alleen in wanneer de opdracht zonder time-out van het exec-proces moet worden uitgevoerd.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Voer uit in een pseudo-terminal wanneer beschikbaar. Gebruik dit voor TTY-only CLI's, coding agents en terminal-UI's.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Waar uit te voeren. `auto` wordt opgelost naar `sandbox` wanneer een sandbox-runtime actief is en anders naar `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Genegeerd voor normale tool-aanroepen. `gateway`- / `node`-beveiliging wordt beheerd door
`tools.exec.security` en `~/.openclaw/exec-approvals.json`; verhoogde modus kan
`security=full` alleen afdwingen wanneer de operator expliciet verhoogde toegang verleent.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Gedrag van goedkeuringsprompts voor `gateway`- / `node`-uitvoering.
</ParamField>

<ParamField path="node" type="string">
Node-id/naam wanneer `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Vraag verhoogde modus aan — ontsnap uit de sandbox naar het geconfigureerde hostpad. `security=full` wordt alleen afgedwongen wanneer verhoogd wordt opgelost naar `full`.
</ParamField>

Opmerkingen:

- `host` staat standaard op `auto`: sandbox wanneer sandbox-runtime actief is voor de sessie, anders Gateway.
- `host` accepteert alleen `auto`, `sandbox`, `gateway` of `node`. Het is geen hostnaamselector; hostnaamachtige waarden worden geweigerd voordat de opdracht wordt uitgevoerd.
- `auto` is de standaardrouteringsstrategie, geen wildcard. Per aanroep is `host=node` toegestaan vanuit `auto`; per aanroep is `host=gateway` alleen toegestaan wanneer er geen sandbox-runtime actief is.
- Zonder extra configuratie werkt `host=auto` nog steeds gewoon: geen sandbox betekent dat het wordt opgelost naar `gateway`; een live sandbox betekent dat het in de sandbox blijft.
- `elevated` ontsnapt uit de sandbox naar het geconfigureerde hostpad: standaard `gateway`, of `node` wanneer `tools.exec.host=node` (of de sessiestandaard `host=node` is). Het is alleen beschikbaar wanneer verhoogde toegang is ingeschakeld voor de huidige sessie/provider.
- `gateway`/`node`-goedkeuringen worden beheerd door `~/.openclaw/exec-approvals.json`.
- `node` vereist een gekoppelde Node (companion-app of headless Node-host).
- Als er meerdere Nodes beschikbaar zijn, stel dan `exec.node` of `tools.exec.node` in om er een te selecteren.
- `exec host=node` is het enige shell-uitvoeringspad voor Nodes; de legacy `nodes.run`-wrapper is verwijderd.
- `timeout` is van toepassing op voorgrond-, achtergrond-, `yieldMs`-, Gateway-, sandbox- en Node-`system.run`-uitvoering. Als het wordt weggelaten, gebruikt OpenClaw `tools.exec.timeoutSec`; expliciet `timeout: 0` schakelt de time-out van het exec-proces uit voor die aanroep.
- Op niet-Windows-hosts gebruikt exec `SHELL` wanneer ingesteld; als `SHELL` `fish` is, geeft het de voorkeur aan `bash` (of `sh`)
  uit `PATH` om scripts die niet compatibel zijn met fish te vermijden, en valt daarna terug op `SHELL` als geen van beide bestaat.
- Op Windows-hosts geeft exec de voorkeur aan detectie van PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, daarna PATH),
  en valt daarna terug op Windows PowerShell 5.1.
- Hostuitvoering (`gateway`/`node`) weigert `env.PATH` en loader-overschrijvingen (`LD_*`/`DYLD_*`) om
  binary hijacking of geïnjecteerde code te voorkomen.
- OpenClaw stelt `OPENCLAW_SHELL=exec` in de omgeving van de gestarte opdracht in (inclusief PTY- en sandbox-uitvoering), zodat shell-/profielregels exec-toolcontext kunnen detecteren.
- `openclaw channels login` wordt vanuit `exec` geblokkeerd omdat het een interactieve kanaal-authenticatiestroom is; voer het uit in een terminal op de Gateway-host, of gebruik de kanaaleigen login-tool vanuit chat wanneer die bestaat.
- Belangrijk: sandboxing staat **standaard uit**. Als sandboxing uit staat, wordt impliciet `host=auto`
  opgelost naar `gateway`. Expliciet `host=sandbox` faalt nog steeds gesloten in plaats van stilzwijgend
  op de Gateway-host te draaien. Schakel sandboxing in of gebruik `host=gateway` met goedkeuringen.
- Script-preflightcontroles (voor veelvoorkomende Python/Node-shellsyntaxisfouten) inspecteren alleen bestanden binnen de
  effectieve `workdir`-grens. Als een scriptpad buiten `workdir` wordt opgelost, wordt preflight voor
  dat bestand overgeslagen.
- Voor langlopende werkzaamheden die nu starten, start u deze eenmaal en vertrouwt u op automatische
  completion wake wanneer dit is ingeschakeld en de opdracht uitvoer produceert of faalt.
  Gebruik `process` voor logs, status, invoer of interventie; emuleer geen
  planning met sleep-lussen, time-outlussen of herhaald pollen.
- Gebruik cron in plaats van `exec`-sleep-/vertragingspatronen voor werk dat later of volgens een schema moet plaatsvinden.

## Configuratie

- `tools.exec.notifyOnExit` (standaard: true): wanneer true, plaatsen exec-sessies op de achtergrond een systeemgebeurtenis in de wachtrij en vragen ze een Heartbeat aan bij afsluiten.
- `tools.exec.approvalRunningNoticeMs` (standaard: 10000): geef één "running"-melding af wanneer een exec met goedkeuringspoort langer draait dan dit (0 schakelt uit).
- `tools.exec.timeoutSec` (standaard: 1800): standaard exec-time-out per opdracht in seconden. Per-aanroep `timeout` overschrijft dit; per-aanroep `timeout: 0` schakelt de time-out van het exec-proces uit.
- `tools.exec.host` (standaard: `auto`; wordt opgelost naar `sandbox` wanneer sandbox-runtime actief is, anders `gateway`)
- `tools.exec.security` (standaard: `deny` voor sandbox, `full` voor Gateway + Node wanneer niet ingesteld)
- `tools.exec.ask` (standaard: `off`)
- Host-exec zonder goedkeuring is de standaard voor Gateway + Node. Als u goedkeuringen/allowlist-gedrag wilt, verscherp dan zowel `tools.exec.*` als de host-`~/.openclaw/exec-approvals.json`; zie [Exec-goedkeuringen](/nl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO komt voort uit de standaardwaarden van het hostbeleid (`security=full`, `ask=off`), niet uit `host=auto`. Als u Gateway- of Node-routering wilt afdwingen, stel dan `tools.exec.host` in of gebruik `/exec host=...`.
- In de modus `security=full` plus `ask=off` volgt host-exec direct het geconfigureerde beleid; er is geen extra heuristische prefilter voor opdrachtverhulling of script-preflight-weigeringslaag.
- `tools.exec.node` (standaard: niet ingesteld)
- `tools.exec.strictInlineEval` (standaard: false): wanneer true, vereisen inline interpreter-eval-vormen zoals `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` en `osascript -e` altijd expliciete goedkeuring. `allow-always` kan nog steeds onschuldige interpreter-/scriptaanroepen blijvend toestaan, maar inline-eval-vormen vragen nog steeds elke keer om bevestiging.
- `tools.exec.commandHighlighting` (standaard: false): wanneer true, kunnen goedkeuringsprompts door de parser afgeleide opdrachtspans in de opdrachttekst markeren. Stel wereldwijd of per agent in op `true` om markering van opdrachttekst in te schakelen zonder het exec-goedkeuringsbeleid te wijzigen.
- `tools.exec.pathPrepend`: lijst met mappen om voor exec-runs aan `PATH` vooraf toe te voegen (alleen Gateway + sandbox).
- `tools.exec.safeBins`: veilige binaries met alleen stdin die zonder expliciete allowlist-vermeldingen kunnen worden uitgevoerd. Zie [Veilige bins](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) voor gedragsdetails.
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

- `host=gateway`: voegt de `PATH` van uw login-shell samen in de exec-omgeving. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering. De daemon zelf draait nog steeds met een minimale `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: voert `sh -lc` (login-shell) uit binnen de container, dus `/etc/profile` kan `PATH` resetten.
  OpenClaw voegt `env.PATH` vooraf toe na het sourcen van het profiel via een interne omgevingsvariabele (geen shell-interpolatie);
  `tools.exec.pathPrepend` is hier ook van toepassing.
- `host=node`: alleen niet-geblokkeerde omgevingsoverschrijvingen die u doorgeeft, worden naar de Node verzonden. `env.PATH`-overschrijvingen worden
  geweigerd voor hostuitvoering en genegeerd door Node-hosts. Als u extra PATH-items op een Node nodig hebt,
  configureer dan de omgeving van de Node-hostservice (systemd/launchd) of installeer tools op standaardlocaties.

Node-binding per agent (gebruik de agentlijstindex in de configuratie):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Besturings-UI: het tabblad Nodes bevat een klein paneel "Exec node binding" voor dezelfde instellingen.

## Sessieoverschrijvingen (`/exec`)

Gebruik `/exec` om **per sessie** standaardwaarden in te stellen voor `host`, `security`, `ask` en `node`.
Verzend `/exec` zonder argumenten om de huidige waarden te tonen.

Voorbeeld:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisatiemodel

`/exec` wordt alleen gehonoreerd voor **geautoriseerde afzenders** (kanaal-allowlists/koppeling plus `commands.useAccessGroups`).
Het werkt alleen **sessiestatus** bij en schrijft geen configuratie. Om exec hard uit te schakelen, weigert u het via toolbeleid
(`tools.deny: ["exec"]` of per agent). Hostgoedkeuringen blijven van toepassing, tenzij u expliciet
`security=full` en `ask=off` instelt.

## Exec-goedkeuringen (companion-app / Node-host)

Gesandboxte agents kunnen per-request-goedkeuring vereisen voordat `exec` op de Gateway- of Node-host draait.
Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het beleid, de allowlist en de UI-stroom.

Wanneer goedkeuringen vereist zijn, retourneert de exec-tool onmiddellijk met
`status: "approval-pending"` en een goedkeurings-id. Na goedkeuring (of weigering / time-out)
zendt de Gateway systeemgebeurtenissen uit (`Exec finished` / `Exec denied`). Als de opdracht nog
actief is na `tools.exec.approvalRunningNoticeMs`, wordt één `Exec running`-melding uitgegeven.
Op kanalen met native goedkeuringskaarten/-knoppen moet de agent eerst op die
native UI vertrouwen en alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat
expliciet zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het
enige pad is.

## Allowlist + veilige bins

Handmatige allowlist-afdwinging matcht opgeloste binarypad-globs en kale opdrachtnaam-
globs. Kale namen matchen alleen opdrachten die via PATH worden aangeroepen, dus `rg` kan matchen met
`/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar niet met `./rg` of `/tmp/rg`.
Wanneer `security=allowlist` is, worden shell-opdrachten alleen automatisch toegestaan als elk pipeline-
segment op de allowlist staat of een veilige bin is. Chaining (`;`, `&&`, `||`) en omleidingen
worden in allowlist-modus geweigerd, tenzij elk top-level segment voldoet aan de
allowlist (inclusief veilige bins). Omleidingen blijven niet ondersteund.
Duurzaam `allow-always`-vertrouwen omzeilt die regel niet: een chained opdracht vereist nog steeds dat elk
top-level segment matcht.

`autoAllowSkills` is een apart gemakspad in exec-goedkeuringen. Het is niet hetzelfde als
handmatige pad-allowlist-vermeldingen. Houd `autoAllowSkills` uitgeschakeld voor strikt expliciet vertrouwen.

Gebruik de twee bedieningselementen voor verschillende taken:

- `tools.exec.safeBins`: kleine, alleen-stdin streamfilters.
- `tools.exec.safeBinTrustedDirs`: expliciete extra vertrouwde mappen voor safe-bin-paden naar uitvoerbare bestanden.
- `tools.exec.safeBinProfiles`: expliciet argv-beleid voor aangepaste safe bins.
- allowlist: expliciet vertrouwen voor paden naar uitvoerbare bestanden.

Behandel `safeBins` niet als een generieke allowlist en voeg geen interpreter-/runtime-binaries toe (bijvoorbeeld `python3`, `node`, `ruby`, `bash`). Als je die nodig hebt, gebruik dan expliciete allowlist-vermeldingen en laat goedkeuringsprompts ingeschakeld.
`openclaw security audit` waarschuwt wanneer interpreter-/runtime-vermeldingen in `safeBins` expliciete profielen missen, en `openclaw doctor --fix` kan ontbrekende aangepaste `safeBinProfiles`-vermeldingen scaffolden.
`openclaw security audit` en `openclaw doctor` waarschuwen ook wanneer je expliciet bins met breed gedrag, zoals `jq`, weer toevoegt aan `safeBins`.
Als je interpreters expliciet op de allowlist zet, schakel dan `tools.exec.strictInlineEval` in zodat inline code-eval-vormen nog steeds een nieuwe goedkeuring vereisen.

Zie [Exec-goedkeuringen](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) en [Safe bins versus allowlist](/nl/tools/exec-approvals-advanced#safe-bins-versus-allowlist) voor volledige beleidsdetails en voorbeelden.

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
is ingeschakeld, kan de opdracht de sessie wekken wanneer deze uitvoer produceert of faalt.

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

Plakken (standaard met brackets):

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
- `deny: ["write"]` weigert `apply_patch` niet; weiger `apply_patch` expliciet of gebruik `deny: ["group:fs"]` wanneer patch-writes ook moeten worden geblokkeerd.
- Configuratie staat onder `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` is standaard `true`; stel dit in op `false` om de tool voor OpenAI-modellen uit te schakelen.
- `tools.exec.applyPatch.workspaceOnly` is standaard `true` (binnen de workspace). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de workspace-map schrijft/verwijdert.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Sandboxing](/nl/gateway/sandboxing) — opdrachten uitvoeren in sandboxomgevingen
- [Achtergrondproces](/nl/gateway/background-process) — langlopende exec- en process-tool
- [Beveiliging](/nl/gateway/security) — toolbeleid en verhoogde toegang
