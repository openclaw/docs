---
read_when:
    - iMessage-ondersteuning instellen
    - iMessage-verzending/-ontvangst debuggen
summary: Native iMessage-ondersteuning via imsg (JSON-RPC via stdio), met private API-acties voor antwoorden, tapbacks, effecten, bijlagen en groepsbeheer. Aanbevolen voor nieuwe OpenClaw iMessage-installaties wanneer de hostvereisten passen.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Gebruik voor OpenClaw iMessage-implementaties `imsg` op een macOS Messages-host waarop is ingelogd. Als je Gateway op Linux of Windows draait, wijs `channels.imessage.cliPath` dan naar een SSH-wrapper die `imsg` op de Mac uitvoert.

**Inkomend herstel is automatisch.** Na een herstart van een bridge of Gateway speelt iMessage de berichten opnieuw af die zijn gemist terwijl deze niet actief was en onderdrukt het de verouderde "backlog bomb" die Apple na een Push-herstel kan wegspoelen, met deduplicatie zodat niets twee keer wordt verzonden. Er is geen configuratie om dit in te schakelen — zie [Inkomend herstel na een herstart van een bridge of Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
BlueBubbles-ondersteuning is verwijderd. Migreer `channels.bluebubbles`-configuraties naar `channels.imessage`; OpenClaw ondersteunt iMessage alleen via `imsg`. Begin met [BlueBubbles-verwijdering en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) voor de korte aankondiging, of [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles) voor de volledige migratietabel.
</Warning>

Status: native externe CLI-integratie. Gateway start `imsg rpc` en communiceert via JSON-RPC op stdio (geen aparte daemon/poort). Geavanceerde acties vereisen `imsg launch` en een geslaagde private API-probe.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Antwoorden, tapbacks, effecten, bijlagen en groepsbeheer.
  </Card>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    iMessage-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gebruik een SSH-wrapper wanneer de Gateway niet op de Messages-Mac draait.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/nl/gateway/config-channels#imessage">
    Volledige referentie voor iMessage-velden.
  </Card>
</CardGroup>

## Snelle installatie

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Koppelingsverzoeken verlopen na 1 uur.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw vereist alleen een stdio-compatibele `cliPath`, dus je kunt `cliPath` naar een wrapperscript laten wijzen dat via SSH verbinding maakt met een externe Mac en `imsg` uitvoert.

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
    OpenClaw gebruikt strikte host-keycontrole voor SCP, dus de relay-hostkey moet al bestaan in `~/.ssh/known_hosts`.
    Bijlagepaden worden gevalideerd tegen toegestane roots (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Elke `cliPath`-wrapper of SSH-proxy die je vóór `imsg` plaatst, MOET zich gedragen als een transparante stdio-pipe voor langdurige JSON-RPC. OpenClaw wisselt kleine met newline begrensde JSON-RPC-berichten uit via stdin/stdout van de wrapper gedurende de levensduur van het kanaal:

- Stuur elk stdin-fragment/elke stdin-regel **door zodra bytes beschikbaar zijn** — wacht niet op EOF.
- Stuur elk stdout-fragment/elke stdout-regel direct in omgekeerde richting door.
- Behoud newlines.
- Vermijd blokkerende reads met vaste grootte (`read(4096)`, `cat | buffer`, standaard shell-`read`) die kleine frames kunnen laten verhongeren.
- Houd stderr gescheiden van de JSON-RPC-stdoutstream.

Een wrapper die stdin buffert totdat een groot blok vol is, veroorzaakt symptomen die op een iMessage-storing lijken — `imsg rpc timeout (chats.list)` of herhaalde kanaalherstarts — ook al is `imsg rpc` zelf gezond. `ssh -T host imsg "$@"` (hierboven) is veilig omdat het OpenClaw's `cliPath`-argumenten zoals `rpc` en `--db` doorstuurt. Pipelines zoals `ssh host imsg | grep -v '^DEBUG'` zijn dat NIET — line-buffered tools kunnen frames nog steeds vasthouden; gebruik `stdbuf -oL -eL` in elke fase als je moet filteren.
</Warning>

  </Tab>
</Tabs>

## Vereisten en machtigingen (macOS)

- Messages moet zijn ingelogd op de Mac waarop `imsg` draait.
- Full Disk Access is vereist voor de procescontext waarin OpenClaw/`imsg` draait (toegang tot de Messages-DB).
- Automation-machtiging is vereist om berichten via Messages.app te verzenden.
- Voor geavanceerde acties (reageren / bewerken / verzenden ongedaan maken / thread-antwoord / effecten / groepsbewerkingen) moet System Integrity Protection zijn uitgeschakeld — zie [De imsg private API inschakelen](#enabling-the-imsg-private-api) hieronder. Basistekst en media verzenden/ontvangen werkt zonder.

<Tip>
Machtigingen worden per procescontext toegekend. Als Gateway headless draait (LaunchAgent/SSH), voer dan een eenmalige interactieve opdracht uit in diezelfde context om prompts te activeren:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  Een remote-SSH-installatie kan chats lezen, `channels status --probe` doorstaan en inkomende berichten verwerken, terwijl uitgaande verzendingen toch mislukken met een AppleEvents-autorisatiefout:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Controleer de TCC-database van de ingelogde Mac-gebruiker of Systeeminstellingen > Privacy en beveiliging > Automation. Als de Automation-vermelding is geregistreerd voor `/usr/libexec/sshd-keygen-wrapper` in plaats van het `imsg`- of lokale shellproces, toont macOS mogelijk geen bruikbare Messages-toggle voor die SSH-server-side client:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In die toestand kan het herhalen van `tccutil reset AppleEvents` of het opnieuw uitvoeren van `imsg send` via dezelfde SSH-wrapper blijven mislukken, omdat de procescontext die Messages Automation nodig heeft de SSH-wrapper is, niet een app waaraan de UI rechten kan verlenen.

Gebruik in plaats daarvan een van de ondersteunde `imsg`-procescontexten:

- Draai de Gateway, of ten minste de `imsg`-bridge, in de lokale sessie van de ingelogde Messages-gebruiker.
- Start de Gateway met een LaunchAgent voor die gebruiker nadat Full Disk Access en Automation vanuit dezelfde sessie zijn verleend.
- Als je de twee-gebruikers-SSH-topologie behoudt, controleer dan of een echte uitgaande `imsg send` via exact dezelfde wrapper slaagt voordat je het kanaal inschakelt. Als Automation niet kan worden verleend, configureer dan in plaats daarvan opnieuw naar een single-user `imsg`-opstelling in plaats van voor verzendingen op de SSH-wrapper te vertrouwen.

</Accordion>

## De imsg private API inschakelen

`imsg` wordt geleverd in twee operationele modi:

- **Basismodus** (standaard, geen SIP-wijzigingen nodig): uitgaande tekst en media via `send`, inkomende watch/history, chatlijst. Dit krijg je standaard na een verse `brew install steipete/tap/imsg` plus de standaard macOS-machtigingen hierboven.
- **Private API-modus**: `imsg` injecteert een helper-dylib in `Messages.app` om interne `IMCore`-functies aan te roepen. Dit ontgrendelt `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, plus typing indicators en leesbevestigingen.

Om het geavanceerde actieoppervlak te bereiken dat deze kanaalpagina documenteert, heb je Private API-modus nodig. De `imsg` README is expliciet over de vereiste:

> Geavanceerde functies zoals `read`, `typing`, `launch`, bridge-backed rich send, berichtmutatie en chatbeheer zijn opt-in. Ze vereisen dat SIP is uitgeschakeld en dat een helper-dylib in `Messages.app` wordt geïnjecteerd. `imsg launch` weigert te injecteren wanneer SIP is ingeschakeld.

De helper-injectietechniek gebruikt de eigen dylib van `imsg` om private API's van Messages te bereiken. Er is geen externe server of BlueBubbles-runtime in het OpenClaw iMessage-pad.

<Warning>
**SIP uitschakelen is een echte beveiligingsafweging.** SIP is een van de kernbeschermingen van macOS tegen het uitvoeren van gewijzigde systeemcode; het systeembreed uitschakelen opent extra aanvalsvlak en bijwerkingen. Met name **schakelt het uitschakelen van SIP op Apple Silicon-Macs ook de mogelijkheid uit om iOS-apps op je Mac te installeren en uit te voeren**.

Behandel dit als een bewuste operationele keuze, niet als standaard. Als je threat model niet kan tolereren dat SIP uit staat, is gebundelde iMessage beperkt tot basismodus — alleen tekst en media verzenden/ontvangen, geen reacties / bewerken / verzenden ongedaan maken / effecten / groepsbewerkingen.
</Warning>

### Installatie

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
   - **macOS 11+, Apple Silicon:** opstartvolgorde met de aan/uit-knop om Recovery te openen; houd op recente macOS-versies de **Left Shift**-toets ingedrukt wanneer je op Continue klikt, daarna `csrutil disable`. Virtual-machine-opstellingen volgen een aparte flow, dus maak eerst een VM-snapshot.

   **Op macOS 11 en later is alleen `csrutil disable` meestal niet genoeg.** Apple handhaaft nog steeds library validation tegen `Messages.app` als platform binary, waardoor een adhoc-ondertekende helper wordt geweigerd (`Library Validation failed: ... platform binary, but mapped file is not`), zelfs met SIP uit. Schakel na het uitschakelen van SIP ook library validation uit en herstart:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), geverifieerd op 26.5.1:** SIP uit **plus** de bovenstaande `DisableLibraryValidation`-opdracht is voldoende om de helper te injecteren van 26.0 tot en met 26.5.x. **Er zijn geen boot-args vereist.** De plist is de doorslaggevende factor en de meest voorkomende ontbrekende stap wanneer injectie op Tahoe mislukt:
   - **Met de plist:** `imsg launch` injecteert en `imsg status` rapporteert `advanced_features: true`.
   - **Zonder de plist (zelfs met SIP uit):** `imsg launch` mislukt met `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI weigert de adhoc-helper bij het laden, waardoor de bridge nooit gereed wordt en de launch time-out. Die time-out is het symptoom dat de meeste mensen op Tahoe tegenkomen, en de oplossing is de plist hierboven, niet iets drastischers.

   Dit is bevestigd met een gecontroleerde voor/na op macOS 26.5.1 (Apple Silicon): met de plist wordt de dylib in `Messages.app` gemapt en komt de bridge op; verwijder de plist en herstart, en `imsg launch` produceert de time-outfout hierboven waarbij de dylib niet is gemapt.

   Als `imsg launch`-injectie of specifieke `selectors` na een macOS-upgrade false beginnen terug te geven, is deze gate meestal de oorzaak. Controleer je SIP- en library-validatiestatus voordat je aanneemt dat de SIP-stap zelf is mislukt. Als die instellingen correct zijn en de bridge nog steeds niet kan injecteren, verzamel dan `imsg status --json` plus de uitvoer van `imsg launch` en rapporteer dit aan het `imsg`-project in plaats van extra systeembrede beveiligingscontroles te verzwakken.

   Volg Apple's Recovery-mode-flow voor je Mac om SIP uit te schakelen voordat je `imsg launch` uitvoert.

3. **Injecteer de helper.** Met SIP uitgeschakeld en Messages.app aangemeld:

   ```bash
   imsg launch
   ```

   `imsg launch` weigert te injecteren wanneer SIP nog is ingeschakeld, dus dit dient ook als bevestiging dat stap 2 is gelukt.

4. **Verifieer de bridge vanuit OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   De iMessage-vermelding zou `works` moeten rapporteren, en `imsg status --json | jq '.selectors'` zou `retractMessagePart: true` moeten tonen plus alle edit-/typing-/read-selectors die je macOS-build blootstelt. De per-methode-gating van de OpenClaw-Plugin in `actions.ts` adverteert alleen acties waarvan de onderliggende selector `true` is, dus het actieoppervlak dat je in de toollijst van de agent ziet, weerspiegelt wat de bridge daadwerkelijk op deze host kan doen.

Als `openclaw channels status --probe` het kanaal als `works` rapporteert maar specifieke acties tijdens dispatch "iMessage `<action>` requires the imsg private API bridge" geven, voer dan `imsg launch` opnieuw uit — de helper kan wegvallen (herstart van Messages.app, OS-update, enz.) en de gecachte status `available: true` blijft acties adverteren totdat de volgende probe wordt ververst.

### Wanneer je SIP niet kunt uitschakelen

Als uitgeschakelde SIP niet acceptabel is voor je dreigingsmodel:

- `imsg` valt terug op basismodus — alleen tekst + media + ontvangen.
- De OpenClaw-Plugin adverteert nog steeds tekst/media verzenden en inkomende monitoring; hij verbergt alleen `react`, `edit`, `unsend`, `reply`, `sendWithEffect` en groepsbewerkingen uit het actieoppervlak (volgens de per-methode capability gate).
- Je kunt een aparte niet-Apple-Silicon Mac (of een toegewezen bot-Mac) met SIP uit gebruiken voor de iMessage-workload, terwijl SIP ingeschakeld blijft op je primaire apparaten. Zie [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) hieronder.

## Toegangsbeheer en routering

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` beheert directe berichten:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    Allowlist-veld: `channels.imessage.allowFrom`.

    Allowlist-vermeldingen moeten afzenders identificeren: handles of statische afzendertoegangsgroepen (`accessGroup:<name>`). Gebruik `channels.imessage.groupAllowFrom` voor chatdoelen zoals `chat_id:*`, `chat_guid:*` of `chat_identifier:*`; gebruik `channels.imessage.groups` voor numerieke `chat_id`-registratiesleutels.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` beheert groepsafhandeling:

    - `allowlist` (standaard wanneer geconfigureerd)
    - `open`
    - `disabled`

    Groepsafzender-allowlist: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-vermeldingen kunnen ook verwijzen naar statische afzendertoegangsgroepen (`accessGroup:<name>`).

    Runtime-fallback: als `groupAllowFrom` niet is ingesteld, gebruiken iMessage-groepsafzendercontroles `allowFrom`; stel `groupAllowFrom` in wanneer toelating voor DM's en groepen moet verschillen.
    Runtime-opmerking: als `channels.imessage` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    <Warning>
    Groepsroutering heeft **twee** allowlist-gates die direct na elkaar draaien, en beide moeten slagen:

    1. **Afzender-/chatdoel-allowlist** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` of `chat_id`.
    2. **Groepsregister** (`channels.imessage.groups`) — met `groupPolicy: "allowlist"` vereist deze gate ofwel een wildcard-vermelding `groups: { "*": { ... } }` (stelt `allowAll = true` in), of een expliciete per-`chat_id`-vermelding onder `groups`.

    Als gate 2 niets bevat, wordt elk groepsbericht gedropt. De Plugin geeft twee signalen op `warn`-niveau op het standaard logniveau:

    - eenmalig per account bij startup: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - eenmalig per `chat_id` tijdens runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM's blijven werken omdat ze een ander codepad nemen.

    Minimale config om groepen te laten doorstromen onder `groupPolicy: "allowlist"`:

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

    Als die `warn`-regels in de Gateway-log verschijnen, dropt gate 2 — voeg het `groups`-blok toe.
    </Warning>

    Mention-gating voor groepen:

    - iMessage heeft geen native mention-metadata
    - mention-detectie gebruikt regex-patronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - zonder geconfigureerde patronen kan mention-gating niet worden afgedwongen

    Besturingscommando's van geautoriseerde afzenders kunnen mention-gating in groepen omzeilen.

    Per-groep `systemPrompt`:

    Elke vermelding onder `channels.imessage.groups.*` accepteert een optionele `systemPrompt`-string. De waarde wordt in de systeemprompt van de agent geïnjecteerd bij elke turn die een bericht in die groep afhandelt. Resolutie spiegelt de per-groep promptresolutie die door `channels.whatsapp.groups` wordt gebruikt:

    1. **Groepsspecifieke systeemprompt** (`groups["<chat_id>"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast op die groep.
    2. **Wildcard-systeemprompt voor groepen** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding volledig afwezig is in de map, of wanneer die bestaat maar geen sleutel `systemPrompt` definieert.

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

    Per-groep prompts zijn alleen van toepassing op groepsberichten — directe berichten in dit kanaal worden niet beïnvloed.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM's gebruiken directe routering; groepen gebruiken groepsroutering.
    - Met de standaard `session.dmScope=main` worden iMessage-DM's samengevoegd in de hoofdsessie van de agent.
    - Groepssessies zijn geïsoleerd (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antwoorden routeren terug naar iMessage met metadata van het oorspronkelijke kanaal/doel.

    Groepsachtig threadgedrag:

    Sommige iMessage-threads met meerdere deelnemers kunnen binnenkomen met `is_group=false`.
    Als die `chat_id` expliciet is geconfigureerd onder `channels.imessage.groups`, behandelt OpenClaw dit als groepsverkeer (groepsgating + groepssessie-isolatie).

  </Tab>
</Tabs>

## ACP-gespreksbindings

Legacy iMessage-chats kunnen ook aan ACP-sessies worden gebonden.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit binnen de DM of toegestane groepschat.
- Toekomstige berichten in datzelfde iMessage-gesprek routeren naar de gespawnde ACP-sessie.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie op zijn plek.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Geconfigureerde persistente bindings worden ondersteund via top-level `bindings[]`-vermeldingen met `type: "acp"` en `match.channel: "imessage"`.

`match.peer.id` kan gebruiken:

- genormaliseerde DM-handle zoals `+15555550123` of `user@example.com`
- `chat_id:<id>` (aanbevolen voor stabiele groepsbindings)
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

Zie [ACP Agents](/nl/tools/acp-agents) voor gedeeld ACP-bindingsgedrag.

## Deploymentpatronen

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Gebruik een toegewezen Apple ID en macOS-gebruiker zodat botverkeer geïsoleerd is van je persoonlijke Messages-profiel.

    Typische flow:

    1. Maak een toegewezen macOS-gebruiker aan/meld je aan.
    2. Meld je bij Messages aan met de bot-Apple ID in die gebruiker.
    3. Installeer `imsg` in die gebruiker.
    4. Maak een SSH-wrapper zodat OpenClaw `imsg` in die gebruikerscontext kan uitvoeren.
    5. Laat `channels.imessage.accounts.<id>.cliPath` en `.dbPath` naar dat gebruikersprofiel wijzen.

    De eerste run kan GUI-goedkeuringen vereisen (Automation + Full Disk Access) in die botgebruikerssessie.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Gebruikelijke topologie:

    - Gateway draait op Linux/VM
    - iMessage + `imsg` draait op een Mac in je tailnet
    - `cliPath`-wrapper gebruikt SSH om `imsg` uit te voeren
    - `remoteHost` maakt SCP-fetches van bijlagen mogelijk

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
    iMessage ondersteunt config per account onder `channels.imessage.accounts`.

    Elk account kan velden overschrijven zoals `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geschiedenisinstellingen en allowlists voor bijlage-roots.

  </Accordion>

  <Accordion title="Direct-message history">
    Stel `channels.imessage.dmHistoryLimit` in om nieuwe directe-berichtsessies te seeden met recente gedecodeerde `imsg`-geschiedenis voor dat gesprek. Gebruik `channels.imessage.dms["<sender>"].historyLimit` voor overrides per afzender, inclusief `0` om geschiedenis voor een afzender uit te schakelen.

    iMessage-DM-geschiedenis wordt op aanvraag opgehaald uit `imsg`. Als `dmHistoryLimit` niet is ingesteld, wordt globale DM-geschiedenisseeding uitgeschakeld, maar een positieve per-afzender `channels.imessage.dms["<sender>"].historyLimit` schakelt seeding voor die afzender nog steeds in.

  </Accordion>
</AccordionGroup>

## Media, chunking en bezorgdoelen

<AccordionGroup>
  <Accordion title="Bijlagen en media">
    - verwerking van inkomende bijlagen staat **standaard uit** — stel `channels.imessage.includeAttachments: true` in om foto's, spraakmemo's, video en andere bijlagen door te sturen naar de agent. Als dit is uitgeschakeld, worden iMessages met alleen bijlagen verwijderd voordat ze de agent bereiken en produceren ze mogelijk helemaal geen `Inbound message`-logregel.
    - externe bijlagepaden kunnen via SCP worden opgehaald wanneer `remoteHost` is ingesteld
    - bijlagepaden moeten overeenkomen met toegestane hoofdlocaties:
      - `channels.imessage.attachmentRoots` (lokaal)
      - `channels.imessage.remoteAttachmentRoots` (externe SCP-modus)
      - standaard hoofdlocatiepatroon: `/Users/*/Library/Messages/Attachments`
    - SCP gebruikt strikte host-sleutelcontrole (`StrictHostKeyChecking=yes`)
    - grootte van uitgaande media gebruikt `channels.imessage.mediaMaxMb` (standaard 16 MB)

  </Accordion>

  <Accordion title="Uitgaande fragmentatie">
    - tekstfragmentlimiet: `channels.imessage.textChunkLimit` (standaard 4000)
    - fragmentmodus: `channels.imessage.chunkMode`
      - `length` (standaard)
      - `newline` (eerst op alinea's splitsen)

  </Accordion>

  <Accordion title="Adresseringsindelingen">
    Voorkeursdoelen die expliciet zijn:

    - `chat_id:123` (aanbevolen voor stabiele routering)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle-doelen worden ook ondersteund:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Private API-acties

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Beschikbare acties">
    - **react**: iMessage-tapbacks toevoegen/verwijderen (`messageId`, `emoji`, `remove`). Ondersteunde tapbacks worden gekoppeld aan liefde, leuk, niet leuk, lachen, benadrukken en vraag.
    - **reply**: Een antwoord in een thread sturen naar een bestaand bericht (`messageId`, `text` of `message`, plus `chatGuid`, `chatId`, `chatIdentifier` of `to`).
    - **sendWithEffect**: Tekst sturen met een iMessage-effect (`text` of `message`, `effect` of `effectId`).
    - **edit**: Een verzonden bericht bewerken op ondersteunde macOS/private API-versies (`messageId`, `text` of `newText`).
    - **unsend**: Een verzonden bericht intrekken op ondersteunde macOS/private API-versies (`messageId`).
    - **upload-file**: Media/bestanden verzenden (`buffer` als base64 of een gehydrateerde `media`/`path`/`filePath`, `filename`, optioneel `asVoice`). Legacy alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Groepschats beheren wanneer het huidige doel een groepsgesprek is.

  </Accordion>

  <Accordion title="Bericht-ID's">
    Inkomende iMessage-context bevat zowel korte `MessageSid`-waarden als volledige bericht-GUID's wanneer beschikbaar. Korte ID's vallen binnen de recente SQLite-ondersteunde antwoordcache en worden vóór gebruik gecontroleerd tegen de huidige chat. Als een korte ID is verlopen of bij een andere chat hoort, probeer het dan opnieuw met de volledige `MessageSidFull`.

  </Accordion>

  <Accordion title="Capaciteitsdetectie">
    OpenClaw verbergt private API-acties alleen wanneer de gecachte probestatus aangeeft dat de bridge niet beschikbaar is. Als de status onbekend is, blijven acties zichtbaar en voeren dispatches probes lui uit, zodat de eerste actie na `imsg launch` kan slagen zonder een aparte handmatige statusvernieuwing.

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

    Oudere `imsg`-builds van vóór de capaciteitenlijst per methode schakelen typen/lezen stilzwijgend uit; OpenClaw logt één waarschuwing per herstart, zodat de ontbrekende ontvangstbevestiging verklaarbaar is.

  </Accordion>

  <Accordion title="Inkomende tapbacks">
    OpenClaw abonneert zich op iMessage-tapbacks en routeert geaccepteerde reacties als systeemgebeurtenissen in plaats van normale berichttekst, zodat een tapback van een gebruiker geen gewone antwoordlus activeert.

    Meldingsmodus wordt beheerd door `channels.imessage.reactionNotifications`:

    - `"own"` (standaard): alleen melden wanneer gebruikers reageren op berichten die door de bot zijn geschreven.
    - `"all"`: melden voor alle inkomende tapbacks van geautoriseerde afzenders.
    - `"off"`: inkomende tapbacks negeren.

    Overrides per account gebruiken `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Goedkeuringsreacties (👍 / 👎)">
    Wanneer `approvals.exec.enabled` of `approvals.plugin.enabled` true is en de aanvraag naar iMessage routeert, levert de gateway native een goedkeuringsprompt en accepteert deze een tapback om hem op te lossen:

    - `👍` (Leuk-tapback) → `allow-once`
    - `👎` (Niet-leuk-tapback) → `deny`
    - `allow-always` blijft een handmatige fallback: stuur `/approve <id> allow-always` als een gewoon antwoord.

    Reactieafhandeling vereist dat de handle van de reagerende gebruiker een expliciete goedkeurder is. De lijst met goedkeurders wordt gelezen uit `channels.imessage.allowFrom` (of `channels.imessage.accounts.<id>.allowFrom`); voeg het telefoonnummer van de gebruiker toe in E.164-vorm of hun Apple ID-e-mailadres. De wildcardvermelding `"*"` wordt gerespecteerd, maar staat elke afzender toe om goed te keuren. De reactiesnelkoppeling omzeilt bewust `reactionNotifications`, `dmPolicy` en `groupAllowFrom`, omdat de allowlist voor expliciete goedkeurders de enige gate is die ertoe doet voor het oplossen van goedkeuringen.

    **Gedragswijziging in deze release:** Wanneer `channels.imessage.allowFrom` niet leeg is, wordt het tekstcommando `/approve <id> <decision>` nu geautoriseerd tegen die lijst met goedkeurders (niet tegen de bredere DM-allowlist). Afzenders die zijn toegestaan op de DM-allowlist maar niet in `allowFrom`, ontvangen een expliciete weigering. Voeg elke operator die via `/approve` (en via reacties) moet kunnen goedkeuren toe aan `allowFrom` om het vorige gedrag te behouden. Wanneer `allowFrom` leeg is, blijft de legacy "same-chat fallback" van kracht en blijft `/approve` iedereen autoriseren die door de DM-allowlist wordt toegestaan.

    Operatornotities:
    - De reactiekoppeling wordt zowel in het geheugen opgeslagen (met TTL afgestemd op de vervaldatum van de goedkeuring) als in de persistente sleutelopslag van de gateway, zodat een tapback die kort na een gateway-herstart binnenkomt de goedkeuring nog steeds oplost.
    - Cross-device `is_from_me=true`-tapbacks (de eigen reactie van de operator op een gekoppeld Apple-apparaat) worden bewust genegeerd, zodat de bot zichzelf niet kan goedkeuren.
    - Legacy tapbacks in tekststijl (`Liked "…"` platte tekst van zeer oude Apple-clients) kunnen goedkeuringen niet oplossen, omdat ze geen bericht-GUID dragen; reactie-oplossing vereist de gestructureerde tapbackmetadata die huidige macOS- / iOS-clients uitsturen.

  </Accordion>
</AccordionGroup>

## Configuratieschrijfbewerkingen

iMessage staat standaard door het kanaal geïnitieerde configuratieschrijfbewerkingen toe (voor `/config set|unset` wanneer `commands.config: true`).

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

## Split-send-DM's samenvoegen (commando + URL in één compositie)

Wanneer een gebruiker samen een commando en een URL typt — bijvoorbeeld `Dump https://example.com/article` — splitst Apple's Berichten-app de verzending in **twee afzonderlijke `chat.db`-rijen**:

1. Een tekstbericht (`"Dump"`).
2. Een URL-previewballon (`"https://..."`) met OG-previewafbeeldingen als bijlagen.

De twee rijen komen bij OpenClaw op de meeste setups ~0,8-2,0 s na elkaar binnen. Zonder samenvoeging ontvangt de agent alleen het commando in turn 1, antwoordt (vaak "stuur me de URL") en ziet de URL pas in turn 2 — op dat moment is de commandocontext al verloren. Dit is Apple's verzendpipeline, niet iets dat OpenClaw of `imsg` introduceert.

`channels.imessage.coalesceSameSenderDms` laat een DM opeenvolgende rijen van dezelfde afzender bufferen. Wanneer `imsg` de structurele URL-previewmarkering `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` op een van de bronrijen beschikbaar maakt, voegt OpenClaw alleen die echte split-send samen en behoudt het alle andere gebufferde rijen als afzonderlijke turns. Op oudere `imsg`-builds die helemaal geen ballonmetadata uitsturen, kan OpenClaw een split-send niet onderscheiden van afzonderlijke verzendingen, dus valt het terug op het samenvoegen van de bucket. Dat behoudt het gedrag van vóór metadata in plaats van `Dump <url>`-split-sends te laten terugvallen naar twee turns. Groepschats blijven per bericht dispatchen, zodat de turnstructuur met meerdere gebruikers behouden blijft.

<Tabs>
  <Tab title="Wanneer inschakelen">
    Schakel in wanneer:

    - Je Skills levert die `command + payload` in één bericht verwachten (dump, paste, save, queue, enz.).
    - Je gebruikers URL's naast commando's plakken.
    - Je de extra DM-turnlatentie kunt accepteren (zie hieronder).

    Laat uitgeschakeld wanneer:

    - Je minimale commandolatentie nodig hebt voor DM-triggers met één woord.
    - Al je flows eenmalige commando's zijn zonder payload-vervolg.

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

    Met de vlag aan en zonder expliciete `messages.inbound.byChannel.imessage` of globale `messages.inbound.debounceMs`, wordt het debouncevenster verbreed naar **7000 ms** (de legacy standaard is 0 ms — geen debouncing). Het bredere venster is vereist omdat Apple's URL-preview-split-sendcadans tot meerdere seconden kan oplopen terwijl Messages.app de previewrij uitstoot.

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
  <Tab title="Afwegingen">
    - **Precies samenvoegen vereist huidige `imsg`-payloadmetadata.** Wanneer de URL-rij `balloon_bundle_id` bevat, wordt alleen die echte split-send samengevoegd en blijven andere gebufferde rijen gescheiden. Op oudere `imsg`-builds die geen ballonmetadata beschikbaar maken, valt OpenClaw terug op het samenvoegen van de gebufferde bucket, zodat `Dump <url>`-split-sends niet terugvallen naar twee turns (tijdelijke back-compat, verwijderd zodra `imsg` split-sends upstream samenvoegt).
    - **Extra latentie voor DM-berichten.** Met de vlag aan wacht elke DM (inclusief zelfstandige besturingscommando's en vervolgberichten met alleen tekst) tot maximaal het debouncevenster voordat deze wordt gedispatcht, voor het geval er een URL-previewrij aankomt. Groepschatberichten blijven direct dispatchen.
    - **Samengevoegde uitvoer is begrensd.** Samengevoegde tekst is beperkt tot 4000 tekens met een expliciete `…[truncated]`-markering; bijlagen zijn beperkt tot 20; bronvermeldingen zijn beperkt tot 10 (eerste-plus-laatste behouden boven die limiet). Elke bron-GUID wordt bijgehouden in `coalescedMessageGuids` voor downstreamtelemetrie.
    - **Alleen DM.** Groepschats vallen door naar dispatch per bericht, zodat de bot responsief blijft wanneer meerdere mensen typen.
    - **Opt-in, per kanaal.** Andere kanalen (Telegram, WhatsApp, Slack, …) worden niet beïnvloed. Legacy BlueBubbles-configuraties die `channels.bluebubbles.coalesceSameSenderDms` instellen, moeten die waarde migreren naar `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenario's en wat de agent ziet

De kolom "Vlag aan" toont het gedrag op een `imsg`-build die `balloon_bundle_id` uitzendt. Op oudere `imsg`-builds die helemaal geen ballonmetadata uitzenden, vallen de rijen hieronder die zijn gemarkeerd als "Twee beurten" / "N beurten" in plaats daarvan terug op een verouderde samenvoeging (een beurt): OpenClaw kan structureel geen gesplitste verzending onderscheiden van afzonderlijke verzendingen, dus behoudt het de samenvoeging van voor de metadata. Precieze scheiding wordt actief zodra de build ballonmetadata uitzendt.

| Gebruiker stelt op                                                | `chat.db` produceert                | Vlag uit (standaard)                     | Vlag aan + venster (`imsg` zendt ballonmetadata uit)                                                |
| ------------------------------------------------------------------ | ----------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (een verzending)                        | 2 rijen met ~1 s ertussen           | Twee agentbeurten: alleen "Dump", dan URL | Een beurt: samengevoegde tekst `Dump https://example.com`                                           |
| `Save this 📎image.jpg caption` (bijlage + tekst)                  | 2 rijen zonder URL-ballonmetadata   | Twee beurten                             | Twee beurten nadat metadata is waargenomen; een samengevoegde beurt op oude/pre-latch sessies zonder metadata |
| `/status` (zelfstandige opdracht)                                  | 1 rij                               | Directe dispatch                         | **Wacht maximaal het venster en dispatch dan**                                                      |
| Alleen URL geplakt                                                 | 1 rij                               | Directe dispatch                         | Wacht maximaal het venster en dispatch dan                                                          |
| Tekst + URL verzonden als twee bewust afzonderlijke berichten, minuten uit elkaar | 2 rijen buiten venster              | Twee beurten                             | Twee beurten (venster verloopt ertussen)                                                            |
| Snelle stroom (>10 kleine DM's binnen venster)                     | N rijen zonder URL-ballonmetadata   | N beurten                                | N beurten nadat metadata is waargenomen; een begrensde samengevoegde beurt op oude/pre-latch sessies zonder metadata |
| Twee mensen typen in een groepschat                                | N rijen van M afzenders             | M+ beurten (een per afzenderbucket)      | M+ beurten — groepschats worden niet samengevoegd                                                   |

## Inkomend herstel na een bridge- of Gateway-herstart

iMessage herstelt berichten die zijn gemist terwijl de Gateway uit was, en onderdrukt tegelijk de verouderde "backlogbom" die Apple na een Push-herstel kan doorspoelen. Het standaardgedrag staat altijd aan en is gebouwd op inkomende deduplicatie.

- **Replay-deduplicatie.** Elk gedispatcht inkomend bericht wordt met zijn Apple-GUID vastgelegd in persistente Plugin-status (`imessage.inbound-dedupe`), geclaimd bij inname en vastgelegd na verwerking (vrijgegeven bij een tijdelijke fout zodat het opnieuw kan proberen). Alles wat al is verwerkt, wordt gedropt in plaats van twee keer gedispatcht. Hierdoor kan herstel agressief opnieuw afspelen zonder boekhouding per bericht.
- **Downtime-herstel.** Bij het starten onthoudt de monitor de laatst gedispatchte `chat.db`-rowid (een persistente cursor per account) en geeft die door aan `imsg watch.subscribe` als `since_rowid`, zodat imsg de rijen opnieuw afspeelt die binnenkwamen terwijl de Gateway uit was, en daarna live volgt. Replay is begrensd tot de meest recente rijen en tot berichten van maximaal ~2 uur oud, en de deduplicatie dropt alles wat al is verwerkt.
- **Leeftijdsgrens voor verouderde backlog.** Rijen boven de startgrens zijn echt live; een rij waarvan de verzenddatum meer dan ~15 minuten ouder is dan de aankomst, is de Push-flush-backlog en wordt onderdrukt. Opnieuw afgespeelde rijen (op of onder de grens) gebruiken in plaats daarvan het ruimere herstelvenster, zodat een recent gemist bericht wordt bezorgd terwijl oude geschiedenis dat niet wordt.

Herstel werkt via zowel lokale als externe `cliPath`-setups, omdat `since_rowid`-replay over dezelfde `imsg`-RPC-verbinding loopt. Het verschil is het venster: wanneer de Gateway `chat.db` kan lezen (lokaal), verankert die de rowid-startgrens, begrenst die de replay-spanne en bezorgt die gemiste berichten tot een paar uur oud. Via een externe SSH-`cliPath` kan die de database niet lezen, dus de replay is onbeperkt en elke rij gebruikt de live leeftijdsgrens — die herstelt nog steeds recent gemiste berichten en onderdrukt nog steeds oude backlog, alleen met het nauwere live venster. Voer de Gateway uit op de Messages-Mac voor het ruimere herstelvenster.

### Operator-zichtbaar signaal

Onderdrukte backlog wordt gelogd op het standaardniveau en nooit stilzwijgend gedropt (de vlag `recovery` toont welk venster is toegepast):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migratie

`channels.imessage.catchup.*` is verouderd — downtime-herstel is nu automatisch en heeft voor nieuwe setups geen configuratie nodig. Bestaande configuraties met `catchup.enabled: true` blijven gehonoreerd als compatibiliteitsprofiel voor het herstel-replayvenster. Uitgeschakelde catchup-blokken (`enabled: false` of geen `enabled: true`) zijn uitgefaseerd; `openclaw doctor --fix` verwijdert die.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Valideer de binary en RPC-ondersteuning:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Als probe meldt dat RPC niet wordt ondersteund, werk `imsg` dan bij. Als private API-acties niet beschikbaar zijn, voer `imsg launch` uit in de ingelogde macOS-gebruikerssessie en voer probe opnieuw uit. Als de Gateway niet op macOS draait, gebruik dan de externe Mac via SSH-setup hierboven in plaats van het standaard lokale `imsg`-pad.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    Bewijs eerst of het bericht de lokale Mac heeft bereikt. Als `chat.db` niet verandert, kan OpenClaw het bericht niet ontvangen, zelfs wanneer `imsg status --json` een gezonde bridge meldt.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Als vanaf de telefoon verzonden berichten geen nieuwe rijen aanmaken, herstel dan de macOS Messages- en Apple Push-laag voordat je OpenClaw-configuratie wijzigt. Een eenmalige serviceverversing is vaak genoeg:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Stuur een nieuwe iMessage vanaf de telefoon en bevestig een nieuwe `chat.db`-rij of `imsg watch`-event voordat je OpenClaw-sessies debugt. Voer dit niet uit als periodieke bridge-herstartlus; herhaald `imsg launch` plus Gateway-herstarts tijdens actief werk kunnen bezorgingen onderbreken en lopende kanaalruns laten vastlopen.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    De standaard `cliPath: "imsg"` moet draaien op de Mac die is ingelogd bij Messages. Stel op Linux of Windows `channels.imessage.cliPath` in op een wrapperscript dat via SSH naar die Mac gaat en `imsg "$@"` uitvoert.

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
    - leesbaarheid van extern pad op de Mac waarop Messages draait

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Voer opnieuw uit in een interactieve GUI-terminal in dezelfde gebruikers-/sessiecontext en keur prompts goed:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Bevestig dat Volledige schijftoegang + Automatisering zijn toegekend voor de procescontext die OpenClaw/`imsg` uitvoert.

  </Accordion>
</AccordionGroup>

## Verwijzingen naar configuratiereferentie

- [Configuratiereferentie - iMessage](/nl/gateway/config-channels#imessage)
- [Gateway-configuratie](/nl/gateway/configuration)
- [Koppeling](/nl/channels/pairing)

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Verwijdering van BlueBubbles en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) — aankondiging en migratiesamenvatting
- [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles) — configuratievertaaltabel en stapsgewijze overstap
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsgating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
