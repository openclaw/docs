---
read_when:
    - Exec-goedkeuringen of toelatingslijsten configureren
    - Implementatie van de gebruikerservaring voor uitvoeringsgoedkeuring in de macOS-app
    - Sandbox-escape-prompts en de implicaties ervan beoordelen
sidebarTitle: Exec approvals
summary: 'Goedkeuringen voor uitvoering op de host: beleidsinstellingen, toelatingslijsten en de YOLO/strikte workflow'
title: Exec-goedkeuringen
x-i18n:
    generated_at: "2026-07-12T09:22:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Uitvoeringsgoedkeuringen vormen de **beveiligingsmaatregel van de begeleidende app / node-host** waarmee een agent in een sandbox opdrachten op een echte host (`gateway` of `node`) kan uitvoeren. Opdrachten worden alleen uitgevoerd wanneer beleid + toelatingslijst + (optionele) gebruikersgoedkeuring allemaal overeenstemmen. Goedkeuringen komen **boven op** het toolbeleid en de verhoogde toegangscontrole (verhoogd `full` slaat ze over).

Zie [Machtigingsmodi](/nl/tools/permission-modes) voor een modusgericht overzicht van `deny`, `allowlist`, `ask`, `auto`, `full`, de Codex Guardian-toewijzing en ACPX-harnasmachtigingen.

<Note>
Het effectieve beleid is het **strengste** van `tools.exec.*` en de standaardwaarden voor goedkeuringen: goedkeuringen kunnen de uit configuratie afgeleide beveiliging/vraaginstelling alleen aanscherpen en nooit versoepelen. Als een goedkeuringsveld wordt weggelaten, wordt de waarde van `tools.exec` gebruikt. Hostuitvoering gebruikt ook de lokale goedkeuringsstatus op die machine: een hostlokale `ask: "always"` in het goedkeuringsbestand van de uitvoeringshost blijft om bevestiging vragen, zelfs als de sessie- of configuratiestandaarden om `ask: "on-miss"` vragen.
</Note>

## Waar dit van toepassing is

Uitvoeringsgoedkeuringen worden lokaal afgedwongen op de uitvoeringshost:

- **Gateway-host** -> `openclaw`-proces op de Gateway-machine.
- **Node-host** -> node-runner (begeleidende macOS-app of headless node-host).

### Vertrouwensmodel

- Door de Gateway geverifieerde aanroepers zijn vertrouwde operators voor die Gateway.
- Gekoppelde nodes breiden die vertrouwde operatormogelijkheid uit naar de node-host.
- Goedkeuringen verminderen het risico op onbedoelde uitvoering, maar vormen **geen** verificatiegrens per gebruiker of alleen-lezenbeleid voor het bestandssysteem.
- Na goedkeuring kan een opdracht bestanden wijzigen volgens de geselecteerde machtigingen van het host- of sandboxbestandssysteem.
- Goedgekeurde uitvoeringen op een node-host binden een canonieke uitvoeringscontext: werkmap, exacte argv, omgevingsbinding indien aanwezig en een vastgezet pad naar het uitvoerbare bestand indien van toepassing.
- Voor shellscripts en directe aanroepen van bestanden via een interpreter/runtime probeert OpenClaw ook één concreet lokaal bestandsoperand te binden. Als dat bestand na goedkeuring maar vóór uitvoering verandert, wordt de uitvoering geweigerd in plaats van gewijzigde inhoud uit te voeren.
- Bestandsbinding is gebaseerd op beste inspanning en vormt geen volledig model van elk laadpad van een interpreter/runtime. Als niet exact één concreet lokaal bestand kan worden geïdentificeerd, weigert OpenClaw een door goedkeuring ondersteunde uitvoering uit te geven in plaats van volledige dekking voor te wenden.

### Scheiding op macOS

- De **node-hostservice** stuurt `system.run` via lokale IPC door naar de **macOS-app**.
- De **macOS-app** dwingt goedkeuringen af en voert de opdracht uit binnen de UI-context.

## Het effectieve beleid inspecteren

| Opdracht                                                          | Wat deze toont                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Aangevraagd beleid, bronnen van het hostbeleid en het effectieve resultaat.            |
| `openclaw exec-policy show`                                      | Samengevoegde weergave van de lokale machine.                                          |
| `openclaw exec-policy set` / `preset`                            | Synchroniseert het lokale aangevraagde beleid in één stap met het lokale hostgoedkeuringsbestand. |

<Note>
`/exec`-overschrijvingen per sessie zijn niet inbegrepen. Voer `/exec` uit in de betreffende sessie om de huidige standaardwaarden te inspecteren. Zie [sessieoverschrijvingen](/nl/tools/exec#session-overrides-exec).
</Note>

Volledige CLI-referentie (vlaggen, JSON-uitvoer, toevoegen aan/verwijderen uit de toelatingslijst): [CLI voor goedkeuringen](/nl/cli/approvals).

Wanneer een lokaal bereik om `host=node` vraagt, rapporteert `exec-policy show` dat bereik tijdens runtime als beheerd door de node, in plaats van het lokale goedkeuringsbestand als gezaghebbende bron te behandelen.

Als de UI van de begeleidende app **niet beschikbaar** is, wordt elk verzoek dat normaal om bevestiging zou vragen afgehandeld via de **vraagterugval** (standaard: `deny`).

<Tip>
Native chatclients voor goedkeuringen kunnen kanaalspecifieke interactiemogelijkheden aan het bericht met de wachtende goedkeuring toevoegen. Matrix voegt reactiesnelkoppelingen toe (`✅` eenmaal toestaan, `♾️` altijd toestaan, `❌` weigeren), terwijl `/approve ...` als terugvaloptie in het bericht blijft staan.
</Tip>

## Instellingen en opslag

Goedkeuringen bevinden zich in een lokaal JSON-bestand op de uitvoeringshost. Wanneer `OPENCLAW_STATE_DIR` is ingesteld, volgt het bestand die statusmap; anders wordt de standaardstatusmap van OpenClaw gebruikt:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# anders
~/.openclaw/exec-approvals.json
```

De standaardgoedkeuringssocket volgt dezelfde hoofdmap:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, of
`~/.openclaw/exec-approvals.sock` wanneer de variabele niet is ingesteld.

Releases vóór 2026.6.6 bewaarden het bestand altijd in `~/.openclaw`. Als `OPENCLAW_STATE_DIR` naar een andere locatie verwijst en er nog een goedkeuringsbestand in de standaardmap bestaat, voer dan eenmaal rechtstreeks `openclaw doctor --fix` uit om het naar de statusmap te importeren (het origineel wordt gearchiveerd met het achtervoegsel `.migrated`). De interactieve doctor kan de import ook vooraf tonen en laten bevestigen. Geautomatiseerde hersteluitvoeringen voor updates en Gateway-bewaking importeren nooit tussen statusmappen: een tijdelijke statusmap of statusmap voor voorbereiding mag de goedkeuringen van de standaardinstallatie niet overnemen. Dezelfde grens geldt voor het importeren van verouderde `plugin-binding-approvals.json`-bestanden naar de gedeelde SQLite-status.

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Beleidsinstellingen

### `tools.exec.mode`

`tools.exec.mode` is het aanbevolen genormaliseerde beleidsoppervlak voor hostuitvoering:

| Waarde      | Gedrag                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Blokkeert hostuitvoering.                                                                                                                                                                         |
| `allowlist` | Voert alleen opdrachten op de toelatingslijst uit zonder om bevestiging te vragen.                                                                                                                |
| `ask`       | Gebruikt het toelatingslijstbeleid en vraagt om bevestiging bij ontbrekende overeenkomsten.                                                                                                       |
| `auto`      | Gebruikt het toelatingslijstbeleid, voert deterministische overeenkomsten rechtstreeks uit en stuurt ontbrekende goedkeuringen via de native automatische beoordelaar van OpenClaw voordat op menselijke goedkeuring wordt teruggevallen. |
| `full`      | Voert opdrachten op de host uit zonder goedkeuringsvragen.                                                                                                                                        |

De verouderde instellingen `tools.exec.security` / `tools.exec.ask` blijven ondersteund en zijn nog steeds van toepassing wanneer `mode` binnen dat bereik niet is ingesteld.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blokkeert alle aanvragen voor hostuitvoering.
  - `allowlist` - staat alleen opdrachten op de toelatingslijst toe.
  - `full` - staat alles toe (gelijkwaardig aan verhoogde toegang).

De standaardwaarde is `full` voor Gateway-/node-hosts; een `sandbox`-host gebruikt in plaats daarvan standaard `deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Geconfigureerd vraagbeleid voor hostuitvoering. Bepaalt het basisgedrag van
  goedkeuringsvragen vanuit `tools.exec.ask` en de standaardwaarden voor
  hostgoedkeuringen. De standaardwaarde is `off`. De toolparameter `ask` per
  aanroep (zie [Uitvoeringstool](/nl/tools/exec#parameters)) kan die basis alleen
  aanscherpen, en modelaanroepen vanuit kanalen negeren deze wanneer de
  effectieve hostvraaginstelling `off` is.

- `off` - vraagt nooit om bevestiging.
- `on-miss` - vraagt alleen om bevestiging wanneer de toelatingslijst niet overeenkomt.
- `always` - vraagt bij elke opdracht om bevestiging. Duurzaam vertrouwen via `allow-always` onderdrukt vragen **niet** wanneer de effectieve vraagmodus `always` is.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Afhandeling wanneer een vraag vereist is maar geen UI bereikbaar is (of de
  vraag verloopt). Gebruikt standaard `deny` wanneer deze instelling wordt
  weggelaten.

- `deny` - blokkeert.
- `allowlist` - staat alleen toe als de toelatingslijst overeenkomt.
- `full` - staat toe.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wanneer `true`, worden vormen voor inline code-evaluatie behandeld als
  uitsluitend via goedkeuring toegestaan, zelfs als het uitvoerbare bestand
  van de interpreter zelf op de toelatingslijst staat. Dit biedt gelaagde
  beveiliging voor interpreterladers die niet eenduidig aan één stabiel
  bestandsoperand kunnen worden gekoppeld.
</ParamField>

Voorbeelden die door de strikte modus worden onderschept: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (evenals inlinevormen van `awk`,
`sed`, `make`, `find -exec` en `xargs`).

In de strikte modus vereisen deze opdrachten beoordeling of expliciete goedkeuring. Met
`tools.exec.mode: "auto"` kan de beoordelaar één uitvoering met laag risico toestaan wanneer
de opdracht een afdwingbaar plan heeft; anders vraagt OpenClaw een mens om goedkeuring.
Opdrachtgoedkeuringen van `Codex app-server` die bij de terugval naar de beoordelaar terechtkomen, vragen
een mens om goedkeuring omdat hun goedkeuringsverzoeken geen afdwingbaar opgelost
uitvoerbaar bestand beschikbaar stellen.
`allow-always` slaat geen nieuwe vermeldingen in de toelatingslijst op voor opdrachten met inline-evaluatie.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Alleen voor presentatie: wanneer ingeschakeld kan OpenClaw door de parser
  afgeleide opdrachtbereiken toevoegen, zodat webgoedkeuringsvragen
  opdrachttokens kunnen markeren. Dit verandert **niet** de werking van
  `security`, `ask`, overeenkomsten met de toelatingslijst, strikte
  inline-evaluatie, het doorsturen van goedkeuringen of de uitvoering van
  opdrachten.
</ParamField>

Stel dit globaal in onder `tools.exec.commandHighlighting` of per agent onder
`agents.list[].tools.exec.commandHighlighting`.

## YOLO-modus (zonder goedkeuring)

Om opdrachten op de host uit te voeren zonder goedkeuringsvragen, opent u **beide** beleidslagen:
het aangevraagde uitvoeringsbeleid in de OpenClaw-configuratie (`tools.exec.*`) **en**
het hostlokale goedkeuringsbeleid in het goedkeuringsbestand van de uitvoeringshost.

Een weggelaten `askFallback` gebruikt standaard `deny`. Stel `askFallback` op de host
expliciet in op `full` wanneer een goedkeuringsvraag zonder UI moet terugvallen op toestaan.

| Laag                  | YOLO-instelling            |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` op `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host-`askFallback`    | `full`                     |

<Warning>
**Belangrijke verschillen:**

- `tools.exec.host=auto` kiest **waar** uitvoering plaatsvindt: in de sandbox wanneer beschikbaar, anders op de Gateway.
- YOLO kiest **hoe** hostuitvoering wordt goedgekeurd: `security=full` plus `ask=off`.
- YOLO voegt **geen** afzonderlijke heuristische goedkeuringscontrole voor verhulde opdrachten of afwijzingslaag voor voorafgaande scriptcontrole toe boven op het geconfigureerde beleid voor hostuitvoering.
- `auto` maakt routering naar de Gateway geen vrije overschrijving vanuit een sessie in een sandbox. Een aanvraag per aanroep met `host=node` is toegestaan vanuit `auto`; `host=gateway` is vanuit `auto` alleen toegestaan wanneer geen sandboxruntime actief is. Stel voor een stabiele niet-automatische standaardwaarde `tools.exec.host` in of gebruik expliciet `/exec host=...`.

</Warning>

CLI-gestuurde providers die hun eigen niet-interactieve machtigingsmodus aanbieden,
kunnen dit beleid volgen. Claude CLI voegt
`--permission-mode bypassPermissions` toe wanneer het effectieve uitvoeringsbeleid
van OpenClaw YOLO is. Voor door OpenClaw beheerde live Claude-sessies is het
effectieve uitvoeringsbeleid van OpenClaw leidend boven de eigen machtigingsmodus van Claude:
YOLO normaliseert live starts naar `--permission-mode bypassPermissions`, en
een beperkend effectief uitvoeringsbeleid normaliseert live starts naar
`--permission-mode default`, zelfs als onbewerkte Claude-backendargumenten een andere
modus opgeven.

Als je een conservatievere configuratie wilt, stel je het uitvoeringsbeleid van OpenClaw weer strenger in op
`allowlist` / `on-miss` of `deny`.

### Permanente configuratie op de Gateway-host zonder prompts

<Steps>
  <Step title="Stel het gevraagde configuratiebeleid in">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Stem het goedkeuringsbestand van de host af">
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

Werkt zowel de lokale waarden voor `tools.exec.host/security/ask` als de standaardwaarden
van het lokale goedkeuringsbestand bij (inclusief `askFallback: "full"`). Dit werkt bewust
alleen lokaal. Gebruik `openclaw approvals set --gateway` of
`openclaw approvals set --node <id|name|ip>` om goedkeuringen voor de Gateway-host
of Node-host op afstand te wijzigen.

Andere ingebouwde voorinstellingen zijn: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) en `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Pas ze op dezelfde manier toe:
`openclaw exec-policy preset cautious`.

Gebruik
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` met een willekeurige combinatie van deze vlaggen om
afzonderlijke velden in te stellen in plaats van een volledige voorinstelling.

### Node-host

Pas in plaats daarvan hetzelfde goedkeuringsbestand toe op de Node:

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
**Beperkingen van uitsluitend lokaal gebruik:**

- `openclaw exec-policy` synchroniseert geen Node-goedkeuringen.
- `openclaw exec-policy set --host node` wordt geweigerd.
- Goedkeuringen voor uitvoering op een Node worden tijdens runtime bij de Node opgehaald. Daarom moeten op een Node gerichte updates `openclaw approvals --node ...` gebruiken.

</Note>

### Snelkoppeling voor alleen de sessie

- `/exec security=full ask=off` wijzigt alleen de huidige sessie.
- `/elevated full` is een noodsnelkoppeling die uitvoeringsgoedkeuringen alleen overslaat
  wanneer zowel het gevraagde beleid als het goedkeuringsbestand van de host resulteren in
  `security: "full"` en `ask: "off"`. Een strenger hostbestand, zoals `ask:
"always"`, toont nog steeds een prompt.

Als het goedkeuringsbestand van de host strenger blijft dan de configuratie, blijft het
strengere hostbeleid leidend.

## Toelatingslijst (per agent)

Toelatingslijsten gelden **per agent**. Als er meerdere agents bestaan, wissel je in de
macOS-app van agent om te bepalen welke agent je bewerkt. Patronen worden als glob-patronen vergeleken.

Patronen kunnen glob-patronen voor opgeloste paden naar uitvoerbare bestanden zijn, of glob-patronen
met alleen een opdrachtnaam. Losse namen komen alleen overeen met opdrachten die via `PATH`
worden aangeroepen. Daardoor kan `rg` overeenkomen met `/opt/homebrew/bin/rg` wanneer de
opdracht `rg` is, maar **niet** met `./rg` of `/tmp/rg`. Gebruik een pad-glob om één
specifieke locatie van een uitvoerbaar bestand te vertrouwen.

Verouderde vermeldingen in `agents.default` worden tijdens het laden gemigreerd naar `agents.main`.
Voor shell-ketens zoals `echo ok && pwd` moet elk segment op het hoogste niveau nog steeds
aan de regels van de toelatingslijst voldoen.

Voorbeelden:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumenten beperken met argPattern

Voeg `argPattern` toe wanneer een vermelding in de toelatingslijst overeen moet komen met een
uitvoerbaar bestand en een specifieke argumentstructuur. OpenClaw gebruikt op elke host de
semantiek van reguliere ECMAScript-expressies (JavaScript) en evalueert de expressie aan de hand
van de geparseerde opdrachtargumenten, zonder het token van het uitvoerbare bestand (`argv[0]`).
Bij handmatig geschreven vermeldingen worden argumenten met één spatie samengevoegd. Veranker
het patroon daarom wanneer je een exacte overeenkomst nodig hebt.

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

Deze vermelding staat `python3 safe.py` toe; `python3 other.py` komt niet voor in de
toelatingslijst. Als er voor hetzelfde uitvoerbare bestand ook een vermelding met alleen een pad
aanwezig is, kunnen niet-overeenkomende argumenten alsnog terugvallen op die vermelding met alleen
een pad. Laat de vermelding met alleen een pad weg wanneer het doel is het uitvoerbare bestand
te beperken tot de opgegeven argumenten.

Vermeldingen die via goedkeuringsstromen worden opgeslagen, gebruiken een interne
scheidingsindeling voor exacte vergelijking van argv. Gebruik bij voorkeur de interface of
goedkeuringsstroom om deze vermeldingen opnieuw te genereren, in plaats van de gecodeerde waarde
handmatig te bewerken. Als OpenClaw argv voor een opdrachtsegment niet kan parseren, komen
vermeldingen met `argPattern` niet overeen.

Elke vermelding in de toelatingslijst ondersteunt:

| Veld               | Betekenis                                                        |
| ------------------ | ---------------------------------------------------------------- |
| `pattern`          | Glob voor opgelost pad van uitvoerbaar bestand of losse opdrachtnaam |
| `argPattern`       | Optionele ECMAScript-reguliere expressie voor argv; weglaten betekent alleen pad |
| `id`               | Stabiele ondoorzichtige ID; indien afwezig gegenereerd als UUID  |
| `source`           | Bron van de vermelding, zoals `allow-always`                     |
| `commandText`      | Verouderde invoer in platte tekst; wordt tijdens laden verwijderd |
| `lastUsedAt`       | Tijdstempel van laatste gebruik                                  |
| `lastUsedCommand`  | Laatste opdracht die overeenkwam                                 |
| `lastResolvedPath` | Laatst opgeloste pad naar uitvoerbaar bestand                    |

## CLI's van Skills automatisch toestaan

Wanneer **CLI's van Skills automatisch toestaan** (`autoAllowSkills`) is ingeschakeld, worden
uitvoerbare bestanden waarnaar bekende Skills verwijzen op Nodes behandeld alsof ze op de
toelatingslijst staan (macOS-Node of headless Node-host). Hiervoor wordt `skills.bins` via
de Gateway-RPC gebruikt om de lijst met uitvoerbare bestanden van de Skills op te halen.
Schakel dit uit als je strikt handmatige toelatingslijsten wilt.

<Warning>
- Dit is een **impliciete toelatingslijst voor gebruiksgemak**, los van handmatige vermeldingen met paden in de toelatingslijst.
- Deze is bedoeld voor vertrouwde operatoromgevingen waarin de Gateway en Node zich binnen dezelfde vertrouwensgrens bevinden.
- Als je strikt expliciet vertrouwen vereist, houd je `autoAllowSkills: false` aan en gebruik je uitsluitend handmatige vermeldingen met paden in de toelatingslijst.

</Warning>

## Veilige programma's en doorsturen van goedkeuringen

Zie
[Uitvoeringsgoedkeuringen - geavanceerd](/nl/tools/exec-approvals-advanced)
voor veilige programma's (het snelle pad dat alleen stdin gebruikt), details over het koppelen
van interpreters en informatie over het doorsturen van goedkeuringsprompts naar
Slack/Discord/Telegram (of het uitvoeren ervan als systeemeigen goedkeuringsclients).

## Bewerken via de bedieningsinterface

Gebruik de kaart **Bedieningsinterface -> Nodes -> Uitvoeringsgoedkeuringen** om standaardwaarden,
overschrijvingen per agent en toelatingslijsten te bewerken. Kies een bereik (Standaardwaarden of
een agent), pas het beleid aan, voeg patronen aan de toelatingslijst toe of verwijder ze en klik
vervolgens op **Opslaan**. De interface toont per patroon metagegevens over het laatste gebruik,
zodat je de lijst overzichtelijk kunt houden.

De doelselector kiest **Gateway** (lokale goedkeuringen) of een **Node**.
Nodes moeten `system.execApprovals.get/set` aankondigen (macOS-app of headless
Node-host). Als een Node nog geen uitvoeringsgoedkeuringen aankondigt, bewerk je het
lokale goedkeuringsbestand rechtstreeks.

Sommige Node-hosts, waaronder de Windows-companion, gebruiken een andere indeling
voor het goedkeuringsbeleid. De bedieningsinterface toont dit systeemeigen hostbeleid
als alleen-lezen. Gebruik de companion-app of `openclaw approvals set --node
<id|name|ip>` met de systeemeigen beleidsstructuur om het te bewerken; zie
[CLI voor goedkeuringen](/nl/cli/approvals).

CLI: `openclaw approvals` ondersteunt het bewerken van de Gateway of een Node; zie
[CLI voor goedkeuringen](/nl/cli/approvals).

## Goedkeuringsstroom

Wanneer een prompt vereist is, zendt de Gateway `exec.approval.requested` uit naar
operatorclients. De bedieningsinterface en macOS-app handelen deze af via
`exec.approval.resolve`, waarna de Gateway het goedgekeurde verzoek doorstuurt naar
de Node-host.

Voor `host=node` bevatten goedkeuringsverzoeken een canonieke `systemRunPlan`-payload.
De Gateway gebruikt dat plan als de leidende context voor opdracht/cwd/sessie bij het
doorsturen van goedgekeurde `system.run`-verzoeken:

- Het uitvoeringspad van de Node stelt vooraf één canoniek plan op.
- De goedkeuringsregistratie slaat dat plan en de bijbehorende koppelingsmetagegevens op.
- Na goedkeuring hergebruikt de uiteindelijke doorgestuurde `system.run`-aanroep het opgeslagen plan, in plaats van latere wijzigingen door de aanroeper te vertrouwen.
- Als de aanroeper `command`, `rawCommand`, `cwd`, `agentId` of `sessionKey` wijzigt nadat het goedkeuringsverzoek is aangemaakt, weigert de Gateway de doorgestuurde uitvoering wegens een niet-overeenkomende goedkeuring.

## Systeemgebeurtenissen en weigeringen

Na melding van voltooiing door de Node plaatst de uitvoeringslevenscyclus een
systeembericht `Exec finished` in de sessie van de agent. OpenClaw kan ook een melding
over een lopende uitvoering versturen nadat een goedkeuring is verleend en
`tools.exec.approvalRunningNoticeMs` is verstreken (standaard `10000`; `0` schakelt
dit uit). Geweigerde uitvoeringsgoedkeuringen zijn definitief voor de hostopdracht:
de opdracht wordt niet uitgevoerd.

- Voor asynchrone goedkeuringen van de hoofd-agent met een oorspronkelijke sessie plaatst
  OpenClaw de weigering als interne opvolging terug in die sessie, zodat de agent kan stoppen
  met wachten op de asynchrone opdracht en geen herstel wegens een ontbrekend resultaat nodig is.
- Als er geen sessie is of de sessie niet kan worden hervat, kan OpenClaw nog steeds een
  beknopte weigering melden aan de operator of via de directe chatroute.
- Weigeringen voor subagent- en Cron-sessies worden niet teruggeplaatst in die sessie.

Uitvoeringsgoedkeuringen op de Gateway-host produceren dezelfde gebeurtenis voor de
voltooiingslevenscyclus. Uitvoeringen waarvoor goedkeuring vereist is, hergebruiken de
goedkeurings-ID om het openstaande verzoek te koppelen aan het voltooiings- of
weigeringsbericht (`Exec finished (gateway id=...)` / `Exec denied (gateway id=...)`).

## Gevolgen

- **`full`** is krachtig; geef waar mogelijk de voorkeur aan toelatingslijsten.
- **`ask`** houdt je op de hoogte en maakt snelle goedkeuringen toch mogelijk.
- Toelatingslijsten per agent voorkomen dat goedkeuringen van de ene agent doorwerken naar andere agents.
- Goedkeuringen gelden alleen voor uitvoeringsverzoeken op de host van **geautoriseerde afzenders**. Niet-geautoriseerde afzenders kunnen `/exec` niet uitvoeren.
- `/exec security=full` is een voorziening op sessieniveau voor geautoriseerde operators en slaat goedkeuringen bewust over. Stel de goedkeuringsbeveiliging in op `deny` of weiger de tool `exec` via het toolbeleid om uitvoering op de host volledig te blokkeren.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Uitvoeringsgoedkeuringen - geavanceerd" href="/nl/tools/exec-approvals-advanced" icon="gear">
    Veilige programma's, interpreterkoppeling en het doorsturen van goedkeuringen naar chat.
  </Card>
  <Card title="Uitvoeringstool" href="/nl/tools/exec" icon="terminal">
    Tool voor het uitvoeren van shell-opdrachten.
  </Card>
  <Card title="Verhoogde modus" href="/nl/tools/elevated" icon="shield-exclamation">
    Noodpad dat ook goedkeuringen overslaat.
  </Card>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing" icon="box">
    Sandboxmodi en toegang tot de werkruimte.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security" icon="lock">
    Beveiligingsmodel en versterking.
  </Card>
  <Card title="Sandbox versus toolbeleid versus verhoogde modus" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wanneer je elk bedieningselement gebruikt.
  </Card>
  <Card title="Skills" href="/nl/tools/skills" icon="sparkles">
    Automatisch toestaan op basis van Skills.
  </Card>
</CardGroup>
