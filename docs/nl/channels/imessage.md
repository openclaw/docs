---
read_when:
    - iMessage-ondersteuning instellen
    - Foutopsporing voor verzenden/ontvangen via iMessage
summary: Systeemeigen iMessage-ondersteuning via imsg (JSON-RPC via stdio), met private API-acties voor antwoorden, tapbacks, effecten, bijlagen en groepsbeheer. Aanbevolen voor nieuwe OpenClaw iMessage-configuraties wanneer aan de hostvereisten wordt voldaan.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Gebruik voor OpenClaw iMessage-implementaties `imsg` op een ingelogde macOS Messages-host. Als je Gateway op Linux of Windows draait, wijs `channels.imessage.cliPath` dan naar een SSH-wrapper die `imsg` op de Mac uitvoert.

**Inhalen na Gateway-downtime is opt-in.** Wanneer dit is ingeschakeld (`channels.imessage.catchup.enabled: true`), speelt de gateway inkomende berichten opnieuw af die in `chat.db` terechtkwamen terwijl deze offline was (crash, herstart, Mac-slaapstand) bij de volgende start. Standaard uitgeschakeld — zie [Inhalen na gateway-downtime](#catching-up-after-gateway-downtime). Sluit [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
BlueBubbles-ondersteuning is verwijderd. Migreer `channels.bluebubbles`-configuraties naar `channels.imessage`; OpenClaw ondersteunt iMessage alleen via `imsg`. Begin met [Verwijdering van BlueBubbles en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) voor de korte aankondiging, of [Afkomstig van BlueBubbles](/nl/channels/imessage-from-bluebubbles) voor de volledige migratietabel.
</Warning>

Status: native externe CLI-integratie. Gateway start `imsg rpc` en communiceert via JSON-RPC op stdio (geen aparte daemon/poort). Geavanceerde acties vereisen `imsg launch` en een succesvolle private API-probe.

<CardGroup cols={3}>
  <Card title="Private API-acties" icon="wand-sparkles" href="#private-api-actions">
    Antwoorden, tapbacks, effecten, bijlagen en groepsbeheer.
  </Card>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    iMessage-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Mac op afstand" icon="terminal" href="#remote-mac-over-ssh">
    Gebruik een SSH-wrapper wanneer de Gateway niet op de Messages-Mac draait.
  </Card>
  <Card title="Configuratiereferentie" icon="settings" href="/nl/gateway/config-channels#imessage">
    Volledige referentie voor iMessage-velden.
  </Card>
</CardGroup>

## Snelle installatie

<Tabs>
  <Tab title="Lokale Mac (snelste pad)">
    <Steps>
      <Step title="imsg installeren en verifiëren">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="OpenClaw configureren">

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

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>

      <Step title="Eerste DM-koppeling goedkeuren (standaard dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Koppelingsverzoeken verlopen na 1 uur.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac op afstand via SSH">
    OpenClaw vereist alleen een stdio-compatibele `cliPath`, dus je kunt `cliPath` naar een wrapperscript wijzen dat via SSH verbinding maakt met een externe Mac en `imsg` uitvoert.

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
    OpenClaw gebruikt strikte host-key-controle voor SCP, dus de host-key van de relayhost moet al bestaan in `~/.ssh/known_hosts`.
    Bijlagepaden worden gevalideerd tegen toegestane roots (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Vereisten en machtigingen (macOS)

- Messages moet ingelogd zijn op de Mac waarop `imsg` draait.
- Full Disk Access is vereist voor de procescontext waarin OpenClaw/`imsg` draait (toegang tot Messages-DB).
- Automatiseringsmachtiging is vereist om berichten via Messages.app te verzenden.
- Voor geavanceerde acties (react / edit / unsend / threaded reply / effects / group ops) moet System Integrity Protection zijn uitgeschakeld — zie [De private API van imsg inschakelen](#enabling-the-imsg-private-api) hieronder. Basisfunctionaliteit voor het verzenden/ontvangen van tekst en media werkt zonder dit.

<Tip>
Machtigingen worden per procescontext verleend. Als gateway headless draait (LaunchAgent/SSH), voer dan een eenmalige interactieve opdracht uit in diezelfde context om prompts te activeren:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## De private API van imsg inschakelen

`imsg` wordt geleverd in twee operationele modi:

- **Basismodus** (standaard, geen SIP-wijzigingen nodig): uitgaande tekst en media via `send`, inkomende watch/history, chatlijst. Dit is wat je direct krijgt na een verse `brew install steipete/tap/imsg` plus de standaard macOS-machtigingen hierboven.
- **Private API-modus**: `imsg` injecteert een helper-dylib in `Messages.app` om interne `IMCore`-functies aan te roepen. Dit ontgrendelt `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, plus typing indicators en read receipts.

Om toegang te krijgen tot het oppervlak voor geavanceerde acties dat deze kanaalpagina documenteert, heb je Private API-modus nodig. De `imsg` README is expliciet over de vereiste:

> Geavanceerde functies zoals `read`, `typing`, `launch`, bridge-backed rich send, berichtmutatie en chatbeheer zijn opt-in. Ze vereisen dat SIP is uitgeschakeld en dat een helper-dylib in `Messages.app` wordt geïnjecteerd. `imsg launch` weigert te injecteren wanneer SIP is ingeschakeld.

De helper-injectietechniek gebruikt de eigen dylib van `imsg` om private Messages-API's te bereiken. Er is geen server van derden of BlueBubbles-runtime in het OpenClaw iMessage-pad.

<Warning>
**SIP uitschakelen is een echte beveiligingsafweging.** SIP is een van de kernbeschermingen van macOS tegen het uitvoeren van aangepaste systeemcode; het systeembreed uitschakelen opent extra aanvalsvlak en bijwerkingen. Met name **het uitschakelen van SIP op Apple Silicon Macs schakelt ook de mogelijkheid uit om iOS-apps op je Mac te installeren en uit te voeren**.

Behandel dit als een bewuste operationele keuze, niet als standaard. Als je dreigingsmodel niet kan tolereren dat SIP uitstaat, is gebundelde iMessage beperkt tot basismodus — alleen tekst en media verzenden/ontvangen, geen reacties / edit / unsend / effecten / group ops.
</Warning>

### Installatie

1. **Installeer (of upgrade) `imsg`** op de Mac waarop Messages.app draait:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   De uitvoer van `imsg status --json` rapporteert `bridge_version`, `rpc_methods` en per methode `selectors`, zodat je kunt zien wat de huidige build ondersteunt voordat je begint.

2. **Schakel System Integrity Protection uit.** Dit is macOS-versiespecifiek omdat de onderliggende Apple-vereiste afhangt van het OS en de hardware:
   - **macOS 10.13–10.15 (Sierra–Catalina):** schakel Library Validation uit via Terminal, herstart naar Recovery Mode, voer `csrutil disable` uit, herstart.
   - **macOS 11+ (Big Sur en later), Intel:** Recovery Mode (of Internet Recovery), `csrutil disable`, herstart.
   - **macOS 11+, Apple Silicon:** opstartprocedure met de aan/uit-knop om Recovery te openen; houd op recente macOS-versies de **Left Shift**-toets ingedrukt wanneer je op Continue klikt, daarna `csrutil disable`. Virtual-machine-installaties volgen een aparte flow — maak eerst een VM-snapshot.
   - **macOS 26 / Tahoe:** library-validation-beleid en private-entitlement-controles van `imagent` zijn verder aangescherpt; `imsg` heeft mogelijk een bijgewerkte build nodig om bij te blijven. Als `imsg launch`-injectie of specifieke `selectors` na een grote macOS-upgrade false beginnen terug te geven, controleer dan de releaseopmerkingen van `imsg` voordat je aanneemt dat de SIP-stap is geslaagd.

   Volg de Recovery-mode-flow van Apple voor je Mac om SIP uit te schakelen voordat je `imsg launch` uitvoert.

3. **Injecteer de helper.** Met SIP uitgeschakeld en Messages.app ingelogd:

   ```bash
   imsg launch
   ```

   `imsg launch` weigert te injecteren wanneer SIP nog is ingeschakeld, dus dit dient ook als bevestiging dat stap 2 is gelukt.

4. **Verifieer de bridge vanuit OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   De iMessage-vermelding moet `works` rapporteren, en `imsg status --json | jq '.selectors'` moet `retractMessagePart: true` tonen plus de edit / typing / read selectors die je macOS-build blootlegt. De per-methode-gating van de OpenClaw-Plugin in `actions.ts` adverteert alleen acties waarvan de onderliggende selector `true` is, dus het actieoppervlak dat je in de toollijst van de agent ziet, weerspiegelt wat de bridge daadwerkelijk op deze host kan doen.

Als `openclaw channels status --probe` het kanaal als `works` rapporteert maar specifieke acties tijdens dispatch "iMessage `<action>` requires the imsg private API bridge" gooien, voer dan `imsg launch` opnieuw uit — de helper kan wegvallen (herstart van Messages.app, OS-update, enz.) en de gecachte status `available: true` blijft acties adverteren totdat de volgende probe wordt vernieuwd.

### Wanneer je SIP niet kunt uitschakelen

Als SIP uitgeschakeld niet acceptabel is voor je dreigingsmodel:

- `imsg` valt terug op basismodus — alleen tekst + media + ontvangen.
- De OpenClaw-Plugin adverteert nog steeds tekst/media verzenden en inkomende monitoring; hij verbergt alleen `react`, `edit`, `unsend`, `reply`, `sendWithEffect` en group ops uit het actieoppervlak (volgens de per-methode-capability-gate).
- Je kunt een aparte niet-Apple-Silicon Mac (of een toegewezen bot-Mac) met SIP uit gebruiken voor de iMessage-workload, terwijl je SIP ingeschakeld houdt op je primaire apparaten. Zie [Toegewezen bot-macOS-gebruiker (aparte iMessage-identiteit)](#deployment-patterns) hieronder.

## Toegangscontrole en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.imessage.dmPolicy` beheert directe berichten:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    Allowlist-veld: `channels.imessage.allowFrom`.

    Allowlist-vermeldingen kunnen handles, statische afzender-toegangsgroepen (`accessGroup:<name>`) of chatdoelen (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) zijn.

  </Tab>

  <Tab title="Groepsbeleid + vermeldingen">
    `channels.imessage.groupPolicy` beheert groepsafhandeling:

    - `allowlist` (standaard wanneer geconfigureerd)
    - `open`
    - `disabled`

    Allowlist voor groepsafzenders: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-vermeldingen kunnen ook verwijzen naar statische afzender-toegangsgroepen (`accessGroup:<name>`).

    Runtime-fallback: als `groupAllowFrom` niet is ingesteld, vallen controles voor iMessage-groepsafzenders terug op `allowFrom` wanneer beschikbaar.
    Runtime-opmerking: als `channels.imessage` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    <Warning>
    Groepsroutering heeft **twee** allowlist-gates die direct na elkaar draaien, en beide moeten slagen:

    1. **Afzender-/chatdoel-allowlist** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` of `chat_id`.
    2. **Groepsregister** (`channels.imessage.groups`) — met `groupPolicy: "allowlist"` vereist deze gate ofwel een wildcardvermelding `groups: { "*": { ... } }` (stelt `allowAll = true` in), of een expliciete per-`chat_id`-vermelding onder `groups`.

    Als gate 2 niets bevat, wordt elk groepsbericht geweigerd. De Plugin geeft twee signalen op `warn`-niveau op het standaard logniveau:

    - eenmalig per account bij het opstarten: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
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

    Als die `warn`-regels in het Gateway-log verschijnen, wordt gate 2 geblokkeerd — voeg het `groups`-blok toe.
    </Warning>

    Vermeld gating voor groepen:

    - iMessage heeft geen native vermeldingsmetadata
    - vermeldingsdetectie gebruikt regex-patronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - zonder geconfigureerde patronen kan vermeldingsgating niet worden afgedwongen

    Controlecommando's van geautoriseerde afzenders kunnen vermeldingsgating in groepen omzeilen.

    `systemPrompt` per groep:

    Elke entry onder `channels.imessage.groups.*` accepteert een optionele `systemPrompt`-string. De waarde wordt in de systeemprompt van de agent geinjecteerd bij elke beurt die een bericht in die groep verwerkt. De resolutie volgt dezelfde logica als de promptresolutie per groep die wordt gebruikt door `channels.whatsapp.groups`:

    1. **Groepsspecifieke systeemprompt** (`groups["<chat_id>"].systemPrompt`): gebruikt wanneer de specifieke groepsentry in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt op die groep toegepast.
    2. **Wildcard-systeemprompt voor groepen** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsentry volledig ontbreekt in de map, of wanneer deze bestaat maar geen sleutel `systemPrompt` definieert.

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

    Prompts per groep gelden alleen voor groepsberichten — directe berichten in dit kanaal worden niet beinvloed.

  </Tab>

  <Tab title="Sessies en deterministische antwoorden">
    - DM's gebruiken directe routering; groepen gebruiken groepsroutering.
    - Met de standaardinstelling `session.dmScope=main` worden iMessage-DM's samengevoegd in de hoofdsessie van de agent.
    - Groepssessies zijn geisoleerd (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antwoorden worden terug naar iMessage gerouteerd met metadata van het oorspronkelijke kanaal/doel.

    Groepsachtig threadgedrag:

    Sommige iMessage-threads met meerdere deelnemers kunnen binnenkomen met `is_group=false`.
    Als die `chat_id` expliciet is geconfigureerd onder `channels.imessage.groups`, behandelt OpenClaw deze als groepsverkeer (groepsgating + isolatie van groepssessies).

  </Tab>
</Tabs>

## ACP-gesprekskoppelingen

Legacy iMessage-chats kunnen ook aan ACP-sessies worden gekoppeld.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit binnen de DM of toegestane groepschat.
- Toekomstige berichten in hetzelfde iMessage-gesprek worden naar de gespawnde ACP-sessie gerouteerd.
- `/new` en `/reset` resetten dezelfde gekoppelde ACP-sessie op zijn plek.
- `/acp close` sluit de ACP-sessie en verwijdert de koppeling.

Geconfigureerde permanente koppelingen worden ondersteund via top-level `bindings[]`-entries met `type: "acp"` en `match.channel: "imessage"`.

`match.peer.id` kan het volgende gebruiken:

- genormaliseerde DM-handle zoals `+15555550123` of `user@example.com`
- `chat_id:<id>` (aanbevolen voor stabiele groepskoppelingen)
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

Zie [ACP-agenten](/nl/tools/acp-agents) voor gedeeld ACP-koppelingsgedrag.

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Toegewijde botgebruiker op macOS (aparte iMessage-identiteit)">
    Gebruik een toegewijde Apple ID en macOS-gebruiker zodat botverkeer is geisoleerd van je persoonlijke Messages-profiel.

    Typische flow:

    1. Maak een toegewijde macOS-gebruiker aan of log daarop in.
    2. Log in die gebruiker in bij Messages met de Apple ID van de bot.
    3. Installeer `imsg` in die gebruiker.
    4. Maak een SSH-wrapper zodat OpenClaw `imsg` in de context van die gebruiker kan uitvoeren.
    5. Wijs `channels.imessage.accounts.<id>.cliPath` en `.dbPath` naar dat gebruikersprofiel.

    De eerste uitvoering kan GUI-goedkeuringen vereisen (Automation + Full Disk Access) in die botgebruikerssessie.

  </Accordion>

  <Accordion title="Externe Mac via Tailscale (voorbeeld)">
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
    Zorg eerst dat de hostsleutel wordt vertrouwd (bijvoorbeeld `ssh bot@mac-mini.tailnet-1234.ts.net`) zodat `known_hosts` wordt gevuld.

  </Accordion>

  <Accordion title="Multi-accountpatroon">
    iMessage ondersteunt configuratie per account onder `channels.imessage.accounts`.

    Elk account kan velden overschrijven zoals `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geschiedenisinstellingen en allowlists voor bijlageroots.

  </Accordion>
</AccordionGroup>

## Media, chunking en afleverdoelen

<AccordionGroup>
  <Accordion title="Bijlagen en media">
    - verwerking van binnenkomende bijlagen staat **standaard uit** — stel `channels.imessage.includeAttachments: true` in om foto's, spraakmemo's, video's en andere bijlagen naar de agent door te sturen. Als dit is uitgeschakeld, worden iMessages die alleen uit bijlagen bestaan verwijderd voordat ze de agent bereiken en produceren ze mogelijk helemaal geen logregel `Inbound message`.
    - externe bijlagepaden kunnen via SCP worden opgehaald wanneer `remoteHost` is ingesteld
    - bijlagepaden moeten overeenkomen met toegestane roots:
      - `channels.imessage.attachmentRoots` (lokaal)
      - `channels.imessage.remoteAttachmentRoots` (externe SCP-modus)
      - standaard rootpatroon: `/Users/*/Library/Messages/Attachments`
    - SCP gebruikt strikte hostsleutelcontrole (`StrictHostKeyChecking=yes`)
    - grootte van uitgaande media gebruikt `channels.imessage.mediaMaxMb` (standaard 16 MB)

  </Accordion>

  <Accordion title="Uitgaande chunking">
    - tekstchunklimiet: `channels.imessage.textChunkLimit` (standaard 4000)
    - chunkmodus: `channels.imessage.chunkMode`
      - `length` (standaard)
      - `newline` (splitsen met alinea's eerst)

  </Accordion>

  <Accordion title="Adresseringsindelingen">
    Aanbevolen expliciete doelen:

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

## Private API-acties

Wanneer `imsg launch` draait en `openclaw channels status --probe` `privateApi.available: true` rapporteert, kan de berichttool naast normale tekstverzending ook iMessage-native acties gebruiken.

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
    - **react**: Voeg iMessage-tapbacks toe of verwijder ze (`messageId`, `emoji`, `remove`). Ondersteunde tapbacks mappen naar love, like, dislike, laugh, emphasize en question.
    - **reply**: Verstuur een threaded antwoord naar een bestaand bericht (`messageId`, `text` of `message`, plus `chatGuid`, `chatId`, `chatIdentifier` of `to`).
    - **sendWithEffect**: Verstuur tekst met een iMessage-effect (`text` of `message`, `effect` of `effectId`).
    - **edit**: Bewerk een verzonden bericht op ondersteunde macOS/private API-versies (`messageId`, `text` of `newText`).
    - **unsend**: Trek een verzonden bericht in op ondersteunde macOS/private API-versies (`messageId`).
    - **upload-file**: Verstuur media/bestanden (`buffer` als base64 of een gehydrateerde `media`/`path`/`filePath`, `filename`, optioneel `asVoice`). Legacy-alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Beheer groepschats wanneer het huidige doel een groepsgesprek is.

  </Accordion>

  <Accordion title="Bericht-ID's">
    Binnenkomende iMessage-context bevat zowel korte `MessageSid`-waarden als volledige bericht-GUID's wanneer beschikbaar. Korte ID's zijn beperkt tot de recente in-memory antwoordcache en worden voor gebruik gecontroleerd tegen de huidige chat. Als een korte ID is verlopen of bij een andere chat hoort, probeer het opnieuw met de volledige `MessageSidFull`.

  </Accordion>

  <Accordion title="Capabiliteitsdetectie">
    OpenClaw verbergt private API-acties alleen wanneer de gecachete probestatus zegt dat de bridge niet beschikbaar is. Als de status onbekend is, blijven acties zichtbaar en voeren dispatches lui probes uit zodat de eerste actie kan slagen na `imsg launch` zonder afzonderlijke handmatige statusverversing.

  </Accordion>

  <Accordion title="Leesbewijzen en typen">
    Wanneer de private API-bridge actief is, worden geaccepteerde binnenkomende chats als gelezen gemarkeerd voordat ze worden gedispatcht en wordt een typballon aan de afzender getoond terwijl de agent genereert. Schakel leesmarkering uit met:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Oudere `imsg`-builds van voor de capabiliteitslijst per methode schakelen typen/lezen stilletjes uit; OpenClaw logt een eenmalige waarschuwing per herstart zodat het ontbrekende leesbewijs verklaarbaar is.

  </Accordion>
</AccordionGroup>

## Configuratiewrites

iMessage staat standaard door het kanaal geinitieerde configuratiewrites toe (voor `/config set|unset` wanneer `commands.config: true`).

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

## Gesplitst verzonden DM's samenvoegen (commando + URL in een compositie)

Wanneer een gebruiker een commando en een URL samen typt — bijvoorbeeld `Dump https://example.com/article` — splitst Apple's Messages-app de verzending in **twee afzonderlijke `chat.db`-rijen**:

1. Een tekstbericht (`"Dump"`).
2. Een URL-previewballon (`"https://..."`) met OG-previewafbeeldingen als bijlagen.

De twee rijen komen op de meeste setups ongeveer 0,8-2,0 s na elkaar aan bij OpenClaw. Zonder samenvoegen ontvangt de agent alleen het commando in beurt 1, antwoordt (vaak "stuur me de URL") en ziet de URL pas in beurt 2 — op dat moment is de commandocontext al verloren. Dit is Apple's verzendpipeline, niet iets dat OpenClaw of `imsg` introduceert.

`channels.imessage.coalesceSameSenderDms` laat een DM opeenvolgende rijen van dezelfde afzender samenvoegen tot een enkele agentbeurt. Groepschats blijven per bericht dispatchen zodat de beurtstructuur met meerdere gebruikers behouden blijft.

<Tabs>
  <Tab title="Wanneer inschakelen">
    Schakel dit in wanneer:

    - Je Skills levert die `command + payload` in een bericht verwachten (dump, paste, save, queue, enz.).
    - Je gebruikers URL's, afbeeldingen of lange inhoud naast commando's plakken.
    - Je de extra DM-beurtlatentie kunt accepteren (zie hieronder).

    Laat dit uitgeschakeld wanneer:

    - Je minimale commandolatentie nodig hebt voor DM-triggers van een woord.
    - Al je flows eenmalige commando's zonder payload-follow-ups zijn.

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

    Met de vlag ingeschakeld en zonder expliciete `messages.inbound.byChannel.imessage` wordt het debounce-venster verbreed naar **2500 ms** (de verouderde standaard is 0 ms — geen debouncing). Het bredere venster is vereist omdat Apples split-send-cadans van 0,8-2,0 s niet in een strakkere standaard past.

    Om het venster zelf af te stemmen:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Afwegingen">
    - **Toegevoegde latentie voor DM-berichten.** Met de vlag ingeschakeld wacht elke DM (inclusief zelfstandige besturingsopdrachten en opvolgingen met één tekstbericht) maximaal het debounce-venster voordat deze wordt verzonden, voor het geval er een payload-rij aankomt. Groepchatberichten blijven direct verzonden worden.
    - **Samengevoegde uitvoer is begrensd.** Samengevoegde tekst is begrensd op 4000 tekens met een expliciete markering `…[truncated]`; bijlagen zijn begrensd op 20; bronitems zijn begrensd op 10 (eerste-plus-laatste worden daarna behouden). Elke bron-GUID wordt bijgehouden in `coalescedMessageGuids` voor downstream telemetrie.
    - **Alleen DM.** Groepchats vallen terug op verzending per bericht, zodat de bot responsief blijft wanneer meerdere mensen typen.
    - **Opt-in, per kanaal.** Andere kanalen (Telegram, WhatsApp, Slack, …) worden niet beïnvloed. Verouderde BlueBubbles-configuraties die `channels.bluebubbles.coalesceSameSenderDms` instellen, moeten die waarde migreren naar `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenario's en wat de agent ziet

| Gebruiker stelt op                                                 | `chat.db` produceert  | Vlag uit (standaard)                    | Vlag aan + venster van 2500 ms                                          |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (één verzending)                        | 2 rijen ~1 s uit elkaar | Twee agentbeurten: alleen "Dump", daarna URL | Eén beurt: samengevoegde tekst `Dump https://example.com`               |
| `Save this 📎image.jpg caption` (bijlage + tekst)                  | 2 rijen               | Twee beurten (bijlage verwijderd bij samenvoeging) | Eén beurt: tekst + afbeelding behouden                                  |
| `/status` (zelfstandige opdracht)                                  | 1 rij                 | Directe verzending                      | **Wacht maximaal venster, verzend daarna**                              |
| Alleen geplakte URL                                                | 1 rij                 | Directe verzending                      | Directe verzending (slechts één item in bucket)                         |
| Tekst + URL verzonden als twee bewuste afzonderlijke berichten, minuten uit elkaar | 2 rijen buiten venster | Twee beurten                            | Twee beurten (venster verloopt ertussen)                                |
| Snelle stroom (>10 kleine DM's binnen venster)                     | N rijen               | N beurten                               | Eén beurt, begrensde uitvoer (eerste + laatste, tekst-/bijlagelimieten toegepast) |
| Twee mensen typen in een groepchat                                 | N rijen van M afzenders | M+ beurten (één per afzenderbucket)     | M+ beurten — groepchats worden niet samengevoegd                        |

## Inhalen na downtime van de Gateway

Wanneer de Gateway offline is (crash, herstart, Mac-sluimerstand, machine uit), hervat `imsg watch` vanaf de huidige `chat.db`-status zodra de Gateway weer beschikbaar is — alles wat tijdens het gat is aangekomen, wordt standaard nooit gezien. Inhalen speelt die berichten opnieuw af bij de volgende start, zodat de agent geen inkomend verkeer stilletjes mist.

Inhalen is **standaard uitgeschakeld**. Schakel het per kanaal in:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Hoe het draait

Eén pass per start van `monitorIMessageProvider`, in de volgorde `imsg launch` gereed → `watch.subscribe` → `performIMessageCatchup` → live verzendlus. Inhalen zelf gebruikt `chats.list` + per-chat `messages.history` tegen dezelfde JSON-RPC-client die door `imsg watch` wordt gebruikt. Alles wat tijdens de inhaalpass aankomt, loopt normaal via live verzending; de bestaande inbound-dedupe-cache absorbeert eventuele overlap met opnieuw afgespeelde rijen.

Elke opnieuw afgespeelde rij wordt door het live verzendpad geleid (`evaluateIMessageInbound` + `dispatchInboundMessage`), zodat allowlists, groepsbeleid, debouncer, echo-cache en leesbevestigingen identiek werken voor opnieuw afgespeelde en live berichten.

### Cursor- en retrysemantiek

Inhalen bewaart een cursor per account op `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (de OpenClaw-statusmap is standaard `~/.openclaw`, te overschrijven met `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- De cursor schuift op na elke succesvolle verzending en blijft staan wanneer de verzending van een rij een fout gooit — de volgende start probeert dezelfde rij opnieuw vanaf de vastgehouden cursor.
- Na `maxFailureRetries` opeenvolgende fouten voor dezelfde `guid` logt inhalen een `warn` en schuift de cursor geforceerd voorbij het vastgelopen bericht, zodat volgende starts voortgang kunnen maken.
- GUID's die al zijn opgegeven, worden bij latere runs bij het zien overgeslagen (geen verzendpoging) en meegeteld onder `skippedGivenUp` in de runsamenvatting.

### Voor operators zichtbare signalen

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Een regel `WARN ... capped to perRunLimit` betekent dat één start de volledige backlog niet heeft leeggemaakt. Verhoog `perRunLimit` (max. 500) als je gaten regelmatig groter zijn dan de standaardpass van 50 rijen.

### Wanneer je het uit laat

- Gateway draait continu met watchdog-autoherstart en gaten zijn altijd < een paar seconden — de standaard uitgeschakelde stand is prima.
- DM-volume is laag en gemiste berichten zouden het agentgedrag niet wijzigen — het initiële venster `firstRunLookbackMinutes` kan verrassende oude context verzenden bij de eerste inschakeling.

Wanneer je inhalen inschakelt, kijkt de eerste start zonder cursor alleen `firstRunLookbackMinutes` terug (standaard 30 min), niet het volledige venster `maxAgeMinutes` — dit voorkomt het opnieuw afspelen van een lange geschiedenis aan berichten van vóór inschakeling.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="imsg niet gevonden of RPC niet ondersteund">
    Valideer de binary en RPC-ondersteuning:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Als de probe meldt dat RPC niet wordt ondersteund, werk `imsg` bij. Als private API-acties niet beschikbaar zijn, voer `imsg launch` uit in de ingelogde macOS-gebruikerssessie en voer de probe opnieuw uit. Als de Gateway niet op macOS draait, gebruik dan in plaats van het standaard lokale `imsg`-pad de configuratie Remote Mac over SSH hierboven.

  </Accordion>

  <Accordion title="Gateway draait niet op macOS">
    Het standaard `cliPath: "imsg"` moet draaien op de Mac die bij Berichten is ingelogd. Stel op Linux of Windows `channels.imessage.cliPath` in op een wrapperscript dat via SSH naar die Mac gaat en `imsg "$@"` uitvoert.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Voer daarna uit:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM's worden genegeerd">
    Controleer:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - koppelingsgoedkeuringen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Groepsberichten worden genegeerd">
    Controleer:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - allowlist-gedrag van `channels.imessage.groups`
    - configuratie van vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Externe bijlagen mislukken">
    Controleer:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-sleutelauthenticatie vanaf de Gateway-host
    - hostsleutel bestaat in `~/.ssh/known_hosts` op de Gateway-host
    - leesbaarheid van het externe pad op de Mac waarop Berichten draait

  </Accordion>

  <Accordion title="macOS-permissieprompts zijn gemist">
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
- [Koppelen](/nl/channels/pairing)

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Verwijdering van BlueBubbles en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) — aankondiging en migratiesamenvatting
- [Afkomstig van BlueBubbles](/nl/channels/imessage-from-bluebubbles) — configuratievertaaltabel en stapsgewijze overgang
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepchatgedrag en vermeldingsafscherming
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
