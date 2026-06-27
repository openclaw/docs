---
read_when:
    - Een overstap plannen van BlueBubbles naar de gebundelde iMessage-plugin
    - BlueBubbles-configuratiesleutels vertalen naar iMessage-equivalenten
    - imsg verifiëren voordat de iMessage-Plugin wordt ingeschakeld
summary: Migreer oude BlueBubbles-configuraties naar de gebundelde iMessage-plugin zonder koppeling, allowlists of groepskoppelingen te verliezen.
title: Afkomstig van BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

De gebundelde `imessage` Plugin bereikt nu hetzelfde privé-API-oppervlak als BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, groepsbeheer, bijlagen) door [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC aan te sturen. Als je al een Mac met `imsg` geinstalleerd gebruikt, kun je de BlueBubbles-server verwijderen en de Plugin rechtstreeks met Messages.app laten praten.

BlueBubbles-ondersteuning is verwijderd. OpenClaw ondersteunt iMessage alleen via `imsg`. Deze gids is bedoeld voor het migreren van oude `channels.bluebubbles`-configuraties naar `channels.imessage`; er is geen ander ondersteund migratiepad.

<Note>
Zie [BlueBubbles-verwijdering en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) voor de korte aankondiging en operatorsamenvatting.
</Note>

## Migratiechecklist

Gebruik deze checklist wanneer je je oude BlueBubbles-configuratie al kent en het kortste veilige pad wilt:

1. Verifieer `imsg` rechtstreeks op de Mac waarop Messages.app draait (`imsg chats`, `imsg history`, `imsg send` en `imsg rpc --help`).
2. Kopieer gedragssleutels van `channels.bluebubbles` naar `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` en `actions`.
3. Verwijder transportsleutels die niet meer bestaan: `serverUrl`, `password`, Webhook-URL's en de BlueBubbles-serverconfiguratie.
4. Als de Gateway niet op de Messages-Mac draait, stel je `channels.imessage.cliPath` in op een SSH-wrapper en stel je `remoteHost` in voor het ophalen van externe bijlagen.
5. Schakel `channels.imessage` in terwijl de Gateway is gestopt, en voer daarna `openclaw channels status --probe --channel imessage` uit.
6. Test een DM, een toegestane groep, bijlagen indien ingeschakeld, en elke privé-API-actie waarvan je verwacht dat de agent die gebruikt.
7. Verwijder de BlueBubbles-server en de oude `channels.bluebubbles`-configuratie nadat het iMessage-pad is geverifieerd.

## Wanneer deze migratie zinvol is

- Je gebruikt `imsg` al op dezelfde Mac (of een Mac die via SSH bereikbaar is) waarop Messages.app is ingelogd.
- Je wilt een bewegend onderdeel minder: geen aparte BlueBubbles-server, geen REST-eindpunt om te authenticeren, geen Webhook-bedrading. Een enkele CLI-binary in plaats van een server + client-app + helper.
- Je gebruikt een [ondersteunde macOS- / `imsg`-build](/nl/channels/imessage#requirements-and-permissions-macos) waarbij de privé-API-probe `available: true` rapporteert.

## Wat imsg doet

`imsg` is een lokale macOS-CLI voor Messages. OpenClaw start `imsg rpc` als childproces en communiceert via JSON-RPC over stdin/stdout. Er is geen HTTP-server, Webhook-URL, achtergronddaemon, launch-agent of poort om beschikbaar te stellen.

- Leesbewerkingen komen uit `~/Library/Messages/chat.db` met een alleen-lezen SQLite-handle.
- Live inkomende berichten komen uit `imsg watch` / `watch.subscribe`, dat `chat.db`-bestandssysteemgebeurtenissen volgt met een polling-fallback.
- Verzenden gebruikt Messages.app-automatisering voor normale tekst- en bestandsverzendingen.
- Geavanceerde acties gebruiken `imsg launch` om de `imsg`-helper in Messages.app te injecteren. Dat ontgrendelt leesbevestigingen, type-indicatoren, rijke verzendingen, bewerken, verzenden ongedaan maken, threaded replies, tapbacks en groepsbeheer.
- Linux-builds kunnen een gekopieerde `chat.db` inspecteren, maar kunnen niet verzenden, de live Mac-database bekijken of Messages.app aansturen. Voer voor OpenClaw iMessage `imsg` uit op de ingelogde Mac of via een SSH-wrapper naar die Mac.

## Voordat je begint

1. Installeer `imsg` op de Mac waarop Messages.app draait:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Als `imsg chats` faalt met `unable to open database file`, lege uitvoer of `authorization denied`, verleen dan Full Disk Access aan de terminal, editor, het Node-proces, de Gateway-service of het SSH-ouderproces dat `imsg` start, en open dat ouderproces daarna opnieuw.

2. Verifieer de lees-, watch-, verzend- en RPC-oppervlakken voordat je de OpenClaw-configuratie wijzigt:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Vervang `42` door een echte chat-id uit `imsg chats`. Verzenden vereist Automation-toestemming voor Messages.app. Als OpenClaw via SSH draait, voer deze opdrachten dan uit via dezelfde SSH-wrapper of gebruikerscontext die OpenClaw zal gebruiken. Als leesbewerkingen/probes werken maar verzenden faalt met AppleEvents `-1743`, controleer dan of Automation op `/usr/libexec/sshd-keygen-wrapper` is terechtgekomen; zie [SSH-wrapper-verzendingen falen met AppleEvents -1743](/nl/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Schakel de privé-API-brug in wanneer je geavanceerde acties nodig hebt:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` vereist dat SIP is uitgeschakeld. Basisverzending, geschiedenis en watch werken zonder `imsg launch`; geavanceerde acties niet.

4. Nadat je een ingeschakelde `channels.imessage`-configuratie hebt toegevoegd, verifieer je de brug via OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Je wilt `imessage.privateApi.available: true`. Als dit `false` rapporteert, los dat dan eerst op: zie [Capability-detectie](/nl/channels/imessage#private-api-actions). `channels status --probe` voert alleen probes uit op geconfigureerde, ingeschakelde accounts.

5. Maak een momentopname van je configuratie:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Configuratievertaling

iMessage en BlueBubbles delen veel configuratie op kanaalniveau. De sleutels die veranderen zijn vooral transportgerelateerd (REST-server versus lokale CLI). Gedragssleutels (`dmPolicy`, `groupPolicy`, `allowFrom`, enz.) houden dezelfde betekenis.

| BlueBubbles                                                | gebundelde iMessage                       | Opmerkingen                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Zelfde semantiek.                                                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _(verwijderd)_                            | Geen REST-server — de Plugin start `imsg rpc` via stdio.                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _(verwijderd)_                            | Geen webhookauthenticatie nodig.                                                                                                                                                                                                                                                                                                                                                     |
| _(impliciet)_                                              | `channels.imessage.cliPath`               | Pad naar `imsg` (standaard `imsg`); gebruik een wrapperscript voor SSH.                                                                                                                                                                                                                                                                                                              |
| _(impliciet)_                                              | `channels.imessage.dbPath`                | Optionele overschrijving voor Messages.app `chat.db`; automatisch gedetecteerd wanneer weggelaten.                                                                                                                                                                                                                                                                                   |
| _(impliciet)_                                              | `channels.imessage.remoteHost`            | `host` of `user@host` — alleen nodig wanneer `cliPath` een SSH-wrapper is en je SCP-ophaalacties voor bijlagen wilt.                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Zelfde waarden (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Koppelingsgoedkeuringen worden overgenomen per handle, niet per token.                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Zelfde waarden (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Zelfde.                                                                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Kopieer dit letterlijk, inclusief eventuele wildcardvermelding `groups: { "*": { ... } }`.** Per-groep `requireMention`, `tools`, `toolsBySender` worden overgenomen. Met `groupPolicy: "allowlist"` laat een leeg of ontbrekend `groups`-blok stilletjes elk groepsbericht vallen — zie "Valkuil in groepsregister" hieronder.                                                   |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standaard `true`. Met de gebundelde Plugin wordt dit alleen uitgevoerd wanneer de private API-probe actief is.                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Zelfde vorm, **ook standaard uitgeschakeld**. Als je bijlagen via BlueBubbles liet doorstromen, moet je dit expliciet opnieuw instellen in het iMessage-blok — het wordt niet impliciet overgenomen, en inkomende foto's/media worden stilletjes genegeerd zonder logregel `Inbound message` totdat je dat doet.                                                                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale roots; zelfde wildcardregels.                                                                                                                                                                                                                                                                                                                                                 |
| _(n.v.t.)_                                                 | `channels.imessage.remoteAttachmentRoots` | Alleen gebruikt wanneer `remoteHost` is ingesteld voor SCP-ophaalacties.                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standaard 16 MB op iMessage (BlueBubbles-standaard was 8 MB). Stel expliciet in als je de lagere limiet wilt behouden.                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standaard 4000 op beide.                                                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Zelfde opt-in. Alleen DM's — groepschats behouden directe verzending per bericht op beide kanalen. Verbreedt de standaard inkomende debounce naar 7000 ms wanneer ingeschakeld zonder expliciete `messages.inbound.byChannel.imessage` of globale `messages.inbound.debounceMs`. Zie [iMessage-documentatie § DM's met opgesplitste verzending samenvoegen](/nl/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(n.v.t.)_                                | iMessage leest weergavenamen van afzenders al uit `chat.db`.                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Schakelaars per actie: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                              |

Configuraties met meerdere accounts (`channels.bluebubbles.accounts.*`) worden een-op-een vertaald naar `channels.imessage.accounts.*`.

## Valkuil in groepsregister

De gebundelde iMessage-Plugin voert **twee** afzonderlijke allowlist-poorten voor groepen achter elkaar uit. Beide moeten slagen voordat een groepsbericht de agent bereikt:

1. **Allowlist voor afzender / chatdoel** (`channels.imessage.groupAllowFrom`) — gecontroleerd door `isAllowedIMessageSender`. Matcht inkomende berichten op afzenderhandle, `chat_guid`, `chat_identifier` of `chat_id`. Zelfde vorm als BlueBubbles.
2. **Groepsregister** (`channels.imessage.groups`) — gecontroleerd door `resolveChannelGroupPolicy` uit `inbound-processing.ts:199`. Met `groupPolicy: "allowlist"` vereist deze poort een van beide:
   - een wildcardvermelding `groups: { "*": { ... } }` (stelt `allowAll = true` in), of
   - een expliciete per-`chat_id`-vermelding onder `groups`.

Als poort 1 slaagt maar poort 2 faalt, wordt het bericht genegeerd. De Plugin geeft twee signalen op `warn`-niveau, zodat dit niet langer stil is op het standaard logniveau:

- Een eenmalige `warn` per account bij het opstarten wanneer `groupPolicy: "allowlist"` is ingesteld maar `channels.imessage.groups` leeg is (geen wildcard `"*"`, geen per-`chat_id`-vermeldingen) — uitgevoerd voordat er berichten binnenkomen.
- Een eenmalige `warn` per `chat_id` wanneer een specifieke groep voor het eerst tijdens runtime wordt genegeerd, met vermelding van de chat_id en de exacte sleutel die aan `groups` moet worden toegevoegd om deze toe te staan.

DM's blijven werken omdat ze een ander codepad nemen.

Dit is de meest voorkomende foutmodus bij de migratie van BlueBubbles → gebundelde iMessage: operators kopiëren `groupAllowFrom` en `groupPolicy`, maar slaan het `groups`-blok over, omdat BlueBubbles' `groups: { "*": { "requireMention": true } }` op een niet-gerelateerde vermeldingsinstelling lijkt. Het is in werkelijkheid essentieel voor de registry-gate.

De minimale configuratie om groepsberichten te laten doorstromen na `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` onder `*` is onschadelijk wanneer er geen vermeldingspatronen zijn geconfigureerd: de runtime stelt `canDetectMention = false` in en kortsluit de vermeldingsdrop bij `inbound-processing.ts:512`. Met geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`) werkt het zoals verwacht.

Als de gateway `imessage: dropping group message from chat_id=<id>` logt, of de opstartregel `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, dan dropt gate 2 — voeg het `groups`-blok toe.

## Stap voor stap

1. Voeg een iMessage-blok toe naast het bestaande BlueBubbles-blok. Houd het uitgeschakeld zolang de Gateway nog BlueBubbles-verkeer routeert:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Probe voordat verkeer belangrijk wordt** — stop de Gateway, schakel het iMessage-blok tijdelijk in en bevestig via de CLI dat iMessage gezond rapporteert:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` probet alleen geconfigureerde, ingeschakelde accounts. Herstart de Gateway niet met zowel BlueBubbles als iMessage ingeschakeld, tenzij je bewust beide kanaalmonitors wilt laten draaien. Als je niet onmiddellijk overschakelt, zet `channels.imessage.enabled` dan terug op `false` voordat je de Gateway herstart. Gebruik de directe `imsg`-commando's in [Voordat je begint](#before-you-start) om de Mac te valideren voordat je OpenClaw-verkeer inschakelt.

3. **Schakel over.** Zodra het ingeschakelde iMessage-account gezond rapporteert, verwijder je de BlueBubbles-configuratie en houd je iMessage ingeschakeld:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Herstart de gateway. Inkomend iMessage-verkeer loopt nu via de gebundelde Plugin.

4. **Verifieer DM's.** Stuur de agent een direct bericht; bevestig dat het antwoord aankomt.

5. **Verifieer groepen apart.** DM's en groepen nemen verschillende codepaden — succes met DM's bewijst niet dat groepen worden gerouteerd. Stuur de agent een bericht in een gekoppelde groepschat en bevestig dat het antwoord aankomt. Als de groep stilvalt (geen agentantwoord, geen fout), controleer dan het gatewaylog op `imessage: dropping group message from chat_id=<id>` of de opstartregel `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — beide verschijnen op het standaard logniveau. Als een van beide verschijnt, ontbreekt je `groups`-blok of is het leeg — zie "Group registry footgun" hierboven.

6. **Verifieer het actieoppervlak** — vraag de agent vanuit een gekoppelde DM om te reageren, te bewerken, ongedaan te maken, te antwoorden, een foto te sturen en (in een groep) de groep te hernoemen / een deelnemer toe te voegen of te verwijderen. Elke actie moet native in Messages.app aankomen. Als een actie "iMessage `<action>` requires the imsg private API bridge" oplevert, voer dan opnieuw `imsg launch` uit en vernieuw `channels status --probe`.

7. **Verwijder de BlueBubbles-server en -configuratie** zodra iMessage-DM's, groepen en acties zijn geverifieerd. OpenClaw gebruikt `channels.bluebubbles` niet.

## Actiepariteit in één oogopslag

| Actie                                               | verouderde BlueBubbles              | gebundelde iMessage                                                           |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Tekst verzenden / SMS-fallback                      | ✅                                  | ✅                                                                            |
| Media verzenden (foto, video, bestand, spraak)      | ✅                                  | ✅                                                                            |
| Antwoord in thread (`reply_to_guid`)                | ✅                                  | ✅ (sluit [#51892](https://github.com/openclaw/openclaw/issues/51892))        |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Bewerken / ongedaan maken (macOS 13+-ontvangers)    | ✅                                  | ✅                                                                            |
| Verzenden met schermeffect                          | ✅                                  | ✅ (sluit een deel van [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Rich text vet / cursief / onderstrepen / doorhalen  | ✅                                  | ✅ (typed-run-opmaak via attributedBody)                                      |
| Groep hernoemen / groepsicoon instellen             | ✅                                  | ✅                                                                            |
| Deelnemer toevoegen / verwijderen, groep verlaten   | ✅                                  | ✅                                                                            |
| Leesbevestigingen en typindicator                   | ✅                                  | ✅ (afhankelijk van private API-probe)                                        |
| DM-samenvoeging van dezelfde afzender               | ✅                                  | ✅ (alleen DM; opt-in via `channels.imessage.coalesceSameSenderDms`)          |
| Inkomend herstel na een herstart                    | ✅ (Webhook-replay + geschiedenis ophalen) | ✅ (automatisch: gemiste berichten replayen via since_rowid + dedupe; ruimer venster lokaal) |

iMessage herstelt berichten die zijn gemist terwijl de gateway offline was: bij het opstarten replayt het vanaf de laatst verzonden rowid via `imsg watch.subscribe` `since_rowid` en dedupliceert het op GUID, terwijl een leeftijdsgrens voor verouderde backlog de Push-flush-"backlog bomb" onderdrukt. Dit loopt over de `imsg` RPC-verbinding, dus het werkt ook voor remote SSH-`cliPath`-setups; lokale setups krijgen een ruimer herstelvenster omdat ze `chat.db` kunnen lezen. Zie [Inkomend herstel na een bridge- of gatewayherstart](/nl/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Koppelen, sessies en ACP-bindingen

- **Koppelingsgoedkeuringen** worden per handle overgenomen. Je hoeft bekende afzenders niet opnieuw goed te keuren — `channels.imessage.allowFrom` herkent dezelfde `+15555550123` / `user@example.com`-strings die BlueBubbles gebruikte.
- **Sessies** blijven gescoped per agent + chat. DM's vallen samen in de hoofdsessie van de agent onder de standaard `session.dmScope=main`; groepssessies blijven geïsoleerd per `chat_id`. De sessiesleutels verschillen (`agent:<id>:imessage:group:<chat_id>` versus het BlueBubbles-equivalent) — oude gespreksgeschiedenis onder BlueBubbles-sessiesleutels wordt niet meegenomen naar iMessage-sessies.
- **ACP-bindingen** die verwijzen naar `match.channel: "bluebubbles"` moeten worden bijgewerkt naar `"imessage"`. De vormen van `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, kale handle) zijn identiek.

## Geen rollback-kanaal

Er is geen ondersteunde BlueBubbles-runtime om naar terug te schakelen. Als iMessage-verificatie mislukt, stel je `channels.imessage.enabled: false` in, herstart je de Gateway, los je de `imsg`-blokkade op en probeer je de overschakeling opnieuw.

De antwoordcache leeft in SQLite Plugin-status. `openclaw doctor --fix` importeert en archiveert de oude `imessage/reply-cache.jsonl`-sidecar wanneer die aanwezig is.

## Gerelateerd

- [BlueBubbles-verwijdering en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) — korte aankondiging en operatorsamenvatting.
- [iMessage](/nl/channels/imessage) — volledige iMessage-kanaalreferentie, inclusief `imsg launch`-setup en detectie van capabilities.
- `/channels/bluebubbles` — verouderde URL die omleidt naar deze migratiegids.
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow.
- [Kanaalroutering](/nl/channels/channel-routing) — hoe de gateway een kanaal kiest voor uitgaande antwoorden.
