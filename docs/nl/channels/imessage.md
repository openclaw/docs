---
read_when:
    - Ondersteuning voor iMessage instellen
    - iMessage verzenden/ontvangen debuggen
summary: Native iMessage-ondersteuning via imsg (JSON-RPC via stdio), met private API-acties voor antwoorden, tapbacks, effecten, peilingen, bijlagen en groepsbeheer. Aanbevolen voor nieuwe OpenClaw iMessage-configuraties wanneer de hostvereisten passen.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:08:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Gebruik voor OpenClaw iMessage-implementaties `imsg` op een macOS Messages-host waarop is ingelogd. Als je Gateway op Linux of Windows draait, wijs `channels.imessage.cliPath` naar een SSH-wrapper die `imsg` op de Mac uitvoert.

**Inkomend herstel is automatisch.** Na een herstart van een bridge of gateway speelt iMessage de berichten opnieuw af die zijn gemist terwijl deze offline was en onderdrukt het de verouderde "backlog bomb" die Apple na een Push-herstel kan wegspoelen, met deduplicatie zodat niets twee keer wordt verzonden. Er is geen configuratie om dit in te schakelen — zie [Inkomend herstel na een herstart van een bridge of gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Ondersteuning voor BlueBubbles is verwijderd. Migreer `channels.bluebubbles`-configuraties naar `channels.imessage`; OpenClaw ondersteunt iMessage alleen via `imsg`. Begin met [Verwijdering van BlueBubbles en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) voor de korte aankondiging, of [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles) voor de volledige migratietabel.
</Warning>

Status: native externe CLI-integratie. Gateway start `imsg rpc` en communiceert via JSON-RPC over stdio (geen afzonderlijke daemon/poort). Geavanceerde acties vereisen `imsg launch` en een geslaagde private API-probe.

<CardGroup cols={3}>
  <Card title="Private API-acties" icon="wand-sparkles" href="#private-api-actions">
    Antwoorden, tapbacks, effecten, peilingen, bijlagen en groepsbeheer.
  </Card>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    iMessage-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Externe Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gebruik een SSH-wrapper wanneer de Gateway niet op de Messages-Mac draait.
  </Card>
  <Card title="Configuratiereferentie" icon="settings" href="/nl/gateway/config-channels#imessage">
    Volledige referentie voor iMessage-velden.
  </Card>
</CardGroup>

## Snelle setup

<Tabs>
  <Tab title="Lokale Mac (snel pad)">
    <Steps>
      <Step title="Installeer en verifieer imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configureer OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Keur eerste DM-koppeling goed (standaard dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Koppelingsverzoeken verlopen na 1 uur.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Externe Mac via SSH">
    OpenClaw vereist alleen een stdio-compatibele `cliPath`, dus je kunt `cliPath` laten wijzen naar een wrapperscript dat via SSH verbinding maakt met een externe Mac en `imsg` uitvoert.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Aanbevolen configuratie wanneer bijlagen zijn ingeschakeld:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Als `remoteHost` niet is ingesteld, probeert OpenClaw dit automatisch te detecteren door het SSH-wrapperscript te parsen.
    `remoteHost` moet `host` of `user@host` zijn (geen spaties of SSH-opties).
    OpenClaw gebruikt strikte host-key-controle voor SCP, dus de hostsleutel van de relayhost moet al bestaan in `~/.ssh/known_hosts`.
    Bijlagepaden worden gevalideerd tegen toegestane roots (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Elke `cliPath`-wrapper of SSH-proxy die je vóór `imsg` plaatst, MOET zich gedragen als een transparante stdio-pipe voor langlopende JSON-RPC. OpenClaw wisselt kleine, met nieuwe regels geframede JSON-RPC-berichten uit via stdin/stdout van de wrapper gedurende de levensduur van het kanaal:

- Stuur elk stdin-fragment/elke stdin-regel **door zodra bytes beschikbaar zijn** — wacht niet op EOF.
- Stuur elk stdout-fragment/elke stdout-regel direct in omgekeerde richting door.
- Behoud nieuwe regels.
- Vermijd blokkerende reads met vaste grootte (`read(4096)`, `cat | buffer`, standaard shell-`read`) die kleine frames kunnen uithongeren.
- Houd stderr gescheiden van de JSON-RPC-stdoutstream.

Een wrapper die stdin buffert totdat een groot blok vol is, veroorzaakt symptomen die lijken op een iMessage-storing — `imsg rpc timeout (chats.list)` of herhaaldelijke kanaalherstarts — ook al is `imsg rpc` zelf gezond. `ssh -T host imsg "$@"` (hierboven) is veilig omdat het OpenClaw's `cliPath`-argumenten zoals `rpc` en `--db` doorstuurt. Pipelines zoals `ssh host imsg | grep -v '^DEBUG'` zijn dat NIET — line-buffered tools kunnen nog steeds frames vasthouden; gebruik `stdbuf -oL -eL` op elke fase als je moet filteren.
</Warning>

  </Tab>
</Tabs>

## Vereisten en machtigingen (macOS)

- Messages moet zijn ingelogd op de Mac waarop `imsg` draait.
- Full Disk Access is vereist voor de procescontext waarin OpenClaw/`imsg` draait (toegang tot de Messages-database).
- Automatiseringsmachtiging is vereist om berichten via Messages.app te verzenden.
- Voor geavanceerde acties (reageren / bewerken / verzenden ongedaan maken / antwoord in thread / effecten / peilingen / groepsbewerkingen) moet System Integrity Protection zijn uitgeschakeld — zie [De imsg private API inschakelen](#enabling-the-imsg-private-api) hieronder. Basisfunctionaliteit voor tekst en media verzenden/ontvangen werkt zonder dit.

<Tip>
Machtigingen worden per procescontext verleend. Als gateway headless draait (LaunchAgent/SSH), voer dan een eenmalige interactieve opdracht uit in diezelfde context om prompts te activeren:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH-wrapperverzendingen mislukken met AppleEvents -1743">
  Een remote-SSH-setup kan chats lezen, `channels status --probe` doorstaan en inkomende berichten verwerken terwijl uitgaande verzendingen nog steeds mislukken met een AppleEvents-autorisatiefout:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Controleer de TCC-database van de ingelogde Mac-gebruiker of System Settings > Privacy & Security > Automation. Als de Automation-vermelding is vastgelegd voor `/usr/libexec/sshd-keygen-wrapper` in plaats van voor het `imsg`- of lokale shellproces, toont macOS mogelijk geen bruikbare Messages-schakelaar voor die server-side SSH-client:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In die toestand kan het blijven mislukken om `tccutil reset AppleEvents` te herhalen of `imsg send` opnieuw via dezelfde SSH-wrapper uit te voeren, omdat de procescontext die Messages Automation nodig heeft de SSH-wrapper is, niet een app waaraan de UI toegang kan verlenen.

Gebruik in plaats daarvan een van de ondersteunde `imsg`-procescontexten:

- Draai de Gateway, of ten minste de `imsg`-bridge, in de lokale sessie van de ingelogde Messages-gebruiker.
- Start de Gateway met een LaunchAgent voor die gebruiker nadat Full Disk Access en Automation vanuit dezelfde sessie zijn verleend.
- Als je de SSH-topologie met twee gebruikers behoudt, verifieer dan dat een echte uitgaande `imsg send` via exact dezelfde wrapper slaagt voordat je het kanaal inschakelt. Als Automation niet kan worden verleend, configureer dan opnieuw naar een `imsg`-setup met één gebruiker in plaats van voor verzendingen op de SSH-wrapper te vertrouwen.

</Accordion>

## De imsg private API inschakelen

`imsg` wordt geleverd in twee operationele modi:

- **Basismodus** (standaard, geen SIP-wijzigingen nodig): uitgaande tekst en media via `send`, inkomende watch/history, chatlijst. Dit krijg je direct na een nieuwe `brew install steipete/tap/imsg` plus de standaard macOS-machtigingen hierboven.
- **Private API-modus**: `imsg` injecteert een helper-dylib in `Messages.app` om interne `IMCore`-functies aan te roepen. Dit ontgrendelt `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `poll` en `poll-vote` (native Messages-peilingen), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, plus type-indicatoren en leesbevestigingen.

Om het geavanceerde actieoppervlak te bereiken dat deze kanaalpagina documenteert, heb je Private API-modus nodig. De `imsg` README is expliciet over de vereiste:

> Geavanceerde functies zoals `read`, `typing`, `launch`, bridge-backed rijke verzending, berichtmutatie en chatbeheer zijn opt-in. Ze vereisen dat SIP is uitgeschakeld en dat een helper-dylib in `Messages.app` wordt geïnjecteerd. `imsg launch` weigert te injecteren wanneer SIP is ingeschakeld.

De helper-injectietechniek gebruikt de eigen dylib van `imsg` om Messages private APIs te bereiken. Er is geen externe server of BlueBubbles-runtime in het OpenClaw iMessage-pad.

<Warning>
**SIP uitschakelen is een echte beveiligingsafweging.** SIP is een van de kernbeschermingen van macOS tegen het uitvoeren van gewijzigde systeemcode; het systeembreed uitschakelen opent extra aanvalsvlak en bijwerkingen. Met name **het uitschakelen van SIP op Apple Silicon-Macs schakelt ook de mogelijkheid uit om iOS-apps op je Mac te installeren en uit te voeren**.

Behandel dit als een bewuste operationele keuze, niet als standaard. Als je dreigingsmodel niet kan tolereren dat SIP uit staat, is gebundelde iMessage beperkt tot basismodus — alleen tekst en media verzenden/ontvangen, geen reacties / bewerken / verzenden ongedaan maken / effecten / groepsbewerkingen.
</Warning>

### Setup

1. **Installeer (of upgrade) `imsg`** op de Mac waarop Messages.app draait:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   De uitvoer van `imsg status --json` rapporteert `bridge_version`, `rpc_methods` en per methode `selectors`, zodat je kunt zien wat de huidige build ondersteunt voordat je begint.

2. **Schakel System Integrity Protection uit, en (op moderne macOS) Library Validation.** Het injecteren van een niet-Apple helper-dylib in de door Apple ondertekende `Messages.app` vereist dat SIP uit staat **en** dat library validation is versoepeld. De SIP-stap in Recovery-modus is macOS-versiespecifiek:
   - **macOS 10.13-10.15 (Sierra-Catalina):** schakel Library Validation uit via Terminal, herstart naar Recovery Mode, voer `csrutil disable` uit, herstart.
   - **macOS 11+ (Big Sur en later), Intel:** Recovery Mode (of Internet Recovery), `csrutil disable`, herstart.
   - **macOS 11+, Apple Silicon:** opstartreeks met de aan/uit-knop om Recovery te openen; houd op recente macOS-versies de **Left Shift**-toets ingedrukt wanneer je op Continue klikt, daarna `csrutil disable`. Virtual-machine-setups volgen een aparte flow, dus maak eerst een VM-snapshot.

   **Op macOS 11 en later is alleen `csrutil disable` meestal niet genoeg.** Apple handhaaft library validation nog steeds tegen `Messages.app` als platform binary, waardoor een adhoc-ondertekende helper wordt geweigerd (`Library Validation failed: ... platform binary, but mapped file is not`), zelfs met SIP uit. Schakel na het uitschakelen van SIP ook library validation uit en herstart:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), geverifieerd op 26.5.1:** SIP uit **plus** de bovenstaande `DisableLibraryValidation`-opdracht is voldoende om de helper te injecteren in 26.0 tot en met 26.5.x. **Er zijn geen boot-args vereist.** De plist is de doorslaggevende factor en de meest voorkomende ontbrekende stap wanneer injectie mislukt op Tahoe:
   - **Met de plist:** `imsg launch` injecteert en `imsg status` rapporteert `advanced_features: true`.
   - **Zonder de plist (zelfs met SIP uit):** `imsg launch` mislukt met `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI weigert de adhoc-helper bij het laden, waardoor de bridge nooit gereed wordt en de launch time-out. Die time-out is het symptoom dat de meeste mensen op Tahoe tegenkomen, en de oplossing is de plist hierboven, niet iets ingrijpenders.

   Dit is bevestigd met een gecontroleerde voor/na-test op macOS 26.5.1 (Apple Silicon): met de plist wordt de dylib in `Messages.app` gemapt en komt de bridge op; verwijder de plist en herstart, en `imsg launch` produceert de bovenstaande time-outfout zonder dat de dylib wordt gemapt.

   Als `imsg launch`-injectie of specifieke `selectors` na een macOS-upgrade false beginnen terug te geven, is deze gate meestal de oorzaak. Controleer je SIP- en library-validation-status voordat je aanneemt dat de SIP-stap zelf is mislukt. Als die instellingen correct zijn en de bridge nog steeds niet kan injecteren, verzamel dan `imsg status --json` plus de uitvoer van `imsg launch` en meld dit aan het `imsg`-project in plaats van extra systeembrede beveiligingsmaatregelen te verzwakken.

   Volg Apple's Recovery-mode-flow voor je Mac om SIP uit te schakelen voordat je `imsg launch` uitvoert.

3. **Injecteer de helper.** Met SIP uitgeschakeld en Messages.app aangemeld:

   ```bash
   imsg launch
   ```

   `imsg launch` weigert te injecteren wanneer SIP nog steeds is ingeschakeld, dus dit dient ook als bevestiging dat stap 2 is gelukt.

4. **Verifieer de bridge vanuit OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   De iMessage-vermelding zou `works` moeten rapporteren, en `imsg status --json | jq '{rpc_methods, selectors}'` zou de mogelijkheden moeten tonen die door je macOS-build worden blootgesteld. Poll-aanmaak vereist `selectors.pollPayloadMessage`; stemmen vereist zowel `selectors.pollVoteMessage` als de `poll.vote`-RPC-methode. De OpenClaw-Plugin adverteert alleen acties die worden ondersteund door de gecachte probe, terwijl een lege cache optimistisch blijft en bij de eerste dispatch probet.

Als `openclaw channels status --probe` het kanaal als `works` rapporteert maar specifieke acties tijdens dispatch "iMessage `<action>` requires the imsg private API bridge" gooien, voer dan `imsg launch` opnieuw uit — de helper kan wegvallen (herstart van Messages.app, OS-update, enz.) en de gecachte `available: true`-status blijft acties adverteren totdat de volgende probe wordt vernieuwd.

### Wanneer je SIP niet kunt uitschakelen

Als SIP-uitgeschakeld niet acceptabel is voor je dreigingsmodel:

- `imsg` valt terug naar basismodus — alleen tekst + media + ontvangen.
- De OpenClaw-Plugin adverteert nog steeds tekst/media verzenden en inkomende monitoring; hij verbergt alleen `react`, `edit`, `unsend`, `reply`, `sendWithEffect` en groepsbewerkingen uit het actieoppervlak (volgens de capability-gate per methode).
- Je kunt een aparte niet-Apple-Silicon Mac (of een dedicated bot-Mac) met SIP uit gebruiken voor de iMessage-workload, terwijl SIP op je primaire apparaten ingeschakeld blijft. Zie [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) hieronder.

## Toegangscontrole en routering

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` beheert directe berichten:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    Allowlist-veld: `channels.imessage.allowFrom`.

    Allowlist-vermeldingen moeten afzenders identificeren: handles of statische toegangsroepen voor afzenders (`accessGroup:<name>`). Gebruik `channels.imessage.groupAllowFrom` voor chatdoelen zoals `chat_id:*`, `chat_guid:*` of `chat_identifier:*`; gebruik `channels.imessage.groups` voor numerieke `chat_id`-registersleutels.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` beheert groepsafhandeling:

    - `allowlist` (standaard wanneer geconfigureerd)
    - `open`
    - `disabled`

    Allowlist voor groepsafzenders: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-vermeldingen kunnen ook verwijzen naar statische toegangsroepen voor afzenders (`accessGroup:<name>`).

    Runtime-terugval: als `groupAllowFrom` niet is ingesteld, gebruiken controles van iMessage-groepsafzenders `allowFrom`; stel `groupAllowFrom` in wanneer toelating voor DM's en groepen moet verschillen.
    Runtime-opmerking: als `channels.imessage` volledig ontbreekt, valt runtime terug naar `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    <Warning>
    Groepsroutering heeft **twee** allowlist-gates die direct na elkaar worden uitgevoerd, en beide moeten slagen:

    1. **Allowlist voor afzender / chatdoel** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` of `chat_id`.
    2. **Groepsregister** (`channels.imessage.groups`) — met `groupPolicy: "allowlist"` vereist deze gate ofwel een wildcard-vermelding `groups: { "*": { ... } }` (stelt `allowAll = true` in), of een expliciete per-`chat_id`-vermelding onder `groups`.

    Als gate 2 niets bevat, wordt elk groepsbericht gedropt. De Plugin geeft twee signalen op `warn`-niveau uit op het standaard logniveau:

    - eenmalig per account bij opstarten: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - eenmalig per `chat_id` tijdens runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM's blijven werken omdat ze een ander codepad gebruiken.

    Minimale configuratie om groepen te laten doorstromen onder `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Als die `warn`-regels in het gatewaylog verschijnen, is gate 2 aan het droppen — voeg het `groups`-blok toe.
    </Warning>

    Vermeldings-gating voor groepen:

    - iMessage heeft geen native vermeldingsmetadata
    - detectie van vermeldingen gebruikt regex-patronen (`agents.list[].groupChat.mentionPatterns`, terugval `messages.groupChat.mentionPatterns`)
    - zonder geconfigureerde patronen kan vermeldings-gating niet worden afgedwongen

    Besturingscommando's van geautoriseerde afzenders kunnen vermeldings-gating in groepen omzeilen.

    `systemPrompt` per groep:

    Elke vermelding onder `channels.imessage.groups.*` accepteert een optionele `systemPrompt`-string. De waarde wordt geïnjecteerd in de systeemprompt van de agent bij elke turn die een bericht in die groep afhandelt. Resolutie weerspiegelt de promptresolutie per groep die door `channels.whatsapp.groups` wordt gebruikt:

    1. **Groepsspecifieke systeemprompt** (`groups["<chat_id>"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt op die groep toegepast.
    2. **Wildcard-systeemprompt voor groepen** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding volledig ontbreekt in de map, of wanneer deze bestaat maar geen `systemPrompt`-sleutel definieert.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompts per groep zijn alleen van toepassing op groepsberichten — directe berichten in dit kanaal blijven onaangetast.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM's gebruiken directe routering; groepen gebruiken groepsroutering.
    - Met de standaard `session.dmScope=main` worden iMessage-DM's samengevoegd in de hoofdsessie van de agent.
    - Groepssessies zijn geïsoleerd (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antwoorden worden terug naar iMessage gerouteerd met metadata van het oorspronkelijke kanaal/doel.

    Groepsachtig threadgedrag:

    Sommige iMessage-threads met meerdere deelnemers kunnen binnenkomen met `is_group=false`.
    Als die `chat_id` expliciet is geconfigureerd onder `channels.imessage.groups`, behandelt OpenClaw dit als groepsverkeer (groeps-gating + isolatie van groepssessies).

  </Tab>
</Tabs>

## ACP-gespreksbindingen

Verouderde iMessage-chats kunnen ook aan ACP-sessies worden gebonden.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit binnen de DM of toegestane groepschat.
- Toekomstige berichten in datzelfde iMessage-gesprek worden naar de gespawnde ACP-sessie gerouteerd.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie ter plekke.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Geconfigureerde persistente bindingen worden ondersteund via top-level `bindings[]`-vermeldingen met `type: "acp"` en `match.channel: "imessage"`.

`match.peer.id` kan het volgende gebruiken:

- genormaliseerde DM-handle zoals `+15555550123` of `user@example.com`
- `chat_id:<id>` (aanbevolen voor stabiele groepsbindingen)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Voorbeeld:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Zie [ACP-agenten](/nl/tools/acp-agents) voor gedeeld gedrag van ACP-bindingen.

## Deploymentpatronen

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Gebruik een dedicated Apple ID en macOS-gebruiker zodat botverkeer is geïsoleerd van je persoonlijke Messages-profiel.

    Typische flow:

    1. Maak een dedicated macOS-gebruiker aan of meld je daarmee aan.
    2. Meld je in Messages aan met de Apple ID van de bot in die gebruiker.
    3. Installeer `imsg` in die gebruiker.
    4. Maak een SSH-wrapper zodat OpenClaw `imsg` in die gebruikerscontext kan uitvoeren.
    5. Wijs `channels.imessage.accounts.<id>.cliPath` en `.dbPath` naar dat gebruikersprofiel.

    De eerste uitvoering kan GUI-goedkeuringen vereisen (Automation + Full Disk Access) in die botgebruikerssessie.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Veelvoorkomende topologie:

    - Gateway draait op Linux/VM
    - iMessage + `imsg` draait op een Mac in je tailnet
    - `cliPath`-wrapper gebruikt SSH om `imsg` uit te voeren
    - `remoteHost` schakelt SCP-ophalen van bijlagen in

    Voorbeeld:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Gebruik SSH-sleutels zodat zowel SSH als SCP niet-interactief zijn.
    Zorg dat de hostsleutel eerst wordt vertrouwd (bijvoorbeeld `ssh bot@mac-mini.tailnet-1234.ts.net`) zodat `known_hosts` wordt gevuld.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage ondersteunt configuratie per account onder `channels.imessage.accounts`.

    Elk account kan velden overschrijven zoals `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geschiedenisinstellingen en allowlists voor hoofdlocaties van bijlagen.

  </Accordion>

  <Accordion title="Direct-message history">
    Stel `channels.imessage.dmHistoryLimit` in om nieuwe direct-message-sessies te seeden met recente gedecodeerde `imsg`-geschiedenis voor dat gesprek. Gebruik `channels.imessage.dms["<sender>"].historyLimit` voor overrides per afzender, inclusief `0` om geschiedenis voor een afzender uit te schakelen.

    iMessage-DM-geschiedenis wordt on demand opgehaald uit `imsg`. Als `dmHistoryLimit` niet is ingesteld, wordt globale seeding van DM-geschiedenis uitgeschakeld, maar een positieve per-afzender `channels.imessage.dms["<sender>"].historyLimit` schakelt seeding voor die afzender nog steeds in.

  </Accordion>
</AccordionGroup>

## Media, chunking en bezorgdoelen

<AccordionGroup>
  <Accordion title="Bijlagen en media">
    - opname van inkomende bijlagen is **standaard uitgeschakeld** — stel `channels.imessage.includeAttachments: true` in om foto's, spraakmemo's, video en andere bijlagen door te sturen naar de agent. Als dit is uitgeschakeld, worden iMessages die alleen uit bijlagen bestaan verwijderd voordat ze de agent bereiken en produceren ze mogelijk helemaal geen `Inbound message`-logregel.
    - externe bijlagepaden kunnen via SCP worden opgehaald wanneer `remoteHost` is ingesteld
    - bijlagepaden moeten overeenkomen met toegestane roots:
      - `channels.imessage.attachmentRoots` (lokaal)
      - `channels.imessage.remoteAttachmentRoots` (externe SCP-modus)
      - standaard rootpatroon: `/Users/*/Library/Messages/Attachments`
    - SCP gebruikt strikte hostkeycontrole (`StrictHostKeyChecking=yes`)
    - grootte van uitgaande media gebruikt `channels.imessage.mediaMaxMb` (standaard 16 MB)

  </Accordion>

  <Accordion title="Uitgaande chunking">
    - limiet voor tekstchunks: `channels.imessage.textChunkLimit` (standaard 4000)
    - chunkmodus: `channels.imessage.chunkMode`
      - `length` (standaard)
      - `newline` (splitsing waarbij alinea's eerst worden gebruikt)

  </Accordion>

  <Accordion title="Adresseringsindelingen">
    Voorkeur voor expliciete doelen:

    - `chat_id:123` (aanbevolen voor stabiele routering)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handledoelen worden ook ondersteund:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Acties voor private API

Wanneer `imsg launch` actief is en `openclaw channels status --probe` `privateApi.available: true` meldt, kan de berichtentool naast normale tekstverzending ook iMessage-native acties gebruiken.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Beschikbare acties">
    - **react**: Voeg iMessage-tapbacks toe of verwijder ze (`messageId`, `emoji`, `remove`). Ondersteunde tapbacks worden gekoppeld aan liefde, leuk, niet leuk, lachen, benadrukken en vraag.
    - **reply**: Stuur een threaded antwoord op een bestaand bericht (`messageId`, `text` of `message`, plus `chatGuid`, `chatId`, `chatIdentifier` of `to`).
    - **sendWithEffect**: Stuur tekst met een iMessage-effect (`text` of `message`, `effect` of `effectId`).
    - **edit**: Bewerk een verzonden bericht op ondersteunde macOS-/private API-versies (`messageId`, `text` of `newText`).
    - **unsend**: Trek een verzonden bericht in op ondersteunde macOS-/private API-versies (`messageId`).
    - **upload-file**: Stuur media/bestanden (`buffer` als base64 of een gehydrateerde `media`/`path`/`filePath`, `filename`, optioneel `asVoice`). Legacy-alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Beheer groepschats wanneer het huidige doel een groepsgesprek is.
    - **poll**: Maak een native Apple Messages-peiling (`pollQuestion`, `pollOption` 2 tot 12 keer herhaald, plus `chatGuid`, `chatId`, `chatIdentifier` of `to`). Ontvangers op iOS/iPadOS/macOS 26+ zien deze native en stemmen native; oudere OS-versies krijgen een tekstfallback "Sent a poll". Vereist `selectors.pollPayloadMessage`.
    - **poll-vote**: Stem op een bestaande peiling (`pollId` of `messageId`, plus precies één van `pollOptionIndex`, `pollOptionId` of `pollOptionText`). Vereist `selectors.pollVoteMessage` en de RPC-methode `poll.vote`.

    Geaccepteerde inkomende peilingen worden voor de agent weergegeven met de vraag, genummerde optielabels, stemtotalen en de bericht-ID van de peiling die nodig is voor `poll-vote`.

  </Accordion>

  <Accordion title="Bericht-ID's">
    Inkomende iMessage-context bevat zowel korte `MessageSid`-waarden als volledige bericht-GUID's wanneer beschikbaar. Korte ID's zijn beperkt tot de recente SQLite-backed antwoordcache en worden vóór gebruik gecontroleerd tegen de huidige chat. Als een korte ID is verlopen of bij een andere chat hoort, probeer het dan opnieuw met de volledige `MessageSidFull`.

  </Accordion>

  <Accordion title="Detectie van mogelijkheden">
    OpenClaw verbergt private API-acties alleen wanneer de gecachte probestatus zegt dat de bridge niet beschikbaar is. Als de status onbekend is, blijven acties zichtbaar en voeren dispatches probes lazy uit, zodat de eerste actie kan slagen na `imsg launch` zonder afzonderlijke handmatige statusvernieuwing.

  </Accordion>

  <Accordion title="Leesbevestigingen en typen">
    Wanneer de private API-bridge actief is, worden geaccepteerde inkomende chats als gelezen gemarkeerd en tonen directe chats een typballon zodra de turn is geaccepteerd, terwijl de agent context voorbereidt en genereert. Schakel leesmarkering uit met:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Oudere `imsg`-builds van vóór de mogelijkhedenlijst per methode schakelen typen/lezen stilzwijgend uit; OpenClaw logt één waarschuwing per herstart zodat de ontbrekende bevestiging herleidbaar is.

  </Accordion>

  <Accordion title="Inkomende tapbacks">
    OpenClaw abonneert zich op iMessage-tapbacks en routeert geaccepteerde reacties als systeemgebeurtenissen in plaats van normale berichttekst, zodat een tapback van een gebruiker geen gewone antwoordlus activeert.

    Meldingsmodus wordt geregeld door `channels.imessage.reactionNotifications`:

    - `"own"` (standaard): meld alleen wanneer gebruikers reageren op berichten die door de bot zijn geschreven.
    - `"all"`: meld alle inkomende tapbacks van geautoriseerde afzenders.
    - `"off"`: negeer inkomende tapbacks.

    Overrides per account gebruiken `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Goedkeuringsreacties (👍 / 👎)">
    Wanneer `approvals.exec.enabled` of `approvals.plugin.enabled` true is en de aanvraag naar iMessage wordt gerouteerd, levert de gateway native een goedkeuringsprompt en accepteert die een tapback om deze op te lossen:

    - `👍` (Like-tapback) → `allow-once`
    - `👎` (Dislike-tapback) → `deny`
    - `allow-always` blijft een handmatige fallback: stuur `/approve <id> allow-always` als normaal antwoord.

    Reactieverwerking vereist dat de handle van de reagerende gebruiker een expliciete goedkeurder is. De lijst met goedkeurders wordt gelezen uit `channels.imessage.allowFrom` (of `channels.imessage.accounts.<id>.allowFrom`); voeg het telefoonnummer van de gebruiker toe in E.164-vorm of diens Apple ID-e-mailadres. De wildcardvermelding `"*"` wordt gehonoreerd, maar staat elke afzender toe om goed te keuren. De reactiesnelkoppeling omzeilt bewust `reactionNotifications`, `dmPolicy` en `groupAllowFrom`, omdat de expliciete allowlist voor goedkeurders de enige gate is die ertoe doet voor het oplossen van goedkeuringen.

    **Gedragswijziging in deze release:** Wanneer `channels.imessage.allowFrom` niet leeg is, wordt de tekstcommand `/approve <id> <decision>` nu geautoriseerd tegen die lijst met goedkeurders (niet tegen de bredere DM-allowlist). Afzenders die wel op de DM-allowlist staan maar niet in `allowFrom`, krijgen een expliciete weigering. Voeg elke operator die via `/approve` (en via reacties) moet kunnen goedkeuren toe aan `allowFrom` om het eerdere gedrag te behouden. Wanneer `allowFrom` leeg is, blijft de legacy "same-chat fallback" van kracht en blijft `/approve` iedereen autoriseren die door de DM-allowlist wordt toegestaan.

    Operatornotities:
    - De reactiebinding wordt zowel in het geheugen opgeslagen (met een TTL die overeenkomt met de vervaltijd van de goedkeuring) als in de persistente keyed store van de gateway, zodat een tapback die kort na een herstart van de gateway binnenkomt de goedkeuring nog steeds oplost.
    - Cross-device `is_from_me=true`-tapbacks (de eigen reactie van de operator op een gekoppeld Apple-apparaat) worden bewust genegeerd, zodat de bot zichzelf niet kan goedkeuren.
    - Legacy tekststijl-tapbacks (`Liked "…"` platte tekst van zeer oude Apple-clients) kunnen geen goedkeuringen oplossen omdat ze geen bericht-GUID dragen; reactieoplossing vereist de gestructureerde tapbackmetadata die huidige macOS-/iOS-clients uitsturen.

  </Accordion>
</AccordionGroup>

## Configuratieschrijfacties

iMessage staat standaard door het kanaal geïnitieerde configuratieschrijfacties toe (voor `/config set|unset` wanneer `commands.config: true`).

Uitschakelen:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Split-send-DM's samenvoegen (command + URL in één compositie)

Wanneer een gebruiker een command en een URL samen typt — bijvoorbeeld `Dump https://example.com/article` — splitst Apple's Messages-app de verzending in **twee afzonderlijke `chat.db`-rijen**:

1. Een tekstbericht (`"Dump"`).
2. Een URL-previewballon (`"https://..."`) met OG-previewafbeeldingen als bijlagen.

De twee rijen komen op de meeste setups ~0,8-2,0 s na elkaar bij OpenClaw aan. Zonder samenvoeging ontvangt de agent alleen het command in turn 1, antwoordt hij (vaak "stuur me de URL") en ziet hij de URL pas in turn 2 — op dat punt is de commandcontext al verloren. Dit is Apple's verzendpipeline, niet iets wat OpenClaw of `imsg` introduceert.

`channels.imessage.coalesceSameSenderDms` laat een DM opeenvolgende rijen van dezelfde afzender bufferen. Wanneer `imsg` de structurele URL-previewmarkering `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` op een van de bronrijen blootlegt, voegt OpenClaw alleen die echte split-send samen en houdt het alle andere gebufferde rijen als afzonderlijke turns. Op oudere `imsg`-builds die helemaal geen ballonmetadata uitsturen, kan OpenClaw een split-send niet onderscheiden van afzonderlijke verzendingen, dus valt het terug op het samenvoegen van de bucket. Dat behoudt het gedrag van vóór metadata in plaats van `Dump <url>`-split-sends te laten regresseren naar twee turns. Groepschats blijven per bericht dispatchen zodat de turnstructuur met meerdere gebruikers behouden blijft.

<Tabs>
  <Tab title="Wanneer inschakelen">
    Schakel dit in wanneer:

    - Je skills levert die `command + payload` in één bericht verwachten (dump, paste, save, queue, enz.).
    - Je gebruikers URL's naast commands plakken.
    - Je de extra DM-turnlatentie kunt accepteren (zie hieronder).

    Laat uitgeschakeld wanneer:

    - Je minimale commandlatentie nodig hebt voor DM-triggers van één woord.
    - Al je flows eenmalige commands zijn zonder payload-follow-ups.

  </Tab>
  <Tab title="Inschakelen">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Met de flag aan en zonder expliciete `messages.inbound.byChannel.imessage` of globale `messages.inbound.debounceMs` wordt het debouncevenster verbreed naar **7000 ms** (de legacy-standaard is 0 ms — geen debouncing). Het bredere venster is vereist omdat Apple's URL-preview-split-send-cadans kan oplopen tot meerdere seconden terwijl Messages.app de previewrij uitstuurd.

    Om het venster zelf af te stemmen:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Voor precies samenvoegen is actuele `imsg`-payloadmetadata nodig.** Wanneer de URL-rij `balloon_bundle_id` bevat, wordt alleen die echte gesplitste verzending samengevoegd en blijven andere gebufferde rijen apart. Op oudere `imsg`-builds die geen balloon-metadata blootstellen, valt OpenClaw terug op het samenvoegen van de gebufferde bucket, zodat gesplitste verzendingen van `Dump <url>` niet terugvallen naar twee beurten (tijdelijke achterwaartse compatibiliteit, verwijderd zodra `imsg` gesplitste verzendingen upstream samenvoegt).
    - **Extra latentie voor DM-berichten.** Met de vlag ingeschakeld wacht elke DM (inclusief losse besturingsopdrachten en vervolgen met alleen tekst) maximaal tot het debouncevenster voordat deze wordt verzonden, voor het geval er een URL-previewrij aankomt. Groepschatberichten blijven direct verzonden.
    - **Samengevoegde uitvoer is begrensd.** Samengevoegde tekst is begrensd op 4000 tekens met een expliciete markering `…[truncated]`; bijlagen zijn begrensd op 20; bronvermeldingen zijn begrensd op 10 (eerste-plus-nieuwste blijven daarna behouden). Elke bron-GUID wordt bijgehouden in `coalescedMessageGuids` voor downstream-telemetrie.
    - **Alleen DM.** Groepschats vallen terug op verzending per bericht, zodat de bot responsief blijft wanneer meerdere mensen typen.
    - **Opt-in, per kanaal.** Andere kanalen (Telegram, WhatsApp, Slack, …) worden niet beïnvloed. Verouderde BlueBubbles-configuraties die `channels.bluebubbles.coalesceSameSenderDms` instellen, moeten die waarde migreren naar `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenario's en wat de agent ziet

De kolom "Vlag aan" toont gedrag op een `imsg`-build die `balloon_bundle_id` uitstuurt. Op oudere `imsg`-builds die helemaal geen balloon-metadata uitsturen, vallen de rijen hieronder die zijn gemarkeerd als "Twee beurten" / "N beurten" in plaats daarvan terug op een verouderde samenvoeging (één beurt): OpenClaw kan een gesplitste verzending structureel niet onderscheiden van aparte verzendingen, dus behoudt het de samenvoeging van vóór de metadata. Precieze scheiding wordt actief zodra de build balloon-metadata uitstuurt.

| Gebruiker stelt op                                               | `chat.db` produceert                         | Vlag uit (standaard)                         | Vlag aan + venster (`imsg` stuurt balloon-metadata uit)                                             |
| ---------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (één verzending)                      | 2 rijen met ~1 s ertussen                    | Twee agentbeurten: alleen "Dump", daarna URL | Eén beurt: samengevoegde tekst `Dump https://example.com`                                           |
| `Save this 📎image.jpg caption` (bijlage + tekst)                | 2 rijen zonder URL-balloonmetadata           | Twee beurten                                 | Twee beurten nadat metadata is waargenomen; één samengevoegde beurt in oude/pre-latch sessies zonder metadata |
| `/status` (losse opdracht)                                       | 1 rij                                        | Directe verzending                           | **Wacht maximaal tot het venster, verzend daarna**                                                  |
| Alleen URL geplakt                                               | 1 rij                                        | Directe verzending                           | Wacht maximaal tot het venster, verzend daarna                                                      |
| Tekst + URL verzonden als twee bewuste aparte berichten, minuten uit elkaar | 2 rijen buiten venster              | Twee beurten                                 | Twee beurten (venster verloopt ertussen)                                                            |
| Snelle vloed (>10 kleine DM's binnen venster)                    | N rijen zonder URL-balloonmetadata           | N beurten                                    | N beurten nadat metadata is waargenomen; één begrensde samengevoegde beurt in oude/pre-latch sessies zonder metadata |
| Twee mensen typen in een groepschat                              | N rijen van M afzenders                      | M+ beurten (één per afzenderbucket)          | M+ beurten — groepschats worden niet samengevoegd                                                   |

## Inbound-herstel na een herstart van bridge of Gateway

iMessage herstelt berichten die zijn gemist terwijl de Gateway offline was, en onderdrukt tegelijk de oude "backlogbom" die Apple na een Push-herstel kan doorspoelen. Het standaardgedrag staat altijd aan en is gebouwd op de inbound-dedupe.

- **Replay-dedupe.** Elk verzonden inbound-bericht wordt met zijn Apple-GUID vastgelegd in persistente Plugin-status (`imessage.inbound-dedupe`), geclaimd bij ingestie en vastgelegd na verwerking (vrijgegeven bij een tijdelijke fout zodat het opnieuw kan proberen). Alles wat al is verwerkt, wordt weggegooid in plaats van twee keer verzonden. Hierdoor kan herstel agressief opnieuw afspelen zonder administratie per bericht.
- **Downtime-herstel.** Bij het opstarten onthoudt de monitor de laatst verzonden `chat.db`-rowid (een persistente cursor per account) en geeft die door aan `imsg watch.subscribe` als `since_rowid`, zodat `imsg` de rijen opnieuw afspeelt die binnenkwamen terwijl de Gateway offline was, en daarna live volgt. Replay is begrensd tot de meest recente rijen en tot berichten van maximaal ~2 uur oud, en de dedupe verwijdert alles wat al is verwerkt.
- **Leeftijdsgrens voor oude backlog.** Rijen boven de opstartgrens zijn echt live; een rij waarvan de verzenddatum meer dan ~15 minuten ouder is dan de aankomsttijd, is de Push-flush-backlog en wordt onderdrukt. Opnieuw afgespeelde rijen (op of onder de grens) gebruiken in plaats daarvan het bredere herstelvenster, zodat een recent gemist bericht wordt afgeleverd terwijl oude geschiedenis dat niet wordt.

Herstel werkt met zowel lokale als externe `cliPath`-setups, omdat `since_rowid`-replay via dezelfde `imsg`-RPC-verbinding loopt. Het verschil is het venster: wanneer de Gateway `chat.db` kan lezen (lokaal), verankert deze de opstart-rowid-grens, begrenst de replay-spanne en levert gemiste berichten tot een paar uur oud af. Via een externe SSH-`cliPath` kan deze de database niet lezen, dus is replay onbeperkt en gebruikt elke rij de live-leeftijdsgrens — het herstelt nog steeds recent gemiste berichten en onderdrukt nog steeds oude backlog, alleen met het smallere livevenster. Voer de Gateway uit op de Messages-Mac voor het bredere herstelvenster.

### Operator-zichtbaar signaal

Onderdrukte backlog wordt op het standaardniveau gelogd, nooit stilzwijgend weggegooid (de vlag `recovery` toont welk venster is toegepast):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migratie

`channels.imessage.catchup.*` is verouderd — downtime-herstel is nu automatisch en vereist geen configuratie voor nieuwe setups. Bestaande configuraties met `catchup.enabled: true` blijven gehonoreerd als compatibiliteitsprofiel voor het herstel-replayvenster. Uitgeschakelde catchup-blokken (`enabled: false` of geen `enabled: true`) zijn uitgefaseerd; `openclaw doctor --fix` verwijdert die.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Valideer de binary en RPC-ondersteuning:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Als de probe meldt dat RPC niet wordt ondersteund, werk `imsg` bij. Als private-API-acties niet beschikbaar zijn, voer `imsg launch` uit in de ingelogde macOS-gebruikerssessie en voer de probe opnieuw uit. Als de Gateway niet op macOS draait, gebruik dan de setup Externe Mac via SSH hierboven in plaats van het standaard lokale `imsg`-pad.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    Bewijs eerst of het bericht de lokale Mac heeft bereikt. Als `chat.db` niet verandert, kan OpenClaw het bericht niet ontvangen, zelfs niet wanneer `imsg status --json` een gezonde bridge meldt.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Als vanaf de telefoon verzonden berichten geen nieuwe rijen maken, herstel dan de macOS Messages- en Apple Push-laag voordat je de OpenClaw-configuratie wijzigt. Een eenmalige serviceverversing is vaak genoeg:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Verzend een nieuwe iMessage vanaf de telefoon en bevestig een nieuwe `chat.db`-rij of `imsg watch`-event voordat je OpenClaw-sessies debugt. Voer dit niet uit als een periodieke bridge-herstartlus; herhaald `imsg launch` plus Gateway-herstarts tijdens actief werk kunnen afleveringen onderbreken en lopende kanaalruns laten vastlopen.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    De standaard `cliPath: "imsg"` moet draaien op de Mac die bij Messages is aangemeld. Stel op Linux of Windows `channels.imessage.cliPath` in op een wrapperscript dat via SSH naar die Mac gaat en `imsg "$@"` uitvoert.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Voer daarna uit:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Controleer:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - koppelingsgoedkeuringen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Controleer:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - allowlist-gedrag van `channels.imessage.groups`
    - configuratie van vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Controleer:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-sleutelauthenticatie vanaf de Gateway-host
    - hostsleutel bestaat in `~/.ssh/known_hosts` op de Gateway-host
    - leesbaarheid van externe paden op de Mac waarop Messages draait

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Voer opnieuw uit in een interactieve GUI-terminal in dezelfde gebruikers-/sessiecontext en keur prompts goed:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Bevestig dat Full Disk Access + Automation zijn toegekend voor de procescontext die OpenClaw/`imsg` uitvoert.

  </Accordion>
</AccordionGroup>

## Verwijzingen naar configuratiereferentie

- [Configuratiereferentie - iMessage](/nl/gateway/config-channels#imessage)
- [Gateway-configuratie](/nl/gateway/configuration)
- [Koppeling](/nl/channels/pairing)

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [BlueBubbles-verwijdering en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) — aankondiging en migratiesamenvatting
- [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles) — configuratievertaaltabel en stapsgewijze overstap
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingspoort
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
