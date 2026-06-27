---
read_when:
    - Uitvoeringsgoedkeuringen of allowlists configureren
    - Exec-goedkeurings-UX implementeren in de macOS-app
    - Prompts voor sandbox-ontsnapping en hun implicaties beoordelen
sidebarTitle: Exec approvals
summary: 'Host-exec-goedkeuringen: beleidsinstellingen, toegestane lijsten en de YOLO/strikte workflow'
title: Uitvoeringsgoedkeuringen
x-i18n:
    generated_at: "2026-06-27T18:25:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-goedkeuringen zijn de **beveiligingsgrens van de companion-app / Node-host** waarmee
een gesandboxte agent opdrachten op een echte host (`gateway` of `node`) kan uitvoeren. Een
veiligheidsvergrendeling: opdrachten zijn alleen toegestaan wanneer beleid + allowlist +
(optionele) gebruikersgoedkeuring allemaal overeenstemmen. Exec-goedkeuringen komen **boven op**
toolbeleid en verhoogde gating (tenzij elevated is ingesteld op `full`, waardoor
goedkeuringen worden overgeslagen).

Zie voor een modusgerichte uitleg van `deny`, `allowlist`, `ask`, `auto`, `full`,
Codex Guardian-mapping en ACPX-harnessmachtigingen
[Permission modes](/nl/tools/permission-modes).

<Note>
Effectief beleid is de **strengere** van `tools.exec.*` en de standaardwaarden voor
goedkeuringen; als een goedkeuringsveld wordt weggelaten, wordt de waarde van
`tools.exec` gebruikt. Host-exec gebruikt ook lokale goedkeuringsstatus op die machine - een
host-lokale `ask: "always"` in het goedkeuringsbestand van de uitvoeringshost blijft
vragen, zelfs als sessie- of configuratiestandaarden `ask: "on-miss"` aanvragen.
</Note>

## Het effectieve beleid inspecteren

| Opdracht                                                          | Wat het toont                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Aangevraagd beleid, hostbeleidsbronnen en het effectieve resultaat.                    |
| `openclaw exec-policy show`                                      | Samengevoegde weergave van de lokale machine.                                          |
| `openclaw exec-policy set` / `preset`                            | Synchroniseer het lokaal aangevraagde beleid in één stap met het lokale hostgoedkeuringsbestand. |

Wanneer een lokaal bereik `host=node` aanvraagt, rapporteert `exec-policy show` dat
bereik tijdens runtime als door de node beheerd, in plaats van te doen alsof het lokale
goedkeuringsbestand de bron van waarheid is.

Als de UI van de companion-app **niet beschikbaar** is, wordt elk verzoek dat
normaal om bevestiging zou vragen afgehandeld door de **ask-fallback** (standaard: `deny`).

<Tip>
Native chatgoedkeuringsclients kunnen kanaalspecifieke mogelijkheden op het
wachtende goedkeuringsbericht voorbereiden. Matrix bereidt bijvoorbeeld reactiesnelkoppelingen voor
(`✅` één keer toestaan, `❌` weigeren, `♾️` altijd toestaan) terwijl
`/approve ...`-opdrachten in het bericht beschikbaar blijven als fallback.
</Tip>

## Waar het van toepassing is

Exec-goedkeuringen worden lokaal afgedwongen op de uitvoeringshost:

- **Gateway-host** → `openclaw`-proces op de gateway-machine.
- **Node-host** → node-runner (macOS-companion-app of headless Node-host).

### Vertrouwensmodel

- Door de Gateway geauthenticeerde aanroepers zijn vertrouwde operators voor die Gateway.
- Gekoppelde nodes breiden die vertrouwde operatorcapaciteit uit naar de Node-host.
- Exec-goedkeuringen verminderen het risico op onbedoelde uitvoering, maar zijn **geen** auth-grens per gebruiker of alleen-lezenbeleid voor het bestandssysteem.
- Na goedkeuring kan een opdracht bestanden wijzigen volgens de geselecteerde host- of sandboxbestandssysteemmachtigingen.
- Goedgekeurde Node-hostruns binden canonieke uitvoeringscontext: canonieke cwd, exacte argv, env-binding indien aanwezig, en vastgezette uitvoerbare pad wanneer van toepassing.
- Voor shellscripts en directe bestandsaanroepen via interpreter/runtime probeert OpenClaw ook één concreet lokaal bestandsoperand te binden. Als dat gebonden bestand na goedkeuring maar vóór uitvoering verandert, wordt de run geweigerd in plaats van gewijzigde inhoud uit te voeren.
- Bestandsbinding is bewust best-effort, **geen** volledig semantisch model van elk loaderpad van elke interpreter/runtime. Als de goedkeuringsmodus niet exact één concreet lokaal bestand kan identificeren om te binden, weigert deze een door goedkeuring ondersteunde run te minten in plaats van volledige dekking te veinzen.

### macOS-splitsing

- De **Node-hostservice** stuurt `system.run` door naar de **macOS-app** via lokale IPC.
- De **macOS-app** dwingt goedkeuringen af en voert de opdracht uit in UI-context.

## Instellingen en opslag

Goedkeuringen staan in een lokaal JSON-bestand op de uitvoeringshost. Wanneer
`OPENCLAW_STATE_DIR` is ingesteld, volgt het bestand die statusmap;
anders gebruikt het de standaard OpenClaw-statusmap:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

De standaard goedkeuringssocket volgt dezelfde root:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, of
`~/.openclaw/exec-approvals.sock` wanneer de variabele niet is ingesteld.

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

### `tools.exec.mode`

`tools.exec.mode` is het aanbevolen genormaliseerde beleidsoppervlak voor host-exec.
Waarden zijn:

- `deny` - blokkeer host-exec.
- `allowlist` - voer alleen opdrachten op de allowlist uit zonder te vragen.
- `ask` - gebruik allowlistbeleid en vraag bij misses.
- `auto` - gebruik allowlistbeleid, voer deterministische matches rechtstreeks uit en stuur goedkeuringsmisses via OpenClaw's native automatische reviewer voordat wordt teruggevallen op een menselijke goedkeuringsroute.
- `full` - voer host-exec uit zonder goedkeuringsprompts.

Legacy `tools.exec.security` / `tools.exec.ask` blijven ondersteund en hebben nog steeds voorrang
wanneer ze op het nauwere sessie- of agentbereik zijn ingesteld.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blokkeer alle host-exec-verzoeken.
  - `allowlist` - sta alleen opdrachten op de allowlist toe.
  - `full` - sta alles toe (equivalent aan elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Geconfigureerd ask-beleid voor host-exec. Regelt het basisgedrag van de goedkeuringsprompt
  vanuit `tools.exec.ask` en hostgoedkeuringsstandaarden. De
  per-aanroep `ask`-toolparameter (zie [Exec-tool](/nl/tools/exec#parameters))
  kan die basis alleen verstrengen, en modelaanroepen met kanaaloorsprong negeren deze
  wanneer de effectieve host-ask `off` is.

- `off` - nooit vragen.
- `on-miss` - alleen vragen wanneer de allowlist niet overeenkomt.
- `always` - bij elke opdracht vragen. Duurzaam vertrouwen met `allow-always` onderdrukt prompts **niet** wanneer de effectieve ask-modus `always` is.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Afhandeling wanneer een prompt vereist is maar geen UI bereikbaar is. Als dit
  veld wordt weggelaten, gebruikt OpenClaw standaard `deny`.

- `deny` - blokkeer.
- `allowlist` - sta alleen toe als de allowlist overeenkomt.
- `full` - sta toe.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wanneer `true`, behandelt OpenClaw inline code-eval-vormen als alleen met goedkeuring,
  zelfs als de interpreter-binary zelf op de allowlist staat. Defense-in-depth
  voor interpreter-loaders die niet netjes naar één stabiel bestandsoperand
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
  kan OpenClaw parser-afgeleide opdrachtspans toevoegen zodat webgoedkeuringsprompts
  opdrachttokens kunnen markeren. Stel dit in op `true` om
  markering van opdrachttekst in te schakelen.
</ParamField>

Deze instelling wijzigt `security`, `ask`, allowlist-matching,
strikt inline-eval-gedrag, doorsturen van goedkeuringen of opdrachtuitvoering **niet**.
Deze kan globaal worden ingesteld onder `tools.exec.commandHighlighting` of per
agent onder `agents.list[].tools.exec.commandHighlighting`.

## YOLO-modus (geen goedkeuring)

Als je host-exec zonder goedkeuringsprompts wilt laten uitvoeren, moet je
**beide** beleidslagen openen - aangevraagd exec-beleid in de OpenClaw-configuratie
(`tools.exec.*`) **en** host-lokaal goedkeuringsbeleid in
het goedkeuringsbestand van de uitvoeringshost.

OpenClaw gebruikt standaard `deny` voor weggelaten `askFallback`. Stel host
`askFallback` expliciet in op `full` wanneer een goedkeuringsprompt zonder UI
moet terugvallen op toestaan.

| Laag                  | YOLO-instelling            |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` op `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Belangrijke verschillen:**

- `tools.exec.host=auto` kiest **waar** exec draait: sandbox wanneer beschikbaar, anders gateway.
- YOLO kiest **hoe** host-exec wordt goedgekeurd: `security=full` plus `ask=off`.
- In YOLO-modus voegt OpenClaw **geen** aparte heuristische goedkeuringsgate voor opdrachtobfuscatie of script-preflight-afwijslaag toe boven op het geconfigureerde host-exec-beleid.
- `auto` maakt gateway-routing geen vrije override vanuit een gesandboxte sessie. Een per-aanroep `host=node`-verzoek is toegestaan vanuit `auto`; `host=gateway` is vanuit `auto` alleen toegestaan wanneer geen sandboxruntime actief is. Stel voor een stabiele niet-auto-standaard `tools.exec.host` in of gebruik expliciet `/exec host=...`.

</Warning>

CLI-gestuurde providers die hun eigen niet-interactieve machtigingsmodus aanbieden,
kunnen dit beleid volgen. Claude CLI voegt
`--permission-mode bypassPermissions` toe wanneer OpenClaw's effectieve exec-beleid
YOLO is. Voor door OpenClaw beheerde Claude-live-sessies is OpenClaw's
effectieve exec-beleid gezaghebbend boven Claude's native machtigingsmodus:
YOLO normaliseert live-starts naar `--permission-mode bypassPermissions`, en
restrictief effectief exec-beleid normaliseert live-starts naar
`--permission-mode default`, zelfs als ruwe Claude-backendargs een andere
modus opgeven.

Als je een conservatievere setup wilt, verstreng dan het OpenClaw-exec-beleid terug naar
`allowlist` / `on-miss` of `deny`.

### Permanente gateway-hostsetup met "nooit vragen"

<Steps>
  <Step title="Stel het aangevraagde configuratiebeleid in">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Laat het hostgoedkeuringsbestand overeenkomen">
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
- Standaardwaarden van het lokale goedkeuringsbestand, inclusief `askFallback: "full"`.

Deze is bewust alleen lokaal. Gebruik `openclaw approvals set --gateway` of
`openclaw approvals set --node <id|name|ip>` om gateway-host- of Node-hostgoedkeuringen
op afstand te wijzigen.

### Node-host

Pas voor een Node-host hetzelfde goedkeuringsbestand toe op die node:

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
**Alleen-lokale beperkingen:**

- `openclaw exec-policy` synchroniseert geen node-goedkeuringen.
- `openclaw exec-policy set --host node` wordt geweigerd.
- Node-exec-goedkeuringen worden tijdens runtime van de node opgehaald, dus node-gerichte updates moeten `openclaw approvals --node ...` gebruiken.

</Note>

### Snelkoppeling alleen voor sessie

- `/exec security=full ask=off` wijzigt alleen de huidige sessie.
- `/elevated full` is een noodsnelkoppeling die exec-goedkeuringen alleen overslaat wanneer
  zowel het aangevraagde beleid als het hostgoedkeuringsbestand uitkomen op
  `security: "full"` en `ask: "off"`. Een strenger hostbestand, zoals
  `ask: "always"`, vraagt nog steeds om bevestiging.

Als het hostgoedkeuringsbestand strenger blijft dan de configuratie, wint het strengere
hostbeleid nog steeds.

## Allowlist (per agent)

Allowlists zijn **per agent**. Als er meerdere agents bestaan, wissel dan in de macOS-app welke agent
je bewerkt. Patronen zijn glob-overeenkomsten.

Patronen kunnen opgeloste globs voor binaire paden zijn of kale globs voor opdrachtnamen.
Kale namen komen alleen overeen met opdrachten die via `PATH` worden aangeroepen, dus `rg` kan overeenkomen met
`/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar **niet** met `./rg` of
`/tmp/rg`. Gebruik een padglob wanneer je één specifieke binaire
locatie wilt vertrouwen.

Verouderde `agents.default`-vermeldingen worden bij het laden gemigreerd naar `agents.main`.
Shell-ketens zoals `echo ok && pwd` moeten nog steeds elk topniveau-segment
aan de allowlist-regels laten voldoen.

Voorbeelden:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumenten beperken met argPattern

Voeg `argPattern` toe wanneer een allowlist-vermelding moet overeenkomen met een binary en een
specifieke argumentvorm. OpenClaw evalueert de reguliere expressie
tegen de geparseerde opdrachtargumenten, exclusief het uitvoerbare token
(`argv[0]`). Voor handmatig geschreven vermeldingen worden argumenten samengevoegd met één
spatie, dus veranker het patroon wanneer je een exacte overeenkomst nodig hebt.

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

Die vermelding staat `python3 safe.py` toe; `python3 other.py` mist de allowlist.
Als er ook een alleen-pad-vermelding voor dezelfde binary aanwezig is, kunnen niet-overeenkomende
argumenten nog steeds terugvallen op die alleen-pad-vermelding. Laat de alleen-pad-
vermelding weg wanneer het doel is om de binary te beperken tot de gedeclareerde argumenten.

Vermeldingen die door goedkeuringsflows zijn opgeslagen, kunnen een interne scheidingstekenindeling gebruiken voor
exacte argv-overeenkomst. Gebruik bij voorkeur de UI of goedkeuringsflow om die
vermeldingen opnieuw te genereren in plaats van de gecodeerde waarde handmatig te bewerken. Als OpenClaw
argv voor een opdrachtsegment niet kan parsen, komen vermeldingen met `argPattern` niet overeen.

Elke allowlist-vermelding ondersteunt:

| Veld               | Betekenis                                                    |
| ------------------ | ------------------------------------------------------------ |
| `pattern`          | Opgeloste glob voor binair pad of kale glob voor opdrachtnaam |
| `argPattern`       | Optionele argv-regex; weggelaten vermeldingen zijn alleen-pad |
| `id`               | Stabiele UUID die wordt gebruikt voor UI-identiteit           |
| `source`           | Bron van de vermelding, zoals `allow-always`                 |
| `commandText`      | Opdrachttekst vastgelegd toen een goedkeuringsflow de vermelding maakte |
| `lastUsedAt`       | Tijdstempel van laatste gebruik                              |
| `lastUsedCommand`  | Laatste opdracht die overeenkwam                             |
| `lastResolvedPath` | Laatst opgeloste binaire pad                                 |

## Skill-CLI’s automatisch toestaan

Wanneer **Skill-CLI’s automatisch toestaan** is ingeschakeld, worden uitvoerbare bestanden waarnaar door
bekende Skills wordt verwezen behandeld als toegestaan op nodes (macOS-node of headless
node-host). Dit gebruikt `skills.bins` via de Gateway-RPC om de
skill-binlijst op te halen. Schakel dit uit als je strikt handmatige allowlists wilt.

<Warning>
- Dit is een **impliciete gemaks-allowlist**, los van handmatige pad-allowlistvermeldingen.
- Het is bedoeld voor vertrouwde operatoromgevingen waar Gateway en node binnen dezelfde vertrouwensgrens vallen.
- Als je strikt expliciet vertrouwen vereist, houd `autoAllowSkills: false` en gebruik alleen handmatige pad-allowlistvermeldingen.

</Warning>

## Veilige bins en goedkeuring doorsturen

Voor veilige bins (het stdin-only snelle pad), details over interpreterbinding en
hoe je goedkeuringsprompts doorstuurt naar Slack/Discord/Telegram (of ze uitvoert als
native goedkeuringsclients), zie
[Exec-goedkeuringen - geavanceerd](/nl/tools/exec-approvals-advanced).

## Bewerken in de Control UI

Gebruik de kaart **Control UI → Nodes → Exec approvals** om standaardwaarden,
per-agent-overschrijvingen en allowlists te bewerken. Kies een scope (Standaardwaarden of een agent),
pas het beleid aan, voeg allowlist-patronen toe of verwijder ze, en kies daarna **Opslaan**. De UI
toont metadata over laatste gebruik per patroon, zodat je de lijst netjes kunt houden.

De doelselector kiest **Gateway** (lokale goedkeuringen) of een **Node**.
Nodes moeten `system.execApprovals.get/set` adverteren (macOS-app of
headless node-host). Als een node exec-goedkeuringen nog niet adverteert,
bewerk dan rechtstreeks het lokale goedkeuringsbestand.

CLI: `openclaw approvals` ondersteunt bewerken van gateway of node - zie
[Goedkeurings-CLI](/nl/cli/approvals).

## Goedkeuringsflow

Wanneer een prompt vereist is, zendt de gateway
`exec.approval.requested` uit naar operatorclients. De Control UI en macOS-
app lossen dit op via `exec.approval.resolve`, waarna de gateway het
goedgekeurde verzoek doorstuurt naar de node-host.

Voor `host=node` bevatten goedkeuringsverzoeken een canonieke `systemRunPlan`-
payload. De gateway gebruikt dat plan als de gezaghebbende
opdracht/cwd/sessie-context wanneer goedgekeurde `system.run`-
verzoeken worden doorgestuurd.

Dat is belangrijk voor latentie bij asynchrone goedkeuring:

- Het node-exec-pad bereidt vooraf één canoniek plan voor.
- Het goedkeuringsrecord slaat dat plan en de bindingsmetadata ervan op.
- Zodra het is goedgekeurd, hergebruikt de uiteindelijk doorgestuurde `system.run`-aanroep het opgeslagen plan in plaats van latere bewerkingen door de aanroeper te vertrouwen.
- Als de aanroeper `command`, `rawCommand`, `cwd`, `agentId` of `sessionKey` wijzigt nadat het goedkeuringsverzoek is gemaakt, weigert de gateway de doorgestuurde uitvoering als een goedkeuringsmismatch.

## Systeemgebeurtenissen

De exec-levenscyclus wordt weergegeven als systeemberichten:

- `Exec running` (alleen als de opdracht de drempel voor een lopende melding overschrijdt).
- `Exec finished`.

Deze worden in de sessie van de agent geplaatst nadat de node de gebeurtenis rapporteert.
Geweigerde exec-goedkeuringen zijn terminaal voor de hostopdracht zelf: de opdracht
wordt niet uitgevoerd. Voor asynchrone goedkeuringen van de hoofdagent met een oorspronkelijke sessie
plaatst OpenClaw de weigering terug in die sessie als een interne follow-up, zodat de
agent kan stoppen met wachten op de asynchrone opdracht en een reparatie voor een ontbrekend resultaat kan vermijden.
Als er geen sessie is of de sessie niet kan worden hervat, kan OpenClaw nog steeds
een beknopte weigering rapporteren aan de operator of directe chatroute. Weigeringen voor
subagentsessies worden niet teruggeplaatst in de subagent.
Exec-goedkeuringen op Gateway-host zenden dezelfde levenscyclusgebeurtenissen uit wanneer de
opdracht voltooid is (en optioneel wanneer deze langer draait dan de drempel).
Execs met goedkeuringspoort hergebruiken de goedkeurings-id als de `runId` in deze
berichten voor eenvoudige correlatie.

## Gedrag bij geweigerde goedkeuring

Wanneer een asynchrone exec-goedkeuring wordt geweigerd, behandelt OpenClaw de hostopdracht als
terminaal en fail-closed. Voor hoofdagentsessies wordt de weigering geleverd als een
interne sessie-follow-up die de agent vertelt dat de asynchrone opdracht niet is uitgevoerd.
Dat behoudt transcriptcontinuïteit zonder verouderde opdrachtuitvoer bloot te stellen. Als
sessielevering niet beschikbaar is, valt OpenClaw terug op een beknopte operator- of
directe-chatweigering wanneer er een veilige route bestaat.

## Implicaties

- **`full`** is krachtig; geef waar mogelijk de voorkeur aan allowlists.
- **`ask`** houdt je betrokken terwijl snelle goedkeuringen nog steeds mogelijk zijn.
- Per-agent-allowlists voorkomen dat goedkeuringen van één agent naar andere agents lekken.
- Goedkeuringen zijn alleen van toepassing op host-exec-verzoeken van **geautoriseerde afzenders**. Ongeautoriseerde afzenders kunnen geen `/exec` uitvoeren.
- `/exec security=full` is een gemak op sessieniveau voor geautoriseerde operators en slaat goedkeuringen bewust over. Stel goedkeuringsbeveiliging in op `deny` of weiger de `exec`-tool via toolbeleid om host-exec hard te blokkeren.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/nl/tools/exec-approvals-advanced" icon="gear">
    Veilige bins, interpreterbinding en goedkeuring doorsturen naar chat.
  </Card>
  <Card title="Exec tool" href="/nl/tools/exec" icon="terminal">
    Tool voor het uitvoeren van shell-opdrachten.
  </Card>
  <Card title="Elevated mode" href="/nl/tools/elevated" icon="shield-exclamation">
    Noodpad dat ook goedkeuringen overslaat.
  </Card>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing" icon="box">
    Sandboxmodi en toegang tot werkruimten.
  </Card>
  <Card title="Security" href="/nl/gateway/security" icon="lock">
    Beveiligingsmodel en hardening.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wanneer je welke controle gebruikt.
  </Card>
  <Card title="Skills" href="/nl/tools/skills" icon="sparkles">
    Automatisch toestaan op basis van Skills.
  </Card>
</CardGroup>
