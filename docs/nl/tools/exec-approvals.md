---
read_when:
    - Exec-goedkeuringen of toelatingslijsten configureren
    - Exec-goedkeurings-UX implementeren in de macOS-app
    - Sandbox-ontsnappingsprompts en hun implicaties beoordelen
sidebarTitle: Exec approvals
summary: 'Host-exec-goedkeuringen: beleidsinstellingen, allowlists en de YOLO/strict-workflow'
title: Uitvoeringsgoedkeuringen
x-i18n:
    generated_at: "2026-05-06T09:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-goedkeuringen zijn de **companion-app / Node-host-vangrail** om
een gesandboxte agent opdrachten op een echte host (`gateway` of `node`) te laten uitvoeren. Een
veiligheidsvergrendeling: opdrachten zijn alleen toegestaan wanneer beleid + allowlist +
(optionele) gebruikersgoedkeuring allemaal overeenkomen. Exec-goedkeuringen worden **boven op**
toolbeleid en verhoogde gating gestapeld (tenzij verhoogd is ingesteld op `full`, wat
goedkeuringen overslaat).

<Note>
Effectief beleid is het **strengere** van `tools.exec.*` en de standaardwaarden voor goedkeuringen;
als een goedkeuringsveld is weggelaten, wordt de waarde van `tools.exec`
gebruikt. Host-exec gebruikt ook de lokale goedkeuringsstatus op die machine - een
host-lokale `ask: "always"` in `~/.openclaw/exec-approvals.json` blijft
prompts tonen, zelfs als sessie- of configuratiestandaarden `ask: "on-miss"` vragen.
</Note>

## Het effectieve beleid inspecteren

| Opdracht                                                         | Wat het toont                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Aangevraagd beleid, hostbeleidsbronnen en het effectieve resultaat.                    |
| `openclaw exec-policy show`                                      | Samengevoegde weergave van de lokale machine.                                          |
| `openclaw exec-policy set` / `preset`                            | Synchroniseer het lokale aangevraagde beleid in één stap met het lokale hostgoedkeuringsbestand. |

Wanneer een lokaal bereik `host=node` aanvraagt, meldt `exec-policy show` dat
bereik tijdens runtime als Node-beheerd in plaats van te doen alsof het lokale
goedkeuringsbestand de bron van waarheid is.

Als de UI van de companion-app **niet beschikbaar** is, wordt elk verzoek dat
normaal een prompt zou tonen opgelost via de **ask-fallback** (standaard: `deny`).

<Tip>
Native chatgoedkeuringsclients kunnen kanaalspecifieke mogelijkheden vooraf invullen op het
wachtende goedkeuringsbericht. Matrix voegt bijvoorbeeld reactieselecties toe
(`✅` eenmalig toestaan, `❌` weigeren, `♾️` altijd toestaan), terwijl
`/approve ...`-opdrachten in het bericht beschikbaar blijven als fallback.
</Tip>

## Waar het van toepassing is

Exec-goedkeuringen worden lokaal afgedwongen op de uitvoeringshost:

- **Gateway-host** → `openclaw`-proces op de gatewaymachine.
- **Node-host** → Node-runner (macOS companion-app of headless Node-host).

### Vertrouwensmodel

- Gateway-geauthenticeerde aanroepers zijn vertrouwde operators voor die Gateway.
- Gekoppelde nodes breiden die vertrouwde operatorcapaciteit uit naar de Node-host.
- Exec-goedkeuringen verminderen het risico op onbedoelde uitvoering, maar zijn **geen** authenticatiegrens per gebruiker.
- Goedgekeurde Node-host-runs binden canonieke uitvoeringscontext: canonieke cwd, exacte argv, env-binding wanneer aanwezig en vastgezette uitvoerbare pad wanneer van toepassing.
- Voor shellscripts en directe bestandsaanroepen van interpreters/runtimes probeert OpenClaw ook één concreet lokaal bestandsoperand te binden. Als dat gebonden bestand na goedkeuring maar vóór uitvoering verandert, wordt de run geweigerd in plaats van verschoven inhoud uit te voeren.
- Bestandsbinding is bewust best-effort, **geen** volledig semantisch model van elk interpreter-/runtime-loaderpad. Als de goedkeuringsmodus niet precies één concreet lokaal bestand kan identificeren om te binden, weigert deze een door goedkeuring ondersteunde run te maken in plaats van volledige dekking te suggereren.

### macOS-splitsing

- De **Node-hostservice** stuurt `system.run` door naar de **macOS-app** via lokale IPC.
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
  - `full` - sta alles toe (equivalent aan verhoogd).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - toon nooit een prompt.
  - `on-miss` - toon alleen een prompt wanneer de allowlist niet overeenkomt.
  - `always` - toon bij elke opdracht een prompt. Duurzaam vertrouwen via `allow-always` onderdrukt prompts **niet** wanneer de effectieve ask-modus `always` is.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Oplossing wanneer een prompt vereist is maar er geen UI bereikbaar is.

- `deny` - blokkeer.
- `allowlist` - sta alleen toe als de allowlist overeenkomt.
- `full` - sta toe.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wanneer `true`, behandelt OpenClaw inline code-eval-vormen als alleen via goedkeuring,
  zelfs als de interpreterbinary zelf op de allowlist staat. Defense-in-depth
  voor interpreterloaders die niet netjes naar één stabiel bestandsoperand
  te herleiden zijn.
</ParamField>

Voorbeelden die de strikte modus afvangt:

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

Als je host-exec zonder goedkeuringsprompts wilt laten uitvoeren, moet je
**beide** beleidslagen openen - aangevraagd exec-beleid in OpenClaw-configuratie
(`tools.exec.*`) **en** host-lokaal goedkeuringsbeleid in
`~/.openclaw/exec-approvals.json`.

YOLO is het standaard hostgedrag tenzij je het expliciet aanscherpt:

| Laag                  | YOLO-instelling           |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` op `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Belangrijke verschillen:**

- `tools.exec.host=auto` kiest **waar** exec wordt uitgevoerd: sandbox wanneer beschikbaar, anders Gateway.
- YOLO kiest **hoe** host-exec wordt goedgekeurd: `security=full` plus `ask=off`.
- In YOLO-modus voegt OpenClaw **geen** afzonderlijke heuristische goedkeuringsgate voor opdrachtverhulling of script-preflight-weigeringslaag toe boven op het geconfigureerde host-exec-beleid.
- `auto` maakt Gateway-routering geen vrije override vanuit een gesandboxte sessie. Een per-call `host=node`-verzoek is toegestaan vanuit `auto`; `host=gateway` is alleen toegestaan vanuit `auto` wanneer er geen sandboxruntime actief is. Stel voor een stabiele niet-auto-standaard `tools.exec.host` in of gebruik expliciet `/exec host=...`.

</Warning>

CLI-ondersteunde providers die hun eigen niet-interactieve toestemmingsmodus aanbieden
kunnen dit beleid volgen. Claude CLI voegt
`--permission-mode bypassPermissions` toe wanneer OpenClaw's aangevraagde exec-beleid
YOLO is. Overschrijf dat backendgedrag met expliciete Claude-argumenten
onder `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
bijvoorbeeld `--permission-mode default`, `acceptEdits` of
`bypassPermissions`.

Als je een conservatievere setup wilt, zet een van beide lagen terug naar
`allowlist` / `on-miss` of `deny`.

### Persistente Gateway-host-setup "nooit prompten"

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
- Lokale standaardwaarden in `~/.openclaw/exec-approvals.json`.

Dit is bewust alleen lokaal. Gebruik `openclaw approvals set --gateway` of
`openclaw approvals set --node <id|name|ip>` om Gateway-host- of Node-host-
goedkeuringen op afstand te wijzigen.

### Node-host

Pas voor een Node-host hetzelfde goedkeuringsbestand toe op die Node:

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

- `openclaw exec-policy` synchroniseert geen Node-goedkeuringen.
- `openclaw exec-policy set --host node` wordt geweigerd.
- Node-exec-goedkeuringen worden tijdens runtime opgehaald van de Node, dus Node-gerichte updates moeten `openclaw approvals --node ...` gebruiken.

</Note>

### Alleen-sessie-snelkoppeling

- `/exec security=full ask=off` wijzigt alleen de huidige sessie.
- `/elevated full` is een noodsnelkoppeling die ook exec-goedkeuringen voor die sessie overslaat.

Als het hostgoedkeuringsbestand strenger blijft dan de configuratie, wint het strengere
hostbeleid nog steeds.

## Allowlist (per agent)

Allowlists zijn **per agent**. Als er meerdere agents bestaan, wissel dan in de macOS-app welke agent
je bewerkt. Patronen zijn glob-overeenkomsten.

Patronen kunnen opgeloste binarypad-globs of kale opdrachtnaam-globs zijn.
Kale namen matchen alleen opdrachten die via `PATH` worden aangeroepen, dus `rg` kan overeenkomen met
`/opt/homebrew/bin/rg` wanneer de opdracht `rg` is, maar **niet** met `./rg` of
`/tmp/rg`. Gebruik een pad-glob wanneer je één specifieke binarylocatie wilt vertrouwen.

Legacy `agents.default`-vermeldingen worden bij het laden gemigreerd naar `agents.main`.
Shellketens zoals `echo ok && pwd` moeten nog steeds elk top-level segment
aan de allowlist-regels laten voldoen.

Voorbeelden:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumenten beperken met argPattern

Voeg `argPattern` toe wanneer een allowlist-vermelding moet overeenkomen met een binary en een
specifieke argumentvorm. OpenClaw evalueert de reguliere expressie
tegen de geparsete opdrachtargumenten, exclusief de executable-token
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

Die vermelding staat `python3 safe.py` toe; `python3 other.py` is een allowlist-
misser. Als er ook een alleen-pad-vermelding voor dezelfde binary aanwezig is, kunnen niet-overeenkomende
argumenten nog steeds terugvallen op die alleen-pad-vermelding. Laat de alleen-pad-
vermelding weg wanneer het doel is de binary tot de gedeclareerde argumenten te beperken.

Vermeldingen die door goedkeuringsflows zijn opgeslagen, kunnen een interne scheidingstekensindeling gebruiken voor
exacte argv-matching. Gebruik bij voorkeur de UI of goedkeuringsflow om die
vermeldingen opnieuw te genereren in plaats van de gecodeerde waarde handmatig te bewerken. Als OpenClaw
argv voor een opdrachtsegment niet kan parsen, komen vermeldingen met `argPattern` niet overeen.

Elke allowlist-vermelding ondersteunt:

| Veld               | Betekenis                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Opgeloste glob voor binair pad of kale opdrachtnaam           |
| `argPattern`       | Optionele argv-regex; weggelaten vermeldingen zijn alleen-pad |
| `id`               | Stabiele UUID die wordt gebruikt voor UI-identiteit           |
| `source`           | Bron van de vermelding, zoals `allow-always`                  |
| `commandText`      | Opdrachttekst vastgelegd toen een goedkeuringsflow de vermelding maakte |
| `lastUsedAt`       | Tijdstempel van laatste gebruik                              |
| `lastUsedCommand`  | Laatste opdracht die overeenkwam                              |
| `lastResolvedPath` | Laatst opgeloste binaire pad                                  |

## CLI's voor Skills automatisch toestaan

Wanneer **CLI's voor Skills automatisch toestaan** is ingeschakeld, worden uitvoerbare bestanden waarnaar
bekende Skills verwijzen behandeld als toegestaan op Nodes (macOS-Node of headless
Node-host). Dit gebruikt `skills.bins` via de Gateway-RPC om de
lijst met Skill-binaries op te halen. Schakel dit uit als je strikte handmatige toestemmingslijsten wilt.

<Warning>
- Dit is een **impliciete gemakstoestemmingslijst**, los van handmatige vermeldingen in toestemmingslijsten voor paden.
- Dit is bedoeld voor vertrouwde operatoromgevingen waar Gateway en Node binnen dezelfde vertrouwensgrens vallen.
- Als je strikte expliciete vertrouwensverlening vereist, houd `autoAllowSkills: false` aan en gebruik alleen handmatige vermeldingen in toestemmingslijsten voor paden.

</Warning>

## Veilige binaries en goedkeuringen doorsturen

Voor veilige binaries (het snelle pad alleen via stdin), details over interpreterbinding en
hoe je goedkeuringsprompts doorstuurt naar Slack/Discord/Telegram (of ze uitvoert als
native goedkeuringsclients), zie
[Geavanceerde exec-goedkeuringen](/nl/tools/exec-approvals-advanced).

## Bewerken in de Control UI

Gebruik de kaart **Control UI → Nodes → Exec approvals** om standaardinstellingen,
overschrijvingen per agent en toestemmingslijsten te bewerken. Kies een scope (Defaults of een agent),
pas het beleid aan, voeg toestemmingslijstpatronen toe of verwijder ze, en kies daarna **Save**. De UI
toont metadata van laatste gebruik per patroon, zodat je de lijst netjes kunt houden.

De doelkiezer kiest **Gateway** (lokale goedkeuringen) of een **Node**.
Nodes moeten `system.execApprovals.get/set` adverteren (macOS-app of
headless Node-host). Als een Node exec-goedkeuringen nog niet adverteert,
bewerk dan rechtstreeks de lokale `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` ondersteunt bewerken van Gateway of Node - zie
[Approvals-CLI](/nl/cli/approvals).

## Goedkeuringsflow

Wanneer een prompt vereist is, zendt de Gateway
`exec.approval.requested` uit naar operatorclients. De Control UI en macOS-
app handelen dit af via `exec.approval.resolve`, waarna de Gateway het
goedgekeurde verzoek doorstuurt naar de Node-host.

Voor `host=node` bevatten goedkeuringsverzoeken een canonieke `systemRunPlan`-
payload. De Gateway gebruikt dat plan als de gezaghebbende
context voor opdracht/cwd/sessie bij het doorsturen van goedgekeurde `system.run`-
verzoeken.

Dat is van belang voor asynchrone goedkeuringslatentie:

- Het Node-exec-pad bereidt vooraf één canoniek plan voor.
- De goedkeuringsrecord bewaart dat plan en de bijbehorende bindingsmetadata.
- Na goedkeuring hergebruikt de uiteindelijke doorgestuurde `system.run`-aanroep het opgeslagen plan in plaats van latere bewerkingen door de aanroeper te vertrouwen.
- Als de aanroeper `command`, `rawCommand`, `cwd`, `agentId` of `sessionKey` wijzigt nadat het goedkeuringsverzoek is gemaakt, wijst de Gateway de doorgestuurde run af als een goedkeuringsmismatch.

## Systeemevents

De exec-levenscyclus wordt weergegeven als systeemberichten:

- `Exec running` (alleen als de opdracht de drempel voor de melding dat deze actief is overschrijdt).
- `Exec finished`.
- `Exec denied`.

Deze worden in de sessie van de agent geplaatst nadat de Node de event meldt.
Exec-goedkeuringen via de Gateway-host geven dezelfde levenscyclusevents af wanneer de
opdracht voltooid is (en optioneel wanneer deze langer actief is dan de drempel).
Execs met goedkeuringspoort hergebruiken de goedkeurings-id als de `runId` in deze
berichten voor eenvoudige correlatie.

## Gedrag bij geweigerde goedkeuring

Wanneer een asynchrone exec-goedkeuring wordt geweigerd, voorkomt OpenClaw dat de agent
uitvoer hergebruikt van een eerdere run van dezelfde opdracht in de sessie.
De reden van weigering wordt doorgegeven met expliciete richtlijnen dat er geen opdrachtuitvoer
beschikbaar is, waardoor de agent niet kan beweren dat er nieuwe uitvoer is of
de geweigerde opdracht kan herhalen met verouderde resultaten van een eerdere succesvolle
run.

## Implicaties

- **`full`** is krachtig; geef waar mogelijk de voorkeur aan toestemmingslijsten.
- **`ask`** houdt je betrokken en maakt nog steeds snelle goedkeuringen mogelijk.
- Toestemmingslijsten per agent voorkomen dat goedkeuringen van één agent naar andere uitlekken.
- Goedkeuringen gelden alleen voor host-exec-verzoeken van **geautoriseerde afzenders**. Niet-geautoriseerde afzenders kunnen geen `/exec` uitgeven.
- `/exec security=full` is een gemak op sessieniveau voor geautoriseerde operators en slaat goedkeuringen bewust over. Om host-exec hard te blokkeren, stel je goedkeuringsbeveiliging in op `deny` of weiger je de tool `exec` via toolbeleid.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/nl/tools/exec-approvals-advanced" icon="gear">
    Veilige binaries, interpreterbinding en goedkeuringen doorsturen naar chat.
  </Card>
  <Card title="Exec tool" href="/nl/tools/exec" icon="terminal">
    Tool voor uitvoering van shellopdrachten.
  </Card>
  <Card title="Elevated mode" href="/nl/tools/elevated" icon="shield-exclamation">
    Noodpad dat ook goedkeuringen overslaat.
  </Card>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing" icon="box">
    Sandboxmodi en werkruimtetoegang.
  </Card>
  <Card title="Security" href="/nl/gateway/security" icon="lock">
    Beveiligingsmodel en hardening.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wanneer je welke controle gebruikt.
  </Card>
  <Card title="Skills" href="/nl/tools/skills" icon="sparkles">
    Gedrag voor automatisch toestaan op basis van Skills.
  </Card>
</CardGroup>
