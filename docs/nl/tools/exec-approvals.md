---
read_when:
    - Exec-goedkeuringen of toelatingslijsten configureren
    - Exec-goedkeurings-UX implementeren in de macOS-app
    - Prompts voor sandboxontsnapping en de implicaties ervan beoordelen
sidebarTitle: Exec approvals
summary: 'Hostuitvoeringsgoedkeuringen: beleidsinstellingen, toelatingslijsten en de YOLO/strikte werkstroom'
title: Uitvoeringsgoedkeuringen
x-i18n:
    generated_at: "2026-05-11T20:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-goedkeuringen zijn de **vangrail van de companion app / node-host** om
een gesandboxte agent opdrachten op een echte host (`gateway` of `node`) te laten uitvoeren. Een
veiligheidsvergrendeling: opdrachten zijn alleen toegestaan wanneer beleid + allowlist +
(optioneel) gebruikersgoedkeuring allemaal overeenstemmen. Exec-goedkeuringen stapelen **bovenop**
toolbeleid en elevated gating (tenzij elevated is ingesteld op `full`, wat
goedkeuringen overslaat).

<Note>
Het effectieve beleid is het **strengere** van `tools.exec.*` en de standaardwaarden voor goedkeuringen;
als een goedkeuringsveld wordt weggelaten, wordt de `tools.exec`-waarde
gebruikt. Host-exec gebruikt ook de lokale goedkeuringsstatus op die machine - een
host-lokale `ask: "always"` in `~/.openclaw/exec-approvals.json` blijft
vragen, zelfs als sessie- of configuratiestandaarden `ask: "on-miss"` aanvragen.
</Note>

## Het effectieve beleid inspecteren

| Opdracht                                                         | Wat het toont                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Aangevraagd beleid, bronnen van hostbeleid en het effectieve resultaat.                |
| `openclaw exec-policy show`                                      | Samengevoegde weergave voor de lokale machine.                                         |
| `openclaw exec-policy set` / `preset`                            | Synchroniseer het lokale aangevraagde beleid in één stap met het lokale hostgoedkeuringsbestand. |

Wanneer een lokaal bereik `host=node` aanvraagt, rapporteert `exec-policy show` dat
bereik tijdens runtime als node-beheerd in plaats van te doen alsof het lokale
goedkeuringsbestand de bron van waarheid is.

Als de UI van de companion app **niet beschikbaar** is, wordt elk verzoek dat
normaal gesproken een prompt zou tonen, opgelost door de **ask fallback** (standaard: `deny`).

<Tip>
Native chatgoedkeuringsclients kunnen kanaalspecifieke mogelijkheden vooraf invullen op het
wachtende goedkeuringsbericht. Matrix vult bijvoorbeeld reactiesnelkoppelingen vooraf in
(`✅` één keer toestaan, `❌` weigeren, `♾️` altijd toestaan), terwijl
`/approve ...`-opdrachten nog steeds als fallback in het bericht blijven staan.
</Tip>

## Waar het van toepassing is

Exec-goedkeuringen worden lokaal afgedwongen op de uitvoeringshost:

- **Gateway-host** → `openclaw`-proces op de Gateway-machine.
- **Node-host** → node-runner (macOS companion app of headless node-host).

### Vertrouwensmodel

- Gateway-geauthenticeerde aanroepers zijn vertrouwde operators voor die Gateway.
- Gekoppelde nodes breiden die vertrouwde operatorcapaciteit uit naar de node-host.
- Exec-goedkeuringen verminderen het risico op onbedoelde uitvoering, maar zijn **geen** autorisatiegrens per gebruiker of bestandssysteembeleid voor alleen-lezen.
- Na goedkeuring kan een opdracht bestanden wijzigen volgens de geselecteerde host- of sandboxbestandssysteemrechten.
- Goedgekeurde node-host-runs binden canonieke uitvoeringscontext: canonieke cwd, exacte argv, env-binding wanneer aanwezig, en vastgezette uitvoerbare padnaam wanneer van toepassing.
- Voor shellscripts en directe interpreter-/runtimebestandsaanroepen probeert OpenClaw ook één concreet lokaal bestandsoperand te binden. Als dat gebonden bestand na goedkeuring maar vóór uitvoering verandert, wordt de run geweigerd in plaats van gewijzigde inhoud uit te voeren.
- Bestandsbinding is bewust best-effort, **geen** volledig semantisch model van elk interpreter-/runtimeloaderpad. Als de goedkeuringsmodus niet precies één concreet lokaal bestand kan identificeren om te binden, weigert deze een door goedkeuring gedekte run te minten in plaats van volledige dekking te veinzen.

### macOS-splitsing

- De **node-hostservice** stuurt `system.run` door naar de **macOS-app** via lokale IPC.
- De **macOS-app** dwingt goedkeuringen af en voert de opdracht uit in UI-context.

## Instellingen en opslag

Goedkeuringen staan in een lokaal JSON-bestand op de uitvoeringshost:

```text
~/.openclaw/exec-approvals.json
```

Voorbeeldschema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Beleidsknoppen

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blokkeer alle host-exec-verzoeken.
  - `allowlist` - sta alleen opdrachten op de allowlist toe.
  - `full` - sta alles toe (equivalent aan elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - vraag nooit.
  - `on-miss` - vraag alleen wanneer de allowlist niet overeenkomt.
  - `always` - vraag bij elke opdracht. Duurzaam vertrouwen via `allow-always` onderdrukt prompts **niet** wanneer de effectieve ask-modus `always` is.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolutie wanneer een prompt vereist is maar er geen UI bereikbaar is.

- `deny` - blokkeer.
- `allowlist` - sta alleen toe als de allowlist overeenkomt.
- `full` - sta toe.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wanneer `true`, behandelt OpenClaw inline code-eval-vormen als alleen-goedkeuring,
  zelfs als de interpreter-binary zelf op de allowlist staat. Defense-in-depth
  voor interpreterloaders die niet netjes naar één stabiel bestandsoperand
  mappen.
</ParamField>

Voorbeelden die de strikte modus opvangt:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

In strikte modus hebben deze opdrachten nog steeds expliciete goedkeuring nodig, en
`allow-always` bewaart niet automatisch nieuwe allowlist-vermeldingen voor ze.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Regelt alleen de presentatie in exec-goedkeuringsprompts. Wanneer ingeschakeld,
  kan OpenClaw parser-afgeleide opdrachtbereiken toevoegen zodat Web-goedkeuringsprompts
  opdrachttokens kunnen markeren. Stel dit in op `true` om
  markering van opdrachttekst in te schakelen.
</ParamField>

Deze instelling wijzigt **niet** `security`, `ask`, allowlist-matching,
strikt inline-eval-gedrag, doorsturen van goedkeuringen of opdrachtuitvoering.
Ze kan globaal worden ingesteld onder `tools.exec.commandHighlighting` of per
agent onder `agents.list[].tools.exec.commandHighlighting`.

## YOLO-modus (geen goedkeuring)

Als je wilt dat host-exec zonder goedkeuringsprompts wordt uitgevoerd, moet je
**beide** beleidslagen openen - het aangevraagde exec-beleid in de OpenClaw-configuratie
(`tools.exec.*`) **en** het host-lokale goedkeuringsbeleid in
`~/.openclaw/exec-approvals.json`.

YOLO is het standaard hostgedrag tenzij je het expliciet aanscherpt:

| Laag                  | YOLO-instelling           |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` op `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Belangrijke verschillen:**

- `tools.exec.host=auto` kiest **waar** exec draait: sandbox wanneer beschikbaar, anders Gateway.
- YOLO kiest **hoe** host-exec wordt goedgekeurd: `security=full` plus `ask=off`.
- In YOLO-modus voegt OpenClaw **geen** aparte heuristische goedkeuringspoort voor opdrachtverduistering of script-preflight-afwijzingslaag toe bovenop het geconfigureerde host-exec-beleid.
- `auto` maakt Gateway-routering geen vrije override vanuit een gesandboxte sessie. Een per-aanroep `host=node`-verzoek is toegestaan vanuit `auto`; `host=gateway` is alleen toegestaan vanuit `auto` wanneer er geen sandboxruntime actief is. Stel voor een stabiele niet-auto-standaard `tools.exec.host` in of gebruik expliciet `/exec host=...`.

</Warning>

CLI-ondersteunde providers die hun eigen niet-interactieve machtigingsmodus
blootstellen, kunnen dit beleid volgen. Claude CLI voegt
`--permission-mode bypassPermissions` toe wanneer het aangevraagde exec-beleid van OpenClaw
YOLO is. Overschrijf dat backendgedrag met expliciete Claude-argumenten
onder `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
bijvoorbeeld `--permission-mode default`, `acceptEdits` of
`bypassPermissions`.

Als je een conservatievere setup wilt, zet dan een van beide lagen terug naar
`allowlist` / `on-miss` of `deny`.

### Persistente Gateway-host-setup met "nooit vragen"

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### Lokale snelkoppeling

```bash
openclaw exec-policy preset yolo
```

Die lokale snelkoppeling werkt beide bij:

- Lokale `tools.exec.host/security/ask`.
- Lokale standaardwaarden in `~/.openclaw/exec-approvals.json`.

Dit is bewust alleen lokaal. Gebruik `openclaw approvals set --gateway` of
`openclaw approvals set --node <id|name|ip>` om Gateway-host- of node-hostgoedkeuringen
op afstand te wijzigen.

### Node-host

Pas voor een node-host in plaats daarvan hetzelfde goedkeuringsbestand toe op die node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**Beperkingen voor alleen lokaal:**

- `openclaw exec-policy` synchroniseert geen node-goedkeuringen.
- `openclaw exec-policy set --host node` wordt geweigerd.
- Node-exec-goedkeuringen worden tijdens runtime opgehaald van de node, dus node-gerichte updates moeten `openclaw approvals --node ...` gebruiken.

</Note>

### Snelkoppeling alleen voor de sessie

- `/exec security=full ask=off` wijzigt alleen de huidige sessie.
- `/elevated full` is een break-glass-snelkoppeling die ook exec-goedkeuringen voor die sessie overslaat.

Als het hostgoedkeuringsbestand strenger blijft dan de configuratie, wint het strengere hostbeleid
nog steeds.

## Allowlist (per agent)

Allowlists zijn **per agent**. Als er meerdere agents bestaan, wissel dan in de macOS-app welke agent
je bewerkt. Patronen zijn glob-overeenkomsten.

Patronen kunnen opgeloste binary-padglobs of kale opdrachtnaamglobs zijn.
Kale namen matchen alleen opdrachten die via `PATH` worden aangeroepen, dus `rg` kan matchen
met `/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar **niet** met `./rg` of
`/tmp/rg`. Gebruik een padglob wanneer je één specifieke binarylocatie wilt vertrouwen.

Verouderde `agents.default`-vermeldingen worden bij laden gemigreerd naar `agents.main`.
Shellketens zoals `echo ok && pwd` moeten nog steeds elk top-level segment
aan de allowlist-regels laten voldoen.

Voorbeelden:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumenten beperken met argPattern

Voeg `argPattern` toe wanneer een allowlist-vermelding een binary en een
specifieke argumentvorm moet matchen. OpenClaw evalueert de reguliere expressie
tegen de geparseerde opdrachtargumenten, exclusief het uitvoerbare token
(`argv[0]`). Voor handmatig geschreven vermeldingen worden argumenten samengevoegd met één
spatie, dus veranker het patroon wanneer je een exacte match nodig hebt.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Die vermelding staat `python3 safe.py` toe; `python3 other.py` is een allowlist-mis. Als er ook een pad-only vermelding voor dezelfde binary aanwezig is, kunnen niet-overeenkomende
argumenten nog steeds terugvallen op die pad-only vermelding. Laat de pad-only
vermelding weg wanneer het doel is de binary te beperken tot de gedeclareerde argumenten.

Invoeren die door goedkeuringsflows zijn opgeslagen, kunnen een intern scheidingstekenformaat gebruiken voor
exacte argv-matching. Gebruik bij voorkeur de UI of goedkeuringsflow om die
invoeren opnieuw te genereren in plaats van de gecodeerde waarde handmatig te bewerken. Als OpenClaw
argv voor een commandosegment niet kan parsen, komen invoeren met `argPattern` niet overeen.

Elke allowlist-invoer ondersteunt:

| Veld               | Betekenis                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Opgelost globpatroon voor binair pad of kaal globpatroon voor commandonaam |
| `argPattern`       | Optionele argv-regex; weggelaten invoeren zijn alleen padgebaseerd |
| `id`               | Stabiele UUID gebruikt voor UI-identiteit                     |
| `source`           | Bron van invoer, zoals `allow-always`                         |
| `commandText`      | Commandotekst vastgelegd toen een goedkeuringsflow de invoer maakte |
| `lastUsedAt`       | Tijdstempel van laatste gebruik                               |
| `lastUsedCommand`  | Laatste commando dat overeenkwam                              |
| `lastResolvedPath` | Laatst opgeloste binaire pad                                  |

## Automatisch toestaan van Skills-CLI's

Wanneer **Automatisch toestaan van Skills-CLI's** is ingeschakeld, worden uitvoerbare bestanden waarnaar
bekende skills verwijzen als toegestaan behandeld op Nodes (macOS-Node of headless
Node-host). Dit gebruikt `skills.bins` via de Gateway-RPC om de
skill-binlijst op te halen. Schakel dit uit als je strikte handmatige allowlists wilt.

<Warning>
- Dit is een **impliciete gemaks-allowlist**, los van handmatige pad-allowlist-invoeren.
- Dit is bedoeld voor vertrouwde operatoromgevingen waar Gateway en Node binnen dezelfde vertrouwensgrens vallen.
- Als je strikt expliciet vertrouwen vereist, houd `autoAllowSkills: false` aan en gebruik alleen handmatige pad-allowlist-invoeren.

</Warning>

## Veilige bins en doorsturen van goedkeuringen

Voor veilige bins (het stdin-only snelle pad), details over interpreter-binding en
hoe je goedkeuringsprompts doorstuurt naar Slack/Discord/Telegram (of ze uitvoert als
native goedkeuringsclients), zie
[Exec-goedkeuringen - geavanceerd](/nl/tools/exec-approvals-advanced).

## Control-UI bewerken

Gebruik de kaart **Control UI → Nodes → Exec-goedkeuringen** om standaardwaarden,
per-agent-overschrijvingen en allowlists te bewerken. Kies een scope (Standaarden of een agent),
pas het beleid aan, voeg allowlist-patronen toe of verwijder ze, en kies vervolgens **Opslaan**. De UI
toont metadata van laatste gebruik per patroon, zodat je de lijst netjes kunt houden.

De doelkiezer kiest **Gateway** (lokale goedkeuringen) of een **Node**.
Nodes moeten `system.execApprovals.get/set` adverteren (macOS-app of
headless Node-host). Als een Node nog geen exec-goedkeuringen adverteert,
bewerk dan direct de lokale `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` ondersteunt bewerken van Gateway of Node - zie
[Goedkeurings-CLI](/nl/cli/approvals).

## Goedkeuringsflow

Wanneer een prompt vereist is, broadcast de Gateway
`exec.approval.requested` naar operatorclients. De Control UI en macOS-
app lossen dit op via `exec.approval.resolve`, waarna de Gateway het
goedgekeurde verzoek doorstuurt naar de Node-host.

Voor `host=node` bevatten goedkeuringsverzoeken een canonieke `systemRunPlan`-
payload. De Gateway gebruikt dat plan als de gezaghebbende
commando-/cwd-/sessiecontext bij het doorsturen van goedgekeurde `system.run`-
verzoeken.

Dat is belangrijk voor asynchrone goedkeuringslatentie:

- Het Node-exec-pad bereidt vooraf één canoniek plan voor.
- Het goedkeuringsrecord slaat dat plan en de bindingsmetadata ervan op.
- Na goedkeuring hergebruikt de uiteindelijke doorgestuurde `system.run`-aanroep het opgeslagen plan in plaats van latere wijzigingen van de aanroeper te vertrouwen.
- Als de aanroeper `command`, `rawCommand`, `cwd`, `agentId` of `sessionKey` wijzigt nadat het goedkeuringsverzoek is gemaakt, wijst de Gateway de doorgestuurde uitvoering af als een goedkeuringsmismatch.

## Systeemgebeurtenissen

De exec-levenscyclus wordt weergegeven als systeemberichten:

- `Exec running` (alleen als het commando de drempel voor de uitvoeringsmelding overschrijdt).
- `Exec finished`.
- `Exec denied`.

Deze worden in de sessie van de agent geplaatst nadat de Node de gebeurtenis meldt.
Gateway-host-exec-goedkeuringen zenden dezelfde levenscyclusgebeurtenissen uit wanneer het
commando klaar is (en optioneel wanneer het langer draait dan de drempel).
Door goedkeuring afgeschermde execs hergebruiken de goedkeurings-id als de `runId` in deze
berichten voor eenvoudige correlatie.

## Gedrag bij geweigerde goedkeuring

Wanneer een asynchrone exec-goedkeuring wordt geweigerd, voorkomt OpenClaw dat de agent
uitvoer hergebruikt van een eerdere uitvoering van hetzelfde commando in de sessie.
De weigeringsreden wordt doorgegeven met expliciete instructie dat er geen commando-uitvoer
beschikbaar is, wat voorkomt dat de agent beweert dat er nieuwe uitvoer is of
het geweigerde commando herhaalt met verouderde resultaten van een eerdere geslaagde
uitvoering.

## Implicaties

- **`full`** is krachtig; geef waar mogelijk de voorkeur aan allowlists.
- **`ask`** houdt je betrokken terwijl snelle goedkeuringen mogelijk blijven.
- Per-agent-allowlists voorkomen dat goedkeuringen van de ene agent naar andere lekken.
- Goedkeuringen gelden alleen voor host-exec-verzoeken van **geautoriseerde afzenders**. Ongeautoriseerde afzenders kunnen geen `/exec` uitvoeren.
- `/exec security=full` is een gemak op sessieniveau voor geautoriseerde operators en slaat goedkeuringen bewust over. Om host-exec hard te blokkeren, stel je goedkeuringsbeveiliging in op `deny` of weiger je de `exec`-tool via toolbeleid.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec-goedkeuringen - geavanceerd" href="/nl/tools/exec-approvals-advanced" icon="gear">
    Veilige bins, interpreter-binding en doorsturen van goedkeuringen naar chat.
  </Card>
  <Card title="Exec-tool" href="/nl/tools/exec" icon="terminal">
    Tool voor uitvoering van shellcommando's.
  </Card>
  <Card title="Verhoogde modus" href="/nl/tools/elevated" icon="shield-exclamation">
    Break-glass-pad dat ook goedkeuringen overslaat.
  </Card>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing" icon="box">
    Sandbox-modi en werkruimtetoegang.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security" icon="lock">
    Beveiligingsmodel en hardening.
  </Card>
  <Card title="Sandbox versus toolbeleid versus verhoogd" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wanneer je welke controle gebruikt.
  </Card>
  <Card title="Skills" href="/nl/tools/skills" icon="sparkles">
    Door Skills ondersteund automatisch-toestaan-gedrag.
  </Card>
</CardGroup>
