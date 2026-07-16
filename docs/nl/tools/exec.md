---
read_when:
    - Het exec-hulpprogramma gebruiken of wijzigen
    - Foutopsporing van stdin- of TTY-gedrag
summary: Gebruik van de exec-tool, stdin-modi en TTY-ondersteuning
title: Exec-tool
x-i18n:
    generated_at: "2026-07-16T16:30:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Voer shellopdrachten uit in de werkruimte. `exec` is een shelloppervlak dat wijzigingen kan aanbrengen: opdrachten kunnen overal waar het bestandssysteem van de geselecteerde host of sandbox dit toestaat bestanden maken, bewerken of verwijderen. Het uitschakelen van OpenClaw-bestandssysteemtools zoals `write`, `edit` of `apply_patch` maakt `exec` niet alleen-lezen.

Ondersteunt uitvoering op de voorgrond en achtergrond via `process`. Als `process` niet is toegestaan, wordt `exec` synchroon uitgevoerd en worden `yieldMs`/`background` genegeerd. Achtergrondsessies zijn per agent afgebakend; `process` ziet alleen sessies van dezelfde agent.

## Parameters

<ParamField path="command" type="string" required>
Uit te voeren shellopdracht.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Werkmap voor de opdracht.
</ParamField>

<ParamField path="env" type="object">
Omgevingsoverschrijvingen als sleutel-waardeparen die boven op de overgenomen omgeving worden samengevoegd.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Plaats de opdracht na deze vertraging (ms) automatisch op de achtergrond.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Plaats de opdracht onmiddellijk op de achtergrond in plaats van te wachten op `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Overschrijf voor deze aanroep de geconfigureerde time-out voor exec, in seconden. Geldt voor uitvoering op de voorgrond, op de achtergrond, via `yieldMs`, de Gateway, de sandbox en Node-`system.run`. `timeout: 0` schakelt de time-out van het exec-proces voor die aanroep uit.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Voer indien beschikbaar uit in een pseudoterminal. Gebruik dit voor CLI's die alleen met een TTY werken, codeeragents en terminalinterfaces.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Waar de opdracht moet worden uitgevoerd. `auto` wordt omgezet in `sandbox` wanneer een sandboxruntime actief is, en anders in `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Wordt genegeerd voor normale toolaanroepen. De beveiliging van `gateway`/`node` wordt geregeld door `tools.exec.security` en het goedkeuringsbestand van de host; de verhoogde modus kan `security=full` alleen afdwingen wanneer de operator expliciet verhoogde toegang verleent.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
De standaardvraagmodus is afkomstig uit `tools.exec.ask` en de hostgoedkeuringen. Voor modelaanroepen die vanuit een kanaal afkomstig zijn, wordt `ask` per aanroep genegeerd wanneer de effectieve vraagmodus van de host `off` is; anders kan deze alleen worden aangescherpt tot een strengere modus. Vertrouwde interne/API-aanroepers die exec-tools samenstellen met een expliciete waarde voor `ask`, blijven ongewijzigd.
</ParamField>

<ParamField path="node" type="string">
Node-id/-naam wanneer `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Vraag de verhoogde modus aan: verlaat de sandbox en gebruik het geconfigureerde hostpad. `security=full` wordt alleen afgedwongen wanneer verhoogde toegang wordt omgezet in `full`.
</ParamField>

Opmerkingen:

- `host` accepteert alleen `auto`, `sandbox`, `gateway` of `node`. Het is geen selectieveld voor hostnamen; waarden die op hostnamen lijken, worden geweigerd voordat de opdracht wordt uitgevoerd.
- `host=node` per aanroep is toegestaan vanuit `auto`; `host=gateway` per aanroep is alleen toegestaan wanneer er geen sandboxruntime actief is.
- Zonder extra configuratie werkt `host=auto` nog steeds direct: zonder sandbox wordt het omgezet in `gateway`; met een actieve sandbox blijft het in de sandbox.
- `elevated` verlaat de sandbox en gebruikt het geconfigureerde hostpad: standaard `gateway`, of `node` wanneer `tools.exec.host=node` (of de sessiestandaard `host=node` is). Dit is alleen beschikbaar wanneer verhoogde toegang voor de huidige sessie/provider is ingeschakeld.
- Goedkeuringen voor `gateway`/`node` worden geregeld door het goedkeuringsbestand van de host.
- `node` vereist een gekoppelde Node (begeleidende app of headless Node-host). Als er meerdere Nodes beschikbaar zijn, stel je `exec.node` of `tools.exec.node` in om er één te selecteren.
- `exec host=node` is het enige pad voor shelluitvoering op Nodes; de verouderde wrapper `nodes.run` is verwijderd.
- Op niet-Windows-hosts gebruikt exec `SHELL` wanneer dit is ingesteld; als `SHELL` gelijk is aan `fish`, geeft het de voorkeur aan `bash` (of `sh`) uit `PATH` om bash-constructies te vermijden die niet compatibel zijn met fish, en valt het terug op `SHELL` als geen van beide bestaat.
- Op Windows-hosts geeft exec de voorkeur aan detectie van PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 en vervolgens PATH), en valt het daarna terug op Windows PowerShell 5.1.
- Op niet-Windows-Gateway-hosts gebruiken exec-opdrachten voor bash en zsh een opstartmomentopname. OpenClaw legt sourcebare aliassen/functies en een kleine, veilige verzameling omgevingsvariabelen uit shellopstartbestanden vast in `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, en laadt die momentopname vervolgens vóór elke exec-opdracht. Variabelen die op geheimen lijken, worden uitgesloten; exec in de sandbox en op Nodes gebruikt deze momentopname niet. Stel `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in de procesomgeving van de Gateway in om dit momentopnamepad uit te schakelen.
- Uitvoering op de host (`gateway`/`node`) weigert `env.PATH` en loaderoverschrijvingen (`LD_*`/`DYLD_*`) om het kapen van binaire bestanden of geïnjecteerde code te voorkomen.
- OpenClaw stelt `OPENCLAW_SHELL=exec` in de omgeving van de gestarte opdracht in (ook bij PTY- en sandboxuitvoering), zodat shell-/profielregels de context van de exec-tool kunnen detecteren.
- Voor uitvoeringen die vanuit een kanaal afkomstig zijn, stelt OpenClaw ook een beperkte JSON-payload met de identiteit van de afzender/chat beschikbaar in `OPENCLAW_CHANNEL_CONTEXT` wanneer het kanaal deze id's heeft aangeleverd.
- `exec` kan geen shellopdrachten voor `openclaw channels login` of `/approve` uitvoeren: `openclaw channels login` is een interactieve kanaalauthenticatiestroom en `/approve` moet via de handler voor goedkeuringsopdrachten lopen, niet via een shell. Voer de kanaalaanmelding uit in een terminal op de Gateway-host, of gebruik een kanaalspecifieke aanmeldingstool voor agents wanneer die beschikbaar is (bijvoorbeeld `whatsapp_login`).
- Belangrijk: sandboxing staat **standaard uit**. Als sandboxing uitstaat, wordt impliciete `host=auto` omgezet in `gateway`. Expliciete `host=sandbox` weigert nog steeds veilig in plaats van stilzwijgend op de Gateway-host te worden uitgevoerd. Schakel sandboxing in of gebruik `host=gateway` met goedkeuringen.
- Voorafgaande scriptcontroles (voor veelvoorkomende fouten in de shellsyntaxis van Python/Node) inspecteren alleen bestanden binnen de effectieve grens van `workdir`. Als een scriptpad buiten `workdir` wordt omgezet, wordt de voorafgaande controle voor dat bestand overgeslagen. De voorafgaande controle wordt ook volledig overgeslagen wanneer `host=gateway` en het effectieve beleid `security=full` met `ask=off` is.
- Voor langdurig werk dat nu begint, start je het eenmaal en vertrouw je op de automatische melding bij voltooiing wanneer die is ingeschakeld en de opdracht uitvoer produceert of mislukt. Gebruik `process` voor logboeken, status, invoer of ingrijpen; boots planning niet na met slaaplussen, time-outlussen of herhaald pollen.
- Gebruik voor werk dat later of volgens een schema moet plaatsvinden Cron in plaats van slaap-/vertragingspatronen met `exec`.

## Configuratie

| Sleutel                              | Standaard                                              | Opmerkingen                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Standaardtime-out per exec-opdracht in seconden. `timeout` per aanroep overschrijft deze; `timeout: 0` per aanroep schakelt de time-out van het exec-proces uit. |
| `tools.exec.host`                    | `auto`                                                 | Wordt omgezet naar `sandbox` wanneer een sandbox-runtime actief is, anders naar `gateway`.                                                        |
| `tools.exec.security`                | `deny` voor sandbox, `full` voor Gateway/Node wanneer niet ingesteld |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | niet ingesteld                                         | Genormaliseerde beleidsinstelling. Zie [Modi](#modes) hieronder. Kan niet worden gecombineerd met `tools.exec.security`/`tools.exec.ask`.                |
| `tools.exec.reviewer.model`          | geconfigureerd primair agentmodel                       | Optionele provider-/modeloverschrijving voor beoordeling door `mode=auto`.                                                                              |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Time-out per fase voor de voorbereiding en voltooiing door het beoordelingsmodel voordat op menselijke beoordeling wordt teruggevallen.                 |
| `tools.exec.node`                    | niet ingesteld                                         |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Indien waar, plaatsen exec-sessies op de achtergrond bij afsluiting een systeemgebeurtenis in de wachtrij en vragen ze om een Heartbeat.                 |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Geef één melding 'actief' weer wanneer een exec waarvoor goedkeuring vereist is langer dan deze tijd actief is (`0` schakelt dit uit).   |
| `tools.exec.strictInlineEval`        | `false`                                                | Zie [Inline-evaluatie](#inline-eval-strictinlineeval).                                                                                                  |
| `tools.exec.commandHighlighting`     | `false`                                                | Indien waar, kunnen goedkeuringsvragen door de parser afgeleide opdrachtfragmenten in de opdrachttekst markeren. Globaal of per agent in te stellen; wijzigt het goedkeuringsbeleid niet. |
| `tools.exec.pathPrepend`             | niet ingesteld                                         | Lijst met mappen die voor exec-uitvoeringen vóór `PATH` worden geplaatst (alleen Gateway en sandbox).                                      |
| `tools.exec.safeBins`                | niet ingesteld                                         | Veilige binaire bestanden die alleen stdin gebruiken en zonder expliciete vermeldingen in de toestemmingslijst kunnen worden uitgevoerd. Zie [Veilige binaire bestanden](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only). |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Aanvullende expliciete mappen die worden vertrouwd voor padcontroles van `safeBins`. Vermeldingen van `PATH` worden nooit automatisch vertrouwd. |
| `tools.exec.safeBinProfiles`         | niet ingesteld                                         | Optioneel aangepast argv-beleid per veilig binair bestand (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).             |

Host-exec zonder goedkeuring is standaard voor Gateway en Node (`security=full`, `ask=off`) — dit komt voort uit de standaardwaarden van het hostbeleid, niet uit `host=auto`. Als je goedkeuringen/toestemmingslijstgedrag wilt, stel dan zowel `tools.exec.*` als het hostgoedkeuringsbestand strenger in; zie [Exec-goedkeuringen](/nl/tools/exec-approvals#yolo-mode-no-approval). Stel `tools.exec.host` in of gebruik `/exec host=...` om routering via Gateway of Node af te dwingen, ongeacht de sandboxstatus.

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

### Modi

`tools.exec.mode` is de genormaliseerde beleidsinstelling. Als je deze instelt, worden `security`/`ask` ervan afgeleid en kan deze niet worden gecombineerd met expliciete `tools.exec.security`/`tools.exec.ask`.

| Modus       | beveiliging | vragen    | Gedrag                                                                                                                         |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Exec wordt geweigerd.                                                                                                          |
| `allowlist` | `allowlist` | `off`     | Alleen opdrachten op de toestemmingslijst of veilige binaire bestanden worden uitgevoerd; voor niets anders wordt goedkeuring gevraagd. |
| `ask`       | `allowlist` | `on-miss` | Overeenkomsten met de toestemmingslijst worden rechtstreeks uitgevoerd; voor al het andere wordt een mens om goedkeuring gevraagd. |
| `auto`      | `allowlist` | `on-miss` | Overeenkomsten met de toestemmingslijst of veilige binaire bestanden worden rechtstreeks uitgevoerd; al het andere gaat eerst langs de ingebouwde automatische beoordelaar van OpenClaw voordat een mens om goedkeuring wordt gevraagd. |
| `full`      | `full`      | `off`     | Geen goedkeuringspoort.                                                                                                        |

`ask`/`ask=always` vraagt nog steeds elke keer een mens om goedkeuring, ongeacht de modus.

Goedkeuring via automatische beoordeling is eenmalig. Op de Gateway verstrekt OpenClaw het opgeloste pad van het uitvoerbare bestand aan de beoordelaar en zet het de uitvoering vast op datzelfde pad. Opdrachten die niet tot één afdwingbaar uitvoeringsplan kunnen worden teruggebracht, zoals heredocs, shelluitbreidingen of niet-ondersteunde aanhalingstekens bij wrappers, vallen terug op menselijke goedkeuring, zelfs als het model ze anders zou toestaan.

Goedkeuringen van Codex-appserveropdrachten waarover nog niet door expliciet runtime- of ingebouwd beleid is beslist, gebruiken de route voor menselijke goedkeuring. OpenClaw voert de geconfigureerde exec-beoordelaar niet uit voor deze aanvragen, omdat Codex geen afdwingbaar opgelost uitvoerbaar bestand beschikbaar stelt waarmee de beoordelingsbeslissing kan worden gekoppeld aan de opdracht die Codex uitvoert.

### Inline-evaluatie (`strictInlineEval`)

Wanneer `tools.exec.strictInlineEval` `true` is, vereisen inline-evaluatievormen van interpreters beoordeling of expliciete goedkeuring: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` en vergelijkbare vormen voor andere ondersteunde interpreters en opdrachtdragers (`awk`, `find -exec`, `make`, `sed`, `xargs` en meer). In `mode=auto` kan het normale exec-goedkeuringstraject de ingebouwde automatische beoordelaar een duidelijk eenmalige opdracht met laag risico laten toestaan; rechtstreekse `system.run`-aanroepen op de Node-host vereisen nog steeds expliciete goedkeuring, omdat ze de opdracht niet naar een menselijke goedkeuringsroute kunnen doorgeven. Als de beoordelaar daarom vraagt, gaat de aanvraag naar een mens. `allow-always` kan nog steeds onschuldige interpreter-/scriptaanroepen permanent opslaan, maar inline-evaluatievormen worden geen permanente toestemmingsregels.

### PATH-verwerking

- `host=gateway`: voegt `PATH` van je login-shell samen met de exec-omgeving. Overschrijvingen van `env.PATH` worden geweigerd voor hostuitvoering. De daemon zelf wordt nog steeds uitgevoerd met een minimale `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Om te voorkomen dat de shellconfiguratie van de gebruiker (zoals `~/.zshenv` of `/etc/zshenv`) tijdens het opstarten paden met prioriteit overschrijft, worden vermeldingen van `tools.exec.pathPrepend` veilig vóór het uiteindelijke `PATH` in de shellopdracht geplaatst, vlak voor de uitvoering.
- `host=sandbox`: voert `sh -lc` (login-shell) uit in de container, waardoor `/etc/profile` `PATH` opnieuw kan instellen. OpenClaw plaatst `env.PATH` na het laden van het profiel ervoor via een interne omgevingsvariabele (zonder shellinterpolatie); `tools.exec.pathPrepend` is hier ook van toepassing.
- `host=node`: alleen niet-geblokkeerde omgevingsoverschrijvingen die je doorgeeft, worden naar de Node verzonden. Overschrijvingen van `env.PATH` worden geweigerd voor hostuitvoering en genegeerd door Node-hosts. Als je aanvullende PATH-vermeldingen op een Node nodig hebt, configureer dan de serviceomgeving van de Node-host (systemd/launchd) of installeer hulpprogramma's op standaardlocaties.

Node-koppeling per agent (gebruik de lijstindex van de agent in de configuratie):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: de pagina **Apparaten** bevat een klein paneel 'Exec-Node-koppeling' voor dezelfde instellingen.

## Sessieoverschrijvingen (`/exec`)

Gebruik `/exec` om standaardwaarden **per sessie** in te stellen voor `host`, `security`, `ask` en `node`. Verstuur `/exec` zonder argumenten om de huidige waarden weer te geven.

Voorbeeld:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` wordt alleen gehonoreerd voor **geautoriseerde afzenders** (kanaaltoestemmingslijsten/koppeling plus `commands.useAccessGroups`). Het werkt alleen de **sessiestatus** bij en schrijft niet naar de configuratie. Geautoriseerde externe kanaalafzenders mogen deze standaardsessie-instellingen instellen. Interne Gateway-/webchatclients hebben `operator.admin` nodig om ze permanent op te slaan.

Om exec volledig uit te schakelen, weiger je het via het hulpmiddelenbeleid (`tools.deny: ["exec"]` of per agent). Hostgoedkeuringen blijven van toepassing, tenzij je `security=full` en `ask=off` expliciet instelt.

## Exec-goedkeuringen (begeleidende app / Node-host)

Agents in een sandbox kunnen per aanvraag goedkeuring vereisen voordat `exec` op de Gateway of Node-host wordt uitgevoerd. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het beleid, de toestemmingslijst en de UI-stroom.

Wanneer menselijke goedkeuring vereist is, keren Node-host- en niet-ingebouwde Gateway-stromen onmiddellijk terug met `status: "approval-pending"` en een goedkeurings-id. Ingebouwde chat- en Web UI-Gateway-stromen kunnen in plaats daarvan inline wachten en na goedkeuring het uiteindelijke opdrachtresultaat retourneren. Een resultaat van `approval-pending` betekent dat de opdracht niet is gestart, zodat waarschuwingen over terugvallen op uitvoering op de voorgrond alleen verschijnen als de goedgekeurde opdracht daadwerkelijk inline wordt uitgevoerd. Goedgekeurde asynchrone uitvoeringen genereren systeemgebeurtenissen over de voortgang en voltooiing van opdrachten (`Exec running` / `Exec finished`); geweigerde of verlopen goedkeuringen zijn definitief en wekken de agentsessie niet met een systeemgebeurtenis over de weigering.

Op kanalen met ingebouwde goedkeuringskaarten/-knoppen moet de agent eerst die ingebouwde UI gebruiken en alleen een handmatige opdracht `/approve` opnemen wanneer het toolresultaat expliciet aangeeft dat goedkeuringen via chat niet beschikbaar zijn of dat handmatige goedkeuring de enige mogelijkheid is.

## Allowlist + veilige binaries

Handmatige allowlist-handhaving vergelijkt opgeloste globs van binaire paden en globs van kale opdrachtnamen. Kale namen komen alleen overeen met opdrachten die via PATH worden aangeroepen. Daardoor kan `rg` overeenkomen met `/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar niet met `./rg` of `/tmp/rg`.

Wanneer `security=allowlist`, worden shellopdrachten alleen automatisch toegestaan als elk pijplijnsegment op de allowlist staat of een veilige binary is. Aaneenschakeling (`;`, `&&`, `||`) en omleidingen worden in allowlist-modus geweigerd, tenzij elk segment op het hoogste niveau aan de allowlist voldoet (inclusief veilige binaries). Omleidingen blijven niet ondersteund. Duurzaam vertrouwen via `allow-always` omzeilt die regel niet: voor een aaneengeschakelde opdracht moet elk segment op het hoogste niveau nog steeds overeenkomen.

`autoAllowSkills` is een afzonderlijk gemakspad bij exec-goedkeuringen en is niet hetzelfde als handmatige allowlist-vermeldingen voor paden. Houd `autoAllowSkills` uitgeschakeld voor strikt expliciet vertrouwen.

Gebruik de twee besturingselementen voor verschillende doeleinden:

- `tools.exec.safeBins`: kleine, uitsluitend via stdin werkende streamfilters.
- `tools.exec.safeBinTrustedDirs`: expliciete aanvullende vertrouwde mappen voor uitvoerbare paden van veilige binaries.
- `tools.exec.safeBinProfiles`: expliciet argv-beleid voor aangepaste veilige binaries.
- allowlist: expliciet vertrouwen voor uitvoerbare paden.

Behandel `safeBins` niet als een algemene allowlist en voeg geen interpreter-/runtime-binaries toe (bijvoorbeeld `python3`, `node`, `ruby`, `bash`). Gebruik als je die nodig hebt expliciete allowlist-vermeldingen en houd goedkeuringsprompts ingeschakeld.

`openclaw security audit` waarschuwt wanneer voor interpreter-/runtime-vermeldingen in `safeBins` expliciete profielen ontbreken, en `openclaw doctor --fix` kan ontbrekende aangepaste vermeldingen in `safeBinProfiles` genereren. `openclaw security audit` en `openclaw doctor` waarschuwen ook wanneer je expliciet binaries met breed gedrag, zoals `jq`, weer toevoegt aan `safeBins` (`jq` kan omgevingsgegevens lezen en jq-code uit modules of opstartbestanden laden; geef daarom de voorkeur aan expliciete allowlist-vermeldingen of uitvoeringen waarvoor goedkeuring vereist is). `jq` wordt als veilige binary geweigerd, zelfs wanneer deze expliciet wordt vermeld. Als je interpreters expliciet op de allowlist zet, schakel dan `tools.exec.strictInlineEval` in, zodat vormen voor inline code-evaluatie nog steeds beoordeling of expliciete goedkeuring vereisen.

Zie [Exec-goedkeuringen](/nl/tools/exec-approvals-advanced#safe-bins-stdin-only) en [Veilige binaries versus allowlist](/nl/tools/exec-approvals-advanced#safe-bins-versus-allowlist) voor volledige beleidsdetails en voorbeelden.

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

Pollen is bedoeld voor status op aanvraag, niet voor wachtlussen. Als automatisch wekken bij voltooiing is ingeschakeld, kan de opdracht de sessie wekken wanneer deze uitvoer produceert of mislukt.

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

Plakken (standaard met bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` is een subtool van `exec` voor gestructureerde bewerkingen van meerdere bestanden. Deze is standaard ingeschakeld en beschikbaar voor elke modelprovider; `allowModels` kan de beschikbaarheid beperken. Gebruik configuratie alleen wanneer je de tool wilt uitschakelen of tot specifieke modellen wilt beperken:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Opmerkingen:

- Het toolbeleid blijft van toepassing; `allow: ["write"]` staat `apply_patch` impliciet toe.
- `deny: ["write"]` weigert `apply_patch` niet; weiger `apply_patch` expliciet of gebruik `deny: ["group:fs"]` wanneer schrijfbewerkingen via patches ook moeten worden geblokkeerd.
- De configuratie staat onder `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` is standaard `true`; stel dit in op `false` om de tool uit te schakelen.
- `tools.exec.applyPatch.workspaceOnly` is standaard `true` (beperkt tot de werkruimte). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de werkruimtemap schrijft/verwijdert.
- `tools.exec.applyPatch.allowModels` is een optionele allowlist van model-id's (onbewerkt, zoals `gpt-5.4`, of volledig, zoals `openai/gpt-5.4`). Als deze is ingesteld, krijgen alleen overeenkomende modellen de tool; als deze niet is ingesteld, krijgen alle modellen de tool.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Sandboxing](/nl/gateway/sandboxing) — opdrachten uitvoeren in sandboxomgevingen
- [Achtergrondproces](/nl/gateway/background-process) — langlopende exec- en process-tool
- [Beveiliging](/nl/gateway/security) — toolbeleid en verhoogde toegang
