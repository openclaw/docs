---
read_when:
    - iMessage-ondersteuning instellen
    - Foutopsporing voor verzenden/ontvangen via iMessage
summary: Native iMessage-ondersteuning via imsg (JSON-RPC via stdio), met private API-acties voor antwoorden, tapbacks, effecten, bijlagen en groepsbeheer. Aanbevolen voor nieuwe OpenClaw iMessage-configuraties wanneer aan de hostvereisten wordt voldaan.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Gebruik voor OpenClaw iMessage-implementaties `imsg` op een ingelogde macOS Messages-host. Als je Gateway op Linux of Windows draait, wijs `channels.imessage.cliPath` dan naar een SSH-wrapper die `imsg` op de Mac uitvoert.

**Inhalen na Gateway-downtime is opt-in.** Wanneer ingeschakeld (`channels.imessage.catchup.enabled: true`), speelt de Gateway binnenkomende berichten opnieuw af die in `chat.db` zijn beland terwijl hij offline was (crash, herstart, Mac-slaapstand) bij de volgende opstart. Standaard uitgeschakeld — zie [Inhalen na Gateway-downtime](#catching-up-after-gateway-downtime). Sluit [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
BlueBubbles-ondersteuning is verwijderd. Migreer `channels.bluebubbles`-configuraties naar `channels.imessage`; OpenClaw ondersteunt iMessage alleen via `imsg`.
</Warning>

Status: native externe CLI-integratie. Gateway start `imsg rpc` en communiceert via JSON-RPC op stdio (geen afzonderlijke daemon/poort). Geavanceerde acties vereisen `imsg launch` en een geslaagde private API-probe.

<CardGroup cols={3}>
  <Card title="Private API-acties" icon="wand-sparkles" href="#private-api-actions">
    Antwoorden, tapbacks, effecten, bijlagen en groepsbeheer.
  </Card>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    iMessage-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Externe Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gebruik een SSH-wrapper wanneer de Gateway niet op de Messages-Mac draait.
  </Card>
  <Card title="Configuratiereferentie" icon="settings" href="/nl/gateway/config-channels#imessage">
    Volledige iMessage-veldreferentie.
  </Card>
</CardGroup>

## Snelle installatie

<Tabs>
  <Tab title="Lokale Mac (snelle route)">
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

      <Step title="Start de Gateway">

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

    Als `remoteHost` niet is ingesteld, probeert OpenClaw dit automatisch te detecteren door het SSH-wrapperscript te parseren.
    `remoteHost` moet `host` of `user@host` zijn (geen spaties of SSH-opties).
    OpenClaw gebruikt strikte host-key-controle voor SCP, dus de host-key van de relayhost moet al bestaan in `~/.ssh/known_hosts`.
    Bijlagepaden worden gevalideerd tegen toegestane roots (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Vereisten en machtigingen (macOS)

- Messages moet ingelogd zijn op de Mac waarop `imsg` draait.
- Volledige schijftoegang is vereist voor de procescontext waarin OpenClaw/`imsg` draait (toegang tot de Messages-DB).
- Automatiseringsmachtiging is vereist om berichten via Messages.app te verzenden.
- Voor geavanceerde acties (reageren / bewerken / verzenden ongedaan maken / antwoord in thread / effecten / groepsacties) moet System Integrity Protection zijn uitgeschakeld — zie [De private API van imsg inschakelen](#enabling-the-imsg-private-api) hieronder. Basistekst en media verzenden/ontvangen werkt zonder dit.

<Tip>
Machtigingen worden per procescontext verleend. Als de Gateway headless draait (LaunchAgent/SSH), voer dan een eenmalige interactieve opdracht uit in diezelfde context om prompts te activeren:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## De private API van imsg inschakelen

`imsg` wordt geleverd in twee operationele modi:

- **Basismodus** (standaard, geen SIP-wijzigingen nodig): uitgaande tekst en media via `send`, inkomende watch/history, chatlijst. Dit krijg je standaard na een verse `brew install steipete/tap/imsg` plus de standaard macOS-machtigingen hierboven.
- **Private API-modus**: `imsg` injecteert een helper-dylib in `Messages.app` om interne `IMCore`-functies aan te roepen. Dit ontgrendelt `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, plus typindicatoren en leesbevestigingen.

Om het geavanceerde actieoppervlak te bereiken dat deze kanaalpagina documenteert, heb je de Private API-modus nodig. De `imsg` README is expliciet over de vereiste:

> Geavanceerde functies zoals `read`, `typing`, `launch`, bridge-ondersteunde rich send, berichtmutatie en chatbeheer zijn opt-in. Ze vereisen dat SIP is uitgeschakeld en dat een helper-dylib in `Messages.app` wordt geïnjecteerd. `imsg launch` weigert te injecteren wanneer SIP is ingeschakeld.

De helper-injectietechniek gebruikt de eigen dylib van `imsg` om private API's van Messages te bereiken. Er is geen server van derden of BlueBubbles-runtime in het OpenClaw iMessage-pad.

<Warning>
**SIP uitschakelen is een echte beveiligingsafweging.** SIP is een van de kernbeschermingen van macOS tegen het uitvoeren van aangepaste systeemcode; dit systeembreed uitschakelen opent extra aanvalsvlak en neveneffecten. Met name **schakelt het uitschakelen van SIP op Apple Silicon-Macs ook de mogelijkheid uit om iOS-apps op je Mac te installeren en uit te voeren**.

Beschouw dit als een bewuste operationele keuze, niet als standaard. Als je dreigingsmodel niet kan tolereren dat SIP uit staat, is de gebundelde iMessage beperkt tot basismodus — alleen tekst en media verzenden/ontvangen, geen reacties / bewerken / verzenden ongedaan maken / effecten / groepsacties.
</Warning>

### Installatie

1. **Installeer (of upgrade) `imsg`** op de Mac waarop Messages.app draait:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   De uitvoer van `imsg status --json` rapporteert `bridge_version`, `rpc_methods` en per methode `selectors`, zodat je kunt zien wat de huidige build ondersteunt voordat je begint.

2. **Schakel System Integrity Protection uit.** Dit is macOS-versiespecifiek omdat de onderliggende Apple-vereiste afhangt van het besturingssysteem en de hardware:
   - **macOS 10.13–10.15 (Sierra–Catalina):** schakel Library Validation uit via Terminal, herstart naar Recovery Mode, voer `csrutil disable` uit, herstart.
   - **macOS 11+ (Big Sur en later), Intel:** Recovery Mode (of Internet Recovery), `csrutil disable`, herstart.
   - **macOS 11+, Apple Silicon:** opstartreeks met de aan/uit-knop om Recovery te openen; houd op recente macOS-versies de **Left Shift**-toets ingedrukt wanneer je op Continue klikt, daarna `csrutil disable`. Virtuele-machine-installaties volgen een afzonderlijke flow — maak eerst een VM-snapshot.
   - **macOS 26 / Tahoe:** beleid voor library-validation en private-entitlement-controles van `imagent` zijn verder aangescherpt; `imsg` heeft mogelijk een bijgewerkte build nodig om bij te blijven. Als injectie met `imsg launch` of specifieke `selectors` na een grote macOS-upgrade false beginnen te retourneren, controleer dan de release notes van `imsg` voordat je aanneemt dat de SIP-stap is geslaagd.

   Volg de Recovery-mode-flow van Apple voor je Mac om SIP uit te schakelen voordat je `imsg launch` uitvoert.

3. **Injecteer de helper.** Met SIP uitgeschakeld en Messages.app ingelogd:

   ```bash
   imsg launch
   ```

   `imsg launch` weigert te injecteren wanneer SIP nog steeds is ingeschakeld, dus dit dient ook als bevestiging dat stap 2 is gelukt.

4. **Verifieer de bridge vanuit OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   De iMessage-vermelding moet `works` rapporteren, en `imsg status --json | jq '.selectors'` moet `retractMessagePart: true` tonen plus de edit- / typing- / read-selectors die je macOS-build beschikbaar stelt. De per-methode-gating van de OpenClaw-plugin in `actions.ts` adverteert alleen acties waarvan de onderliggende selector `true` is, zodat het actieoppervlak dat je in de toollijst van de agent ziet weerspiegelt wat de bridge daadwerkelijk op deze host kan doen.

Als `openclaw channels status --probe` het kanaal als `works` rapporteert maar specifieke acties tijdens dispatch "iMessage `<action>` requires the imsg private API bridge" geven, voer dan `imsg launch` opnieuw uit — de helper kan wegvallen (herstart van Messages.app, OS-update, enz.) en de gecachte status `available: true` blijft acties adverteren totdat de volgende probe wordt ververst.

### Wanneer je SIP niet kunt uitschakelen

Als SIP uitgeschakeld niet acceptabel is voor je dreigingsmodel:

- `imsg` valt terug naar basismodus — alleen tekst + media + ontvangen.
- De OpenClaw-plugin adverteert nog steeds tekst/media verzenden en inkomende monitoring; hij verbergt alleen `react`, `edit`, `unsend`, `reply`, `sendWithEffect` en groepsacties uit het actieoppervlak (volgens de per-methode capability gate).
- Je kunt een afzonderlijke niet-Apple-Silicon-Mac (of een dedicated bot-Mac) met SIP uit gebruiken voor de iMessage-workload, terwijl SIP op je primaire apparaten ingeschakeld blijft. Zie [Dedicated bot-macOS-gebruiker (afzonderlijke iMessage-identiteit)](#deployment-patterns) hieronder.

## Toegangscontrole en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.imessage.dmPolicy` beheert directe berichten:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    Allowlist-veld: `channels.imessage.allowFrom`.

    Allowlist-vermeldingen kunnen handles, statische sender access groups (`accessGroup:<name>`) of chatdoelen (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) zijn.

  </Tab>

  <Tab title="Groepsbeleid + vermeldingen">
    `channels.imessage.groupPolicy` beheert groepsafhandeling:

    - `allowlist` (standaard wanneer geconfigureerd)
    - `open`
    - `disabled`

    Allowlist voor groepsafzenders: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-vermeldingen kunnen ook verwijzen naar statische sender access groups (`accessGroup:<name>`).

    Runtime-fallback: als `groupAllowFrom` niet is ingesteld, vallen iMessage-controles voor groepsafzenders terug op `allowFrom` wanneer beschikbaar.
    Runtime-opmerking: als `channels.imessage` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    <Warning>
    Groepsroutering heeft **twee** allowlist-gates die direct na elkaar draaien, en beide moeten slagen:

    1. **Allowlist voor afzender / chatdoel** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` of `chat_id`.
    2. **Groepsregister** (`channels.imessage.groups`) — met `groupPolicy: "allowlist"` vereist deze gate ofwel een wildcard-vermelding `groups: { "*": { ... } }` (stelt `allowAll = true` in), of een expliciete vermelding per `chat_id` onder `groups`.

    Als gate 2 niets bevat, wordt elk groepsbericht verwijderd. De Plugin geeft twee `warn`-niveausignalen op het standaard logniveau:

    - eenmalig per account bij opstarten: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - eenmalig per `chat_id` tijdens runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM's blijven werken omdat ze een ander codepad nemen.

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

    Als die `warn`-regels in de Gateway-log verschijnen, dropt gate 2 — voeg het `groups`-blok toe.
    </Warning>

    Mention-gating voor groepen:

    - iMessage heeft geen native mention-metadata
    - mention-detectie gebruikt regex-patronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - zonder geconfigureerde patronen kan mention-gating niet worden afgedwongen

    Besturingscommando's van geautoriseerde afzenders kunnen mention-gating in groepen omzeilen.

    Per-groep `systemPrompt`:

    Elk item onder `channels.imessage.groups.*` accepteert een optionele `systemPrompt`-tekenreeks. De waarde wordt in de systeemprompt van de agent ingevoegd bij elke beurt die een bericht in die groep verwerkt. De resolutie weerspiegelt de per-groep promptresolutie die door `channels.whatsapp.groups` wordt gebruikt:

    1. **Groepsspecifieke systeemprompt** (`groups["<chat_id>"].systemPrompt`): gebruikt wanneer het specifieke groepsitem in de map bestaat **en** de sleutel `systemPrompt` ervan is gedefinieerd. Als `systemPrompt` een lege tekenreeks (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt op die groep toegepast.
    2. **Groepswildcard-systeemprompt** (`groups["*"].systemPrompt`): gebruikt wanneer het specifieke groepsitem volledig ontbreekt in de map, of wanneer het bestaat maar geen sleutel `systemPrompt` definieert.

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

  <Tab title="Sessies en deterministische antwoorden">
    - DM's gebruiken directe routering; groepen gebruiken groepsroutering.
    - Met de standaardinstelling `session.dmScope=main` worden iMessage-DM's samengevoegd in de hoofdsessie van de agent.
    - Groepssessies zijn geïsoleerd (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antwoorden worden terug naar iMessage gerouteerd met metadata van het oorspronkelijke kanaal/doel.

    Groepachtig threadgedrag:

    Sommige iMessage-threads met meerdere deelnemers kunnen binnenkomen met `is_group=false`.
    Als die `chat_id` expliciet is geconfigureerd onder `channels.imessage.groups`, behandelt OpenClaw dit als groepsverkeer (groepsgating + isolatie van groepssessies).

  </Tab>
</Tabs>

## ACP-gespreksbindingen

Oude iMessage-chats kunnen ook aan ACP-sessies worden gebonden.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit in de DM of toegestane groepschat.
- Toekomstige berichten in hetzelfde iMessage-gesprek worden naar de gespawnde ACP-sessie gerouteerd.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie ter plekke.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Geconfigureerde permanente bindingen worden ondersteund via top-level `bindings[]`-items met `type: "acp"` en `match.channel: "imessage"`.

`match.peer.id` kan gebruiken:

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

Zie [ACP Agents](/nl/tools/acp-agents) voor gedeeld ACP-bindingsgedrag.

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Toegewijde bot-macOS-gebruiker (afzonderlijke iMessage-identiteit)">
    Gebruik een toegewijde Apple ID en macOS-gebruiker zodat botverkeer is geïsoleerd van je persoonlijke Berichten-profiel.

    Typische flow:

    1. Maak een toegewijde macOS-gebruiker aan of log erop in.
    2. Log in bij Berichten met de Apple ID van de bot in die gebruiker.
    3. Installeer `imsg` in die gebruiker.
    4. Maak een SSH-wrapper zodat OpenClaw `imsg` in die gebruikerscontext kan uitvoeren.
    5. Wijs `channels.imessage.accounts.<id>.cliPath` en `.dbPath` naar dat gebruikersprofiel.

    De eerste uitvoering kan GUI-goedkeuringen vereisen (Automatisering + Volledige schijftoegang) in die botgebruikerssessie.

  </Accordion>

  <Accordion title="Externe Mac via Tailscale (voorbeeld)">
    Algemene topologie:

    - gateway draait op Linux/VM
    - iMessage + `imsg` draait op een Mac in je tailnet
    - `cliPath`-wrapper gebruikt SSH om `imsg` uit te voeren
    - `remoteHost` schakelt het ophalen van SCP-bijlagen in

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

  <Accordion title="Multi-accountpatroon">
    iMessage ondersteunt configuratie per account onder `channels.imessage.accounts`.

    Elk account kan velden overschrijven zoals `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geschiedenisinstellingen en allowlists voor bijlageroots.

  </Accordion>
</AccordionGroup>

## Media, chunking en bezorgdoelen

<AccordionGroup>
  <Accordion title="Bijlagen en media">
    - opname van inkomende bijlagen staat **standaard uit** — stel `channels.imessage.includeAttachments: true` in om foto's, spraakmemo's, video en andere bijlagen naar de agent door te sturen. Als dit is uitgeschakeld, worden iMessages met alleen bijlagen weggegooid voordat ze de agent bereiken en produceren ze mogelijk helemaal geen logregel `Inbound message`.
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
    Voorkeursdoelen met expliciete notatie:

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

Wanneer `imsg launch` draait en `openclaw channels status --probe` `privateApi.available: true` rapporteert, kan de berichttool naast normale tekstverzendingen ook iMessage-native acties gebruiken.

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
    - **react**: iMessage-tapbacks toevoegen/verwijderen (`messageId`, `emoji`, `remove`). Ondersteunde tapbacks mappen naar love, like, dislike, laugh, emphasize en question.
    - **reply**: Een threaded antwoord naar een bestaand bericht sturen (`messageId`, `text` of `message`, plus `chatGuid`, `chatId`, `chatIdentifier` of `to`).
    - **sendWithEffect**: Tekst met een iMessage-effect sturen (`text` of `message`, `effect` of `effectId`).
    - **edit**: Een verzonden bericht bewerken op ondersteunde macOS-/Private API-versies (`messageId`, `text` of `newText`).
    - **unsend**: Een verzonden bericht intrekken op ondersteunde macOS-/Private API-versies (`messageId`).
    - **upload-file**: Media/bestanden sturen (`buffer` als base64 of een gehydrateerde `media`/`path`/`filePath`, `filename`, optioneel `asVoice`). Legacy-alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Groepschats beheren wanneer het huidige doel een groepsgesprek is.

  </Accordion>

  <Accordion title="Bericht-ID's">
    Inkomende iMessage-context bevat zowel korte `MessageSid`-waarden als volledige bericht-GUID's wanneer beschikbaar. Korte ID's zijn beperkt tot de recente in-memory antwoordcache en worden vóór gebruik gecontroleerd tegen de huidige chat. Als een korte ID is verlopen of bij een andere chat hoort, probeer het opnieuw met de volledige `MessageSidFull`.

  </Accordion>

  <Accordion title="Capaciteitsdetectie">
    OpenClaw verbergt Private API-acties alleen wanneer de gecachte probestatus aangeeft dat de bridge niet beschikbaar is. Als de status onbekend is, blijven acties zichtbaar en voeren dispatches probes lazy uit zodat de eerste actie na `imsg launch` kan slagen zonder afzonderlijke handmatige statusverversing.

  </Accordion>

  <Accordion title="Leesbewijzen en typen">
    Wanneer de Private API-bridge actief is, worden geaccepteerde inkomende chats vóór dispatch als gelezen gemarkeerd en wordt er een typballon aan de afzender getoond terwijl de agent genereert. Schakel leesmarkering uit met:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Oudere `imsg`-builds van vóór de capaciteitslijst per methode schakelen typen/lezen stil uit; OpenClaw logt één waarschuwing per herstart zodat het ontbrekende leesbewijs verklaarbaar is.

  </Accordion>
</AccordionGroup>

## Configuratiewijzigingen

iMessage staat standaard door het kanaal geïnitieerde configuratiewijzigingen toe (voor `/config set|unset` wanneer `commands.config: true`).

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

## Gesplitst verzonden DM's samenvoegen (commando + URL in één compositie)

Wanneer een gebruiker een commando en een URL samen typt — bijv. `Dump https://example.com/article` — splitst Apple's Berichten-app de verzending in **twee afzonderlijke `chat.db`-rijen**:

1. Een tekstbericht (`"Dump"`).
2. Een URL-previewballon (`"https://..."`) met OG-previewafbeeldingen als bijlagen.

De twee rijen komen op de meeste setups ongeveer 0,8-2,0 s na elkaar binnen bij OpenClaw. Zonder samenvoeging ontvangt de agent alleen het commando in beurt 1, antwoordt (vaak "stuur me de URL") en ziet de URL pas in beurt 2 — op dat punt is de commandocontext al verloren. Dit is Apple's verzendpipeline, niet iets dat OpenClaw of `imsg` introduceert.

`channels.imessage.coalesceSameSenderDms` laat een DM opeenvolgende rijen van dezelfde afzender samenvoegen tot één agentbeurt. Groepschats blijven per bericht dispatchen zodat de beurtenstructuur voor meerdere gebruikers behouden blijft.

<Tabs>
  <Tab title="Wanneer inschakelen">
    Schakel in wanneer:

    - Je Skills levert die `command + payload` in één bericht verwachten (dump, paste, save, queue, enz.).
    - Je gebruikers URL's, afbeeldingen of lange inhoud naast commando's plakken.
    - Je de extra DM-beurtlatentie kunt accepteren (zie hieronder).

    Laat uitgeschakeld wanneer:

    - Je minimale commandolatentie nodig hebt voor DM-triggers van één woord.
    - Al je flows eenmalige commando's zijn zonder payload-follow-ups.

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

    Met de vlag ingeschakeld en zonder expliciete `messages.inbound.byChannel.imessage` wordt het debounce-venster verbreed naar **2500 ms** (de oude standaard is 0 ms — geen debouncing). Het bredere venster is vereist omdat Apples split-send-cadans van 0,8-2,0 s niet past binnen een strakkere standaard.

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
  <Tab title="Trade-offs">
    - **Extra latency voor DM-berichten.** Met de vlag ingeschakeld wacht elke DM (inclusief zelfstandige besturingscommando's en opvolgingen met één tekstbericht) tot maximaal het debounce-venster voordat deze wordt verzonden, voor het geval er nog een payload-rij aankomt. Groepschatberichten blijven direct verzonden worden.
    - **Samengevoegde uitvoer is begrensd.** Samengevoegde tekst is begrensd op 4000 tekens met een expliciete markering `…[truncated]`; bijlagen zijn begrensd op 20; bronvermeldingen zijn begrensd op 10 (eerste-plus-laatste blijven daarna behouden). Elke bron-GUID wordt bijgehouden in `coalescedMessageGuids` voor downstream-telemetrie.
    - **Alleen DM.** Groepschats vallen terug op verzending per bericht, zodat de bot responsief blijft wanneer meerdere mensen typen.
    - **Opt-in, per kanaal.** Andere kanalen (Telegram, WhatsApp, Slack, …) worden niet beïnvloed. Oude BlueBubbles-configuraties die `channels.bluebubbles.coalesceSameSenderDms` instellen, moeten die waarde migreren naar `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenario's en wat de agent ziet

| Gebruiker stelt op                                                 | `chat.db` produceert  | Vlag uit (standaard)                    | Vlag aan + venster van 2500 ms                                          |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (één keer verzenden)                    | 2 rijen ~1 s uit elkaar | Twee agent-beurten: alleen "Dump", daarna URL | Eén beurt: samengevoegde tekst `Dump https://example.com`               |
| `Save this 📎image.jpg caption` (bijlage + tekst)                  | 2 rijen               | Twee beurten (bijlage valt weg bij samenvoegen) | Eén beurt: tekst + afbeelding behouden                                  |
| `/status` (zelfstandig commando)                                   | 1 rij                 | Directe verzending                      | **Wacht tot maximaal het venster, verzend daarna**                      |
| URL alleen geplakt                                                 | 1 rij                 | Directe verzending                      | Directe verzending (slechts één vermelding in bucket)                   |
| Tekst + URL verzonden als twee bewust aparte berichten, minuten uit elkaar | 2 rijen buiten venster | Twee beurten                            | Twee beurten (venster verloopt ertussen)                                |
| Snelle stroom (>10 kleine DM's binnen venster)                     | N rijen               | N beurten                               | Eén beurt, begrensde uitvoer (eerste + laatste, tekst-/bijlagelimieten toegepast) |
| Twee mensen typen in een groepschat                                | N rijen van M verzenders | M+ beurten (één per verzender-bucket)   | M+ beurten — groepschats worden niet samengevoegd                       |

## Inhalen na Gateway-downtime

Wanneer de Gateway offline is (crash, herstart, Mac in slaapstand, machine uit), hervat `imsg watch` vanaf de huidige `chat.db`-status zodra de Gateway weer online komt — alles wat tijdens de onderbreking is aangekomen, wordt standaard nooit gezien. Catchup speelt die berichten opnieuw af bij de volgende opstart, zodat de agent inkomend verkeer niet stilletjes mist.

Catchup is **standaard uitgeschakeld**. Schakel het per kanaal in:

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

### Hoe het wordt uitgevoerd

Eén passage per opstart van `monitorIMessageProvider`, op volgorde als `imsg launch` klaar → `watch.subscribe` → `performIMessageCatchup` → live verzendlus. Catchup zelf gebruikt `chats.list` + per-chat `messages.history` via dezelfde JSON-RPC-client die door `imsg watch` wordt gebruikt. Alles wat tijdens de catchup-passage aankomt, loopt normaal via live verzending; de bestaande inbound-dedupe-cache vangt eventuele overlap met opnieuw afgespeelde rijen op.

Elke opnieuw afgespeelde rij wordt door het live verzendpad geleid (`evaluateIMessageInbound` + `dispatchInboundMessage`), zodat allowlists, groepsbeleid, debouncer, echo-cache en leesbevestigingen identiek werken voor opnieuw afgespeelde en live berichten.

### Cursor- en retry-semantiek

Catchup bewaart een cursor per account op `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (de OpenClaw-state-dir is standaard `~/.openclaw`, te overschrijven met `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- De cursor schuift op na elke succesvolle verzending en blijft staan wanneer het verzenden van een rij een fout gooit — de volgende opstart probeert dezelfde rij opnieuw vanaf de vastgehouden cursor.
- Na `maxFailureRetries` opeenvolgende fouten voor dezelfde `guid` logt catchup een `warn` en forceert het de cursor voorbij het vastgelopen bericht, zodat volgende opstarts voortgang kunnen maken.
- GUID's die al zijn opgegeven, worden bij detectie overgeslagen (geen verzendpoging) bij latere runs en meegeteld onder `skippedGivenUp` in de runsamenvatting.

### Voor operators zichtbare signalen

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Een regel `WARN ... capped to perRunLimit` betekent dat één opstart niet de volledige achterstand heeft verwerkt. Verhoog `perRunLimit` (max 500) als je onderbrekingen regelmatig groter zijn dan de standaardpassage van 50 rijen.

### Wanneer je het uit laat

- Gateway draait continu met automatische herstart via watchdog en onderbrekingen zijn altijd < enkele seconden — de standaard uit-stand is prima.
- DM-volume is laag en gemiste berichten zouden het gedrag van de agent niet veranderen — het initiële venster `firstRunLookbackMinutes` kan bij de eerste inschakeling verrassende oude context verzenden.

Wanneer je catchup inschakelt, kijkt de eerste opstart zonder cursor alleen `firstRunLookbackMinutes` terug (standaard 30 min), niet het volledige venster `maxAgeMinutes` — dit voorkomt dat een lange geschiedenis van berichten van vóór inschakeling opnieuw wordt afgespeeld.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Valideer de binary en RPC-ondersteuning:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Als de probe meldt dat RPC niet wordt ondersteund, update dan `imsg`. Als private API-acties niet beschikbaar zijn, voer `imsg launch` uit in de ingelogde macOS-gebruikerssessie en voer de probe opnieuw uit. Als de Gateway niet op macOS draait, gebruik dan de bovenstaande Remote Mac via SSH-configuratie in plaats van het standaard lokale `imsg`-pad.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    De standaard `cliPath: "imsg"` moet draaien op de Mac die is ingelogd bij Berichten. Stel op Linux of Windows `channels.imessage.cliPath` in op een wrapperscript dat via SSH naar die Mac gaat en `imsg "$@"` uitvoert.

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
    - SSH/SCP-sleutelauthenticatie vanaf de gateway-host
    - host key bestaat in `~/.ssh/known_hosts` op de gateway-host
    - leesbaarheid van het externe pad op de Mac waarop Berichten draait

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Voer opnieuw uit in een interactieve GUI-terminal in dezelfde gebruikers-/sessiecontext en keur prompts goed:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Bevestig dat Volledige schijftoegang + Automatisering zijn verleend voor de procescontext die OpenClaw/`imsg` uitvoert.

  </Accordion>
</AccordionGroup>

## Verwijzingen naar configuratiereferentie

- [Configuratiereferentie - iMessage](/nl/gateway/config-channels#imessage)
- [Gateway-configuratie](/nl/gateway/configuration)
- [Koppeling](/nl/channels/pairing)

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles) — config-vertalingstabel en stapsgewijze migratie
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingsgate
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
