---
read_when:
    - Exec-goedkeuringen of toestaanlijsten configureren
    - Exec-goedkeurings-UX implementeren in de macOS-app
    - Sandbox-escape-prompts en hun implicaties beoordelen
sidebarTitle: Exec approvals
summary: 'Host-exec-goedkeuringen: beleidsinstellingen, allowlists en de YOLO/strikte workflow'
title: Uitvoeringsgoedkeuringen
x-i18n:
    generated_at: "2026-04-29T23:23:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Uitvoergoedkeuringen zijn de **vangrail van de companion app / nodehost** om
een gesandboxte agent opdrachten op een echte host (`gateway` of `node`) te laten uitvoeren. Een
veiligheidsvergrendeling: opdrachten zijn alleen toegestaan wanneer beleid + allowlist +
(optionele) gebruikersgoedkeuring allemaal overeenstemmen. Uitvoergoedkeuringen worden **boven op**
toolbeleid en verhoogde gating gestapeld (tenzij verhoogd is ingesteld op `full`, waarmee
goedkeuringen worden overgeslagen).

<Note>
Effectief beleid is de **strengere** van `tools.exec.*` en de standaardinstellingen voor goedkeuringen;
als een goedkeuringsveld wordt weggelaten, wordt de waarde van `tools.exec`
gebruikt. Hostuitvoering gebruikt ook de lokale goedkeuringsstatus op die machine — een
hostlokale `ask: "always"` in `~/.openclaw/exec-approvals.json` blijft
vragen, zelfs als sessie- of configuratiestandaarden `ask: "on-miss"` aanvragen.
</Note>

## Het effectieve beleid inspecteren

| Opdracht                                                         | Wat deze toont                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Aangevraagd beleid, hostbeleidsbronnen en het effectieve resultaat.                    |
| `openclaw exec-policy show`                                      | Samengevoegde weergave van de lokale machine.                                          |
| `openclaw exec-policy set` / `preset`                            | Synchroniseer het lokaal aangevraagde beleid in één stap met het lokale hostgoedkeuringsbestand. |

Wanneer een lokaal bereik `host=node` aanvraagt, rapporteert `exec-policy show` dat
bereik tijdens runtime als nodebeheerd in plaats van te doen alsof het lokale
goedkeuringsbestand de bron van waarheid is.

Als de UI van de companion app **niet beschikbaar** is, wordt elk verzoek dat
normaal om bevestiging zou vragen opgelost door de **vraagfallback** (standaard: `deny`).

<Tip>
Native chatgoedkeuringsclients kunnen kanaalspecifieke mogelijkheden vooraf invullen in het
wachtende goedkeuringsbericht. Matrix vult bijvoorbeeld reactiesnelkoppelingen in
(`✅` eenmaal toestaan, `❌` weigeren, `♾️` altijd toestaan) terwijl
`/approve ...`-opdrachten nog steeds als fallback in het bericht blijven staan.
</Tip>

## Waar het van toepassing is

Uitvoergoedkeuringen worden lokaal afgedwongen op de uitvoeringshost:

- **Gateway-host** → `openclaw`-proces op de gateway-machine.
- **Node-host** → node-runner (macOS companion app of headless nodehost).

### Vertrouwensmodel

- Gateway-geauthenticeerde aanroepers zijn vertrouwde operators voor die Gateway.
- Gekoppelde nodes breiden die vertrouwde operatorcapaciteit uit naar de nodehost.
- Uitvoergoedkeuringen verminderen het risico op onbedoelde uitvoering, maar zijn **geen** authenticatiegrens per gebruiker.
- Goedgekeurde nodehost-runs binden canonieke uitvoeringscontext: canonieke cwd, exacte argv, env-binding wanneer aanwezig, en vastgezet pad naar uitvoerbaar bestand waar van toepassing.
- Voor shellscripts en directe interpreter-/runtimebestandaanroepen probeert OpenClaw ook één concreet lokaal bestandsoperand te binden. Als dat gebonden bestand na goedkeuring maar vóór uitvoering verandert, wordt de run geweigerd in plaats van gewijzigde inhoud uit te voeren.
- Bestandsbinding is bewust best-effort, **geen** volledig semantisch model van elk interpreter-/runtimeloaderpad. Als de goedkeuringsmodus niet precies één concreet lokaal bestand kan identificeren om te binden, weigert deze een door goedkeuring gedekte run aan te maken in plaats van volledige dekking te suggereren.

### macOS-splitsing

- De **nodehostservice** stuurt `system.run` door naar de **macOS-app** via lokale IPC.
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
  - `deny` — blokkeer alle hostuitvoerverzoeken.
  - `allowlist` — sta alleen opdrachten op de allowlist toe.
  - `full` — sta alles toe (equivalent aan verhoogd).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — vraag nooit om bevestiging.
  - `on-miss` — vraag alleen wanneer de allowlist niet overeenkomt.
  - `always` — vraag bij elke opdracht. Duurzaam vertrouwen via `allow-always` onderdrukt vragen **niet** wanneer de effectieve vraagmodus `always` is.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolutie wanneer een prompt vereist is maar geen UI bereikbaar is.

- `deny` — blokkeer.
- `allowlist` — sta alleen toe als de allowlist overeenkomt.
- `full` — sta toe.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wanneer `true`, behandelt OpenClaw inline code-eval-vormen als alleen met goedkeuring,
  zelfs als het interpreterbinaire bestand zelf op de allowlist staat. Defense-in-depth
  voor interpreterloaders die niet netjes naar één stabiel bestandsoperand
  mappen.
</ParamField>

Voorbeelden die strikte modus opvangt:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

In strikte modus hebben deze opdrachten nog steeds expliciete goedkeuring nodig, en
`allow-always` bewaart niet automatisch nieuwe allowlist-vermeldingen voor ze.

## YOLO-modus (geen goedkeuring)

Als je hostuitvoering zonder goedkeuringsprompts wilt laten draaien, moet je
**beide** beleidslagen openzetten — aangevraagd uitvoerbeleid in OpenClaw-configuratie
(`tools.exec.*`) **en** hostlokaal goedkeuringsbeleid in
`~/.openclaw/exec-approvals.json`.

YOLO is het standaard hostgedrag tenzij je het expliciet aanscherpt:

| Laag                  | YOLO-instelling           |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` op `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Belangrijke verschillen:**

- `tools.exec.host=auto` kiest **waar** uitvoering draait: sandbox wanneer beschikbaar, anders gateway.
- YOLO kiest **hoe** hostuitvoering wordt goedgekeurd: `security=full` plus `ask=off`.
- In YOLO-modus voegt OpenClaw **geen** aparte heuristische goedkeuringspoort voor opdrachtverhulling of script-preflight-weigeringslaag toe boven op het geconfigureerde hostuitvoerbeleid.
- `auto` maakt gatewayroutering geen vrije override vanuit een gesandboxte sessie. Een per-aanroepverzoek `host=node` is toegestaan vanuit `auto`; `host=gateway` is alleen toegestaan vanuit `auto` wanneer geen sandboxruntime actief is. Stel voor een stabiele niet-automatische standaardwaarde `tools.exec.host` in of gebruik expliciet `/exec host=...`.

</Warning>

CLI-ondersteunde providers die hun eigen niet-interactieve machtigingsmodus aanbieden
kunnen dit beleid volgen. Claude CLI voegt
`--permission-mode bypassPermissions` toe wanneer het door OpenClaw aangevraagde uitvoerbeleid
YOLO is. Overschrijf dat backendgedrag met expliciete Claude-argumenten
onder `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
bijvoorbeeld `--permission-mode default`, `acceptEdits` of
`bypassPermissions`.

Als je een conservatievere instelling wilt, zet dan een van beide lagen terug op
`allowlist` / `on-miss` of `deny`.

### Permanente gatewayhostconfiguratie met "nooit vragen"

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
- Lokale standaardwaarden van `~/.openclaw/exec-approvals.json`.

Deze is bewust alleen lokaal. Gebruik `openclaw approvals set --gateway` of
`openclaw approvals set --node <id|name|ip>` om goedkeuringen van de gatewayhost of nodehost
op afstand te wijzigen.

### Node-host

Pas voor een nodehost in plaats daarvan hetzelfde goedkeuringsbestand op die node toe:

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
**Beperkingen alleen lokaal:**

- `openclaw exec-policy` synchroniseert geen nodegoedkeuringen.
- `openclaw exec-policy set --host node` wordt geweigerd.
- Nodeuitvoergoedkeuringen worden tijdens runtime opgehaald van de node, dus nodegerichte updates moeten `openclaw approvals --node ...` gebruiken.

</Note>

### Snelkoppeling alleen voor de sessie

- `/exec security=full ask=off` wijzigt alleen de huidige sessie.
- `/elevated full` is een noodsnelkoppeling die ook uitvoergoedkeuringen voor die sessie overslaat.

Als het hostgoedkeuringsbestand strenger blijft dan de configuratie, wint het strengere hostbeleid
nog steeds.

## Allowlist (per agent)

Allowlists zijn **per agent**. Als er meerdere agents bestaan, wissel dan in de macOS-app welke agent
je bewerkt. Patronen zijn glob-overeenkomsten.

Patronen kunnen opgeloste binaire padglobs zijn of kale opdrachtnaamglobs.
Kale namen matchen alleen opdrachten die via `PATH` worden aangeroepen, dus `rg` kan overeenkomen met
`/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar **niet** met `./rg` of
`/tmp/rg`. Gebruik een padglob wanneer je één specifieke binaire locatie
wilt vertrouwen.

Verouderde `agents.default`-vermeldingen worden bij het laden gemigreerd naar `agents.main`.
Shellketens zoals `echo ok && pwd` moeten nog steeds elk segment op topniveau
aan de allowlist-regels laten voldoen.

Voorbeelden:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Elke allowlist-vermelding houdt bij:

| Veld               | Betekenis                         |
| ------------------ | --------------------------------- |
| `id`               | Stabiele UUID gebruikt voor UI-identiteit |
| `lastUsedAt`       | Tijdstempel van laatst gebruik    |
| `lastUsedCommand`  | Laatste opdracht die overeenkwam  |
| `lastResolvedPath` | Laatst opgeloste binaire pad      |

## Skill-CLI's automatisch toestaan

Wanneer **Skill-CLI's automatisch toestaan** is ingeschakeld, worden uitvoerbare bestanden waarnaar
bekende Skills verwijzen behandeld alsof ze op de allowlist staan op nodes (macOS-node of headless
nodehost). Dit gebruikt `skills.bins` via de Gateway-RPC om de
lijst met Skill-binaries op te halen. Schakel dit uit als je strikte handmatige allowlists wilt.

<Warning>
- Dit is een **impliciete gemaks-allowlist**, los van handmatige allowlist-vermeldingen voor paden.
- Dit is bedoeld voor vertrouwde operatoromgevingen waarin Gateway en node binnen dezelfde vertrouwensgrens vallen.
- Als je strikt expliciet vertrouwen vereist, houd `autoAllowSkills: false` aan en gebruik alleen handmatige allowlist-vermeldingen voor paden.

</Warning>

## Veilige bins en goedkeuring doorsturen

Voor veilige bins (het snelle pad alleen via stdin), details over interpreterbinding en
hoe je goedkeuringsprompts doorstuurt naar Slack/Discord/Telegram (of ze uitvoert als
native goedkeuringsclients), zie
[Uitvoergoedkeuringen — geavanceerd](/nl/tools/exec-approvals-advanced).

## Bewerken in de Control UI

Gebruik de kaart **Control UI → Nodes → Uitvoergoedkeuringen** om standaardwaarden,
per-agent-overschrijvingen en allowlists te bewerken. Kies een bereik (Standaardwaarden of een agent),
pas het beleid aan, voeg allowlist-patronen toe of verwijder ze, en kies daarna **Opslaan**. De UI
toont laatst-gebruikte metadata per patroon zodat je de lijst netjes kunt houden.

De doelkeuze selecteert **Gateway** (lokale goedkeuringen) of een **Node**.
Nodes moeten `system.execApprovals.get/set` adverteren (macOS-app of
headless Node-host). Als een node nog geen exec-goedkeuringen adverteert,
bewerk dan rechtstreeks de lokale `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` ondersteunt gateway- of nodebewerking — zie
[Approvals CLI](/nl/cli/approvals).

## Goedkeuringsflow

Wanneer een prompt vereist is, broadcast de gateway
`exec.approval.requested` naar operatorclients. De Control UI en macOS-
app lossen dit op via `exec.approval.resolve`, waarna de gateway de
goedgekeurde aanvraag doorstuurt naar de nodehost.

Voor `host=node` bevatten goedkeuringsaanvragen een canonieke `systemRunPlan`-
payload. De gateway gebruikt dat plan als de gezaghebbende
command/cwd/session-context bij het doorsturen van goedgekeurde `system.run`-
aanvragen.

Dat is belangrijk voor asynchrone goedkeuringslatentie:

- Het node-exec-pad bereidt vooraf één canoniek plan voor.
- De goedkeuringsrecord bewaart dat plan en de bijbehorende bindingsmetadata.
- Na goedkeuring hergebruikt de uiteindelijk doorgestuurde `system.run`-aanroep het opgeslagen plan in plaats van latere wijzigingen van de aanroeper te vertrouwen.
- Als de aanroeper `command`, `rawCommand`, `cwd`, `agentId` of `sessionKey` wijzigt nadat de goedkeuringsaanvraag is aangemaakt, wijst de gateway de doorgestuurde run af als een goedkeuringsmismatch.

## Systeemevents

De exec-levenscyclus wordt zichtbaar gemaakt als systeemberichten:

- `Exec running` (alleen als de opdracht de drempel voor de running-melding overschrijdt).
- `Exec finished`.
- `Exec denied`.

Deze worden naar de sessie van de agent gepost nadat de node het event meldt.
Gateway-host exec-goedkeuringen verzenden dezelfde levenscyclusevents wanneer de
opdracht eindigt (en optioneel wanneer deze langer loopt dan de drempel).
Execs met goedkeuringspoort hergebruiken de goedkeurings-id als de `runId` in deze
berichten voor eenvoudige correlatie.

## Gedrag bij geweigerde goedkeuring

Wanneer een asynchrone exec-goedkeuring wordt geweigerd, voorkomt OpenClaw dat de agent
uitvoer hergebruikt van een eerdere run van dezelfde opdracht in de sessie.
De weigeringsreden wordt meegegeven met expliciete instructie dat er geen opdrachtuitvoer
beschikbaar is, wat voorkomt dat de agent claimt dat er nieuwe uitvoer is of
de geweigerde opdracht herhaalt met verouderde resultaten van een eerdere succesvolle
run.

## Implicaties

- **`full`** is krachtig; geef waar mogelijk de voorkeur aan allowlists.
- **`ask`** houdt je betrokken en maakt toch snelle goedkeuringen mogelijk.
- Per-agent allowlists voorkomen dat goedkeuringen van de ene agent naar andere agents lekken.
- Goedkeuringen zijn alleen van toepassing op host-exec-aanvragen van **geautoriseerde afzenders**. Niet-geautoriseerde afzenders kunnen geen `/exec` uitvoeren.
- `/exec security=full` is een sessieniveau-gemak voor geautoriseerde operators en slaat goedkeuringen bewust over. Om host-exec hard te blokkeren, stel je approvals security in op `deny` of weiger je de `exec`-tool via toolbeleid.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec-goedkeuringen — geavanceerd" href="/nl/tools/exec-approvals-advanced" icon="gear">
    Veilige bins, interpreterbinding en goedkeuringsdoorsturing naar chat.
  </Card>
  <Card title="Exec-tool" href="/nl/tools/exec" icon="terminal">
    Tool voor het uitvoeren van shellopdrachten.
  </Card>
  <Card title="Verhoogde modus" href="/nl/tools/elevated" icon="shield-exclamation">
    Break-glass-pad dat ook goedkeuringen overslaat.
  </Card>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing" icon="box">
    Sandboxmodi en werkruimtetoegang.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security" icon="lock">
    Beveiligingsmodel en verharding.
  </Card>
  <Card title="Sandbox versus toolbeleid versus verhoogd" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wanneer je elke besturing gebruikt.
  </Card>
  <Card title="Skills" href="/nl/tools/skills" icon="sparkles">
    Automatisch toestaan-gedrag ondersteund door Skills.
  </Card>
</CardGroup>
