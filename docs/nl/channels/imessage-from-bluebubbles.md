---
read_when:
    - Een overstap van BlueBubbles naar de meegeleverde iMessage-Plugin plannen
    - BlueBubbles-configuratiesleutels vertalen naar iMessage-equivalenten
    - imsg verifiëren voordat de iMessage-Plugin wordt ingeschakeld
summary: Migreer oude BlueBubbles-configuraties naar de meegeleverde iMessage-Plugin zonder koppeling, toelatingslijsten of groepsbindingen te verliezen.
title: Overstappen van BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

De meegeleverde `imessage`-Plugin bereikt nu hetzelfde private API-oppervlak als BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, groepsbeheer, bijlagen) door [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC aan te sturen. Als je al een Mac met `imsg` geinstalleerd gebruikt, kun je de BlueBubbles-server verwijderen en de Plugin rechtstreeks met Messages.app laten praten.

Ondersteuning voor BlueBubbles is verwijderd. OpenClaw ondersteunt iMessage alleen via `imsg`. Deze handleiding is voor het migreren van oude `channels.bluebubbles`-configs naar `channels.imessage`; er is geen ander ondersteund migratiepad.

## Wanneer deze migratie zinvol is

- Je gebruikt `imsg` al op dezelfde Mac (of een Mac die via SSH bereikbaar is) waarop Messages.app is aangemeld.
- Je wilt een bewegend onderdeel minder — geen aparte BlueBubbles-server, geen REST-eindpunt om te authenticeren, geen Webhook-bedrading. Een enkele CLI-binary in plaats van een server + client-app + helper.
- Je gebruikt een [ondersteunde macOS- / `imsg`-build](/nl/channels/imessage#requirements-and-permissions-macos) waarbij de private API-probe `available: true` rapporteert.

## Wat imsg doet

`imsg` is een lokale macOS CLI voor Messages. OpenClaw start `imsg rpc` als een childproces en praat JSON-RPC via stdin/stdout. Er is geen HTTP-server, Webhook-URL, achtergronddaemon, launch agent of poort om bloot te stellen.

- Leesbewerkingen komen uit `~/Library/Messages/chat.db` via een read-only SQLite-handle.
- Live inkomende berichten komen uit `imsg watch` / `watch.subscribe`, dat `chat.db`-bestandssysteemgebeurtenissen volgt met een polling-fallback.
- Verzenden gebruikt Messages.app-automatisering voor normale tekst- en bestandsverzendingen.
- Geavanceerde acties gebruiken `imsg launch` om de `imsg`-helper in Messages.app te injecteren. Dat ontgrendelt leesbevestigingen, type-indicatoren, rijke verzendbewerkingen, bewerken, verzenden ongedaan maken, reply in threads, tapbacks en groepsbeheer.
- Linux-builds kunnen een gekopieerde `chat.db` inspecteren, maar kunnen niet verzenden, de live Mac-database volgen of Messages.app aansturen. Voor OpenClaw iMessage voer je `imsg` uit op de aangemelde Mac of via een SSH-wrapper naar die Mac.

## Voordat je begint

1. Installeer `imsg` op de Mac waarop Messages.app draait:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Als `imsg chats` mislukt met `unable to open database file`, lege uitvoer of `authorization denied`, geef dan Volledige schijftoegang aan de terminal, editor, het Node-proces, de Gateway-service of het SSH-ouderproces dat `imsg` start, en open dat ouderproces daarna opnieuw.

2. Controleer de lees-, watch-, verzend- en RPC-oppervlakken voordat je de OpenClaw-config wijzigt:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Vervang `42` door een echte chat-id uit `imsg chats`. Verzenden vereist Automation-toestemming voor Messages.app. Als OpenClaw via SSH zal draaien, voer deze opdrachten dan uit via dezelfde SSH-wrapper of gebruikerscontext die OpenClaw zal gebruiken.

3. Schakel de private API-brug in wanneer je geavanceerde acties nodig hebt:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` vereist dat SIP is uitgeschakeld. Basisverzending, geschiedenis en watch werken zonder `imsg launch`; geavanceerde acties niet.

4. Controleer de brug via OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Je wilt `imessage.privateApi.available: true`. Als dit `false` rapporteert, los dat dan eerst op — zie [Mogelijkhedendetectie](/nl/channels/imessage#private-api-actions).

5. Maak een snapshot van je config:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Configvertaling

iMessage en BlueBubbles delen veel config op kanaalniveau. De sleutels die veranderen zijn vooral transport (`REST server` vs lokale CLI). Gedragssleutels (`dmPolicy`, `groupPolicy`, `allowFrom`, enz.) behouden dezelfde betekenis.

| BlueBubbles                                                | meegeleverde iMessage                     | Opmerkingen                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Dezelfde semantiek.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.serverUrl`                           | _(verwijderd)_                            | Geen REST-server — de Plugin start `imsg rpc` over stdio.                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(verwijderd)_                            | Geen webhook-authenticatie nodig.                                                                                                                                                                                                                                                                                                            |
| _(impliciet)_                                              | `channels.imessage.cliPath`               | Pad naar `imsg` (standaard `imsg`); gebruik een wrapperscript voor SSH.                                                                                                                                                                                                                                                                      |
| _(impliciet)_                                              | `channels.imessage.dbPath`                | Optionele overschrijving voor Messages.app `chat.db`; automatisch gedetecteerd wanneer weggelaten.                                                                                                                                                                                                                                           |
| _(impliciet)_                                              | `channels.imessage.remoteHost`            | `host` of `user@host` — alleen nodig wanneer `cliPath` een SSH-wrapper is en je SCP-bijlage-ophalingen wilt.                                                                                                                                                                                                                                |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Dezelfde waarden (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Koppelingsgoedkeuringen worden per handle overgenomen, niet per token.                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Dezelfde waarden (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Hetzelfde.                                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Kopieer dit letterlijk, inclusief eventuele wildcardvermelding `groups: { "*": { ... } }`.** Per-groep `requireMention`, `tools`, `toolsBySender` worden overgenomen. Met `groupPolicy: "allowlist"` laat een leeg of ontbrekend `groups`-blok elk groepsbericht stilzwijgend vallen — zie "Valkuil met groepsregister" hieronder.       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standaard `true`. Met de meegeleverde Plugin wordt dit alleen uitgevoerd wanneer de private API-probe actief is.                                                                                                                                                                                                                             |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Dezelfde vorm, **ook standaard uitgeschakeld**. Als je bijlagen via BlueBubbles liet doorstromen, moet je dit expliciet opnieuw instellen in het iMessage-blok — het wordt niet impliciet overgenomen, en inkomende foto's/media worden stilzwijgend weggelaten zonder logregel `Inbound message` totdat je dit doet.                       |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale roots; dezelfde wildcardregels.                                                                                                                                                                                                                                                                                                       |
| _(N.v.t.)_                                                 | `channels.imessage.remoteAttachmentRoots` | Alleen gebruikt wanneer `remoteHost` is ingesteld voor SCP-ophalingen.                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standaard 16 MB op iMessage (standaard bij BlueBubbles was 8 MB). Stel expliciet in als je de lagere limiet wilt behouden.                                                                                                                                                                                                                   |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standaard 4000 op beide.                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Dezelfde opt-in. Alleen DM's — groepschats behouden directe verzending per bericht op beide kanalen. Verbreedt de standaard inkomende debounce naar 2500 ms wanneer ingeschakeld zonder expliciete `messages.inbound.byChannel.imessage`. Zie [iMessage-documentatie § Samengevoegde gesplitst verzonden DM's](/nl/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N.v.t.)_                                | iMessage leest weergavenamen van afzenders al uit `chat.db`.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Schakelaars per actie: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                      |

Configuraties met meerdere accounts (`channels.bluebubbles.accounts.*`) worden een-op-een vertaald naar `channels.imessage.accounts.*`.

## Valkuil met groepsregister

De meegeleverde iMessage-Plugin voert **twee** afzonderlijke allowlist-poorten voor groepen direct na elkaar uit. Beide moeten slagen voordat een groepsbericht de agent bereikt:

1. **Allowlist voor afzender / chatdoel** (`channels.imessage.groupAllowFrom`) — gecontroleerd door `isAllowedIMessageSender`. Matcht inkomende berichten op afzenderhandle, `chat_guid`, `chat_identifier` of `chat_id`. Dezelfde vorm als BlueBubbles.
2. **Groepsregister** (`channels.imessage.groups`) — gecontroleerd door `resolveChannelGroupPolicy` uit `inbound-processing.ts:199`. Met `groupPolicy: "allowlist"` vereist deze poort een van beide:
   - een wildcardvermelding `groups: { "*": { ... } }` (stelt `allowAll = true` in), of
   - een expliciete per-`chat_id`-vermelding onder `groups`.

Als poort 1 slaagt maar poort 2 faalt, wordt het bericht weggelaten. De Plugin geeft twee signalen op `warn`-niveau, zodat dit niet langer stil is op het standaard logniveau:

- Een eenmalige `warn` bij het opstarten per account wanneer `groupPolicy: "allowlist"` is ingesteld maar `channels.imessage.groups` leeg is (geen wildcard `"*"`, geen per-`chat_id`-vermeldingen) — afgevuurd voordat er berichten binnenkomen.
- Een eenmalige `warn` per `chat_id` wanneer een specifieke groep voor het eerst tijdens runtime wordt weggelaten, met de chat_id en de exacte sleutel die aan `groups` moet worden toegevoegd om deze toe te staan.

DM's blijven werken omdat ze een ander codepad nemen.

Dit is de meest voorkomende foutmodus bij migratie van BlueBubbles → meegeleverde iMessage: beheerders kopiëren `groupAllowFrom` en `groupPolicy`, maar slaan het `groups`-blok over, omdat `groups: { "*": { "requireMention": true } }` van BlueBubbles eruitziet als een niet-gerelateerde vermeldingsinstelling. Het is in werkelijkheid essentieel voor de registerpoort.

De minimale configuratie om groepsberichten te laten blijven doorstromen na `groupPolicy: "allowlist"`:

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

`requireMention: true` onder `*` is onschadelijk wanneer er geen vermeldingspatronen zijn geconfigureerd: de runtime stelt `canDetectMention = false` in en breekt de mention-drop af bij `inbound-processing.ts:512`. Met geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`) werkt het zoals verwacht.

Als de Gateway-logboeken `imessage: dropping group message from chat_id=<id>` tonen of de opstartregel `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, dan dropt gate 2 — voeg het `groups`-blok toe.

## Stap voor stap

1. Voeg een iMessage-blok toe naast het bestaande BlueBubbles-blok. Bewaar het oude blok alleen als kopieerbron totdat het nieuwe pad is geverifieerd:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **Dry-run-probe** — start de Gateway en bevestig dat iMessage als gezond wordt gerapporteerd:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Omdat `imessage.enabled` nog steeds `false` is, wordt er nog geen inkomend iMessage-verkeer gerouteerd — maar `--probe` test de bridge zodat je permissie- of installatieproblemen ontdekt vóór de overgang.

3. **Schakel over.** Verwijder de BlueBubbles-configuratie en schakel iMessage in met één configuratiebewerking:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Herstart de Gateway. Inkomend iMessage-verkeer loopt nu via de gebundelde Plugin.

4. **Verifieer DM’s.** Stuur de agent een direct message; bevestig dat het antwoord aankomt.

5. **Verifieer groepen afzonderlijk.** DM’s en groepen gebruiken verschillende codepaden — een succesvolle DM bewijst niet dat groepen worden gerouteerd. Stuur de agent een bericht in een gekoppelde groepschat en bevestig dat het antwoord aankomt. Als de groep stilvalt (geen agentantwoord, geen fout), controleer dan het Gateway-logboek op `imessage: dropping group message from chat_id=<id>` of de opstartregel `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — beide worden op het standaard logniveau weergegeven. Als een van beide verschijnt, ontbreekt je `groups`-blok of is het leeg — zie "Group registry footgun" hierboven.

6. **Verifieer het actie-oppervlak** — vraag de agent vanuit een gekoppelde DM om te reageren, te bewerken, te verwijderen, te antwoorden, een foto te sturen en (in een groep) de groep te hernoemen / een deelnemer toe te voegen of te verwijderen. Elke actie moet native aankomen in Messages.app. Als een actie "iMessage `<action>` requires the imsg private API bridge" gooit, voer dan opnieuw `imsg launch` uit en vernieuw `channels status --probe`.

7. **Verwijder de BlueBubbles-server en -configuratie** zodra iMessage-DM’s, groepen en acties zijn geverifieerd. OpenClaw gebruikt `channels.bluebubbles` niet.

## Actiepariteit in één oogopslag

| Actie                                                      | legacy BlueBubbles                  | gebundelde iMessage                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tekst verzenden / SMS-terugval                             | ✅                                  | ✅                                                                                                                      |
| Media verzenden (foto, video, bestand, spraak)             | ✅                                  | ✅                                                                                                                      |
| Threaded reply (`reply_to_guid`)                           | ✅                                  | ✅ (sluit [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                  |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Bewerken / verwijderen (macOS 13+-ontvangers)              | ✅                                  | ✅                                                                                                                      |
| Verzenden met schermeffect                                 | ✅                                  | ✅ (sluit een deel van [#9394](https://github.com/openclaw/openclaw/issues/9394))                                       |
| Rijke tekst vet / cursief / onderstreept / doorgehaald     | ✅                                  | ✅ (typed-run-opmaak via attributedBody)                                                                                |
| Groep hernoemen / groepspictogram instellen                | ✅                                  | ✅                                                                                                                      |
| Deelnemer toevoegen / verwijderen, groep verlaten          | ✅                                  | ✅                                                                                                                      |
| Leesbevestigingen en typindicator                          | ✅                                  | ✅ (achter private API-probe)                                                                                           |
| DM-coalescing voor dezelfde afzender                       | ✅                                  | ✅ (alleen DM; opt-in via `channels.imessage.coalesceSameSenderDms`)                                                    |
| Inhalen van inkomende berichten ontvangen terwijl Gateway uitstaat | ✅ (Webhook-replay + geschiedenis ophalen) | ✅ (opt-in via `channels.imessage.catchup.enabled`; sluit [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

iMessage-catchup is nu beschikbaar als opt-infunctie op de gebundelde Plugin. Bij het opstarten van de Gateway, als `channels.imessage.catchup.enabled` `true` is, voert de Gateway één `chats.list` + per-chat `messages.history`-pass uit tegen dezelfde JSON-RPC-client die door `imsg watch` wordt gebruikt, speelt elke gemiste inkomende rij opnieuw af via het live dispatch-pad (allowlists, groepsbeleid, debouncer, echo-cache), en bewaart een cursor per account zodat latere starts verdergaan waar ze waren gebleven. Zie [Inhalen na Gateway-downtime](/nl/channels/imessage#catching-up-after-gateway-downtime) voor afstemming.

## Koppeling, sessies en ACP-bindingen

- **Koppelingsgoedkeuringen** worden per handle overgenomen. Je hoeft bekende afzenders niet opnieuw goed te keuren — `channels.imessage.allowFrom` herkent dezelfde `+15555550123` / `user@example.com`-strings die BlueBubbles gebruikte.
- **Sessies** blijven gescopeerd per agent + chat. DM’s worden samengevoegd in de hoofdsessie van de agent onder de standaard `session.dmScope=main`; groepssessies blijven geïsoleerd per `chat_id`. De sessiesleutels verschillen (`agent:<id>:imessage:group:<chat_id>` versus het BlueBubbles-equivalent) — oude gespreksgeschiedenis onder BlueBubbles-sessiesleutels wordt niet meegenomen naar iMessage-sessies.
- **ACP-bindingen** die verwijzen naar `match.channel: "bluebubbles"` moeten worden bijgewerkt naar `"imessage"`. De vormen van `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, kale handle) zijn identiek.

## Geen rollbackkanaal

Er is geen ondersteunde BlueBubbles-runtime om naar terug te schakelen. Als iMessage-verificatie mislukt, stel dan `channels.imessage.enabled: false` in, herstart de Gateway, los de `imsg`-blokkade op en probeer de overgang opnieuw.

De antwoordcache staat op `~/.openclaw/state/imessage/reply-cache.jsonl` (modus `0600`, bovenliggende map `0700`). Je kunt die veilig verwijderen als je met een schone lei wilt beginnen.

## Gerelateerd

- [iMessage](/nl/channels/imessage) — volledige iMessage-kanaalreferentie, inclusief `imsg launch`-setup en capaciteitsdetectie.
- `/channels/bluebubbles` — legacy-URL die doorverwijst naar deze migratiegids.
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow.
- [Kanaalroutering](/nl/channels/channel-routing) — hoe de Gateway een kanaal kiest voor uitgaande antwoorden.
