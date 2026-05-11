---
read_when:
    - Een overstap van BlueBubbles naar de meegeleverde iMessage-Plugin plannen
    - BlueBubbles-configuratiesleutels vertalen naar iMessage-equivalenten
    - imsg verifiëren voordat de iMessage-plugin wordt ingeschakeld
summary: Migreer oude BlueBubbles-configuraties naar de gebundelde iMessage-Plugin zonder koppeling, toelatingslijsten of groepsbindingen te verliezen.
title: Overstappen vanaf BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

De gebundelde `imessage`-plugin bereikt nu hetzelfde private API-oppervlak als BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, groepsbeheer, bijlagen) door [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC aan te sturen. Als je al een Mac met geïnstalleerde `imsg` gebruikt, kun je de BlueBubbles-server verwijderen en de plugin rechtstreeks met Messages.app laten praten.

Ondersteuning voor BlueBubbles is verwijderd. OpenClaw ondersteunt iMessage alleen via `imsg`. Deze handleiding is bedoeld voor het migreren van oude `channels.bluebubbles`-configuraties naar `channels.imessage`; er is geen ander ondersteund migratiepad.

<Note>
Zie voor de korte aankondiging en operatorsamenvatting [Verwijdering van BlueBubbles en het imsg-pad voor iMessage](/nl/announcements/bluebubbles-imessage).
</Note>

## Migratiechecklist

Gebruik deze checklist wanneer je je oude BlueBubbles-configuratie al kent en de kortste veilige route wilt:

1. Controleer `imsg` rechtstreeks op de Mac waarop Messages.app draait (`imsg chats`, `imsg history`, `imsg send` en `imsg rpc --help`).
2. Kopieer gedragssleutels van `channels.bluebubbles` naar `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` en `actions`.
3. Verwijder transportsleutels die niet meer bestaan: `serverUrl`, `password`, Webhook-URL's en BlueBubbles-serverconfiguratie.
4. Als de Gateway niet op de Messages-Mac draait, stel dan `channels.imessage.cliPath` in op een SSH-wrapper en stel `remoteHost` in voor het op afstand ophalen van bijlagen.
5. Schakel, terwijl de Gateway is gestopt, `channels.imessage` in en voer daarna `openclaw channels status --probe --channel imessage` uit.
6. Test één DM, één toegestane groep, bijlagen als die zijn ingeschakeld, en elke private API-actie waarvan je verwacht dat de agent die gebruikt.
7. Verwijder de BlueBubbles-server en de oude `channels.bluebubbles`-configuratie nadat het iMessage-pad is geverifieerd.

## Wanneer deze migratie zinvol is

- Je gebruikt al `imsg` op dezelfde Mac (of op een Mac die via SSH bereikbaar is) waarop Messages.app is ingelogd.
- Je wilt één bewegend onderdeel minder: geen aparte BlueBubbles-server, geen REST-eindpunt om te authenticeren, geen Webhook-bedrading. Eén CLI-binary in plaats van een server + client-app + helper.
- Je gebruikt een [ondersteunde macOS- / `imsg`-build](/nl/channels/imessage#requirements-and-permissions-macos) waarbij de private API-probe `available: true` rapporteert.

## Wat imsg doet

`imsg` is een lokale macOS-CLI voor Messages. OpenClaw start `imsg rpc` als onderliggend proces en praat JSON-RPC via stdin/stdout. Er is geen HTTP-server, Webhook-URL, achtergronddaemon, launch agent of poort om open te stellen.

- Leesbewerkingen komen uit `~/Library/Messages/chat.db` via een read-only SQLite-handle.
- Live inkomende berichten komen uit `imsg watch` / `watch.subscribe`, dat `chat.db`-bestandssysteemgebeurtenissen volgt met polling als fallback.
- Verzendbewerkingen gebruiken Messages.app-automatisering voor normale tekst- en bestandsverzending.
- Geavanceerde acties gebruiken `imsg launch` om de `imsg`-helper in Messages.app te injecteren. Dat ontgrendelt leesbevestigingen, typindicatoren, rijke verzendbewerkingen, bewerken, verzenden ongedaan maken, threaded reply, tapbacks en groepsbeheer.
- Linux-builds kunnen een gekopieerde `chat.db` inspecteren, maar kunnen niet verzenden, de live Mac-database volgen of Messages.app aansturen. Voor OpenClaw iMessage voer je `imsg` uit op de ingelogde Mac of via een SSH-wrapper naar die Mac.

## Voordat je begint

1. Installeer `imsg` op de Mac waarop Messages.app draait:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Als `imsg chats` faalt met `unable to open database file`, lege uitvoer of `authorization denied`, geef dan Full Disk Access aan de terminal, editor, het Node-proces, de Gateway-service of het bovenliggende SSH-proces dat `imsg` start, en open dat bovenliggende proces daarna opnieuw.

2. Controleer de lees-, watch-, verzend- en RPC-oppervlakken voordat je de OpenClaw-configuratie wijzigt:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Vervang `42` door een echte chat-id uit `imsg chats`. Verzenden vereist Automation-toestemming voor Messages.app. Als OpenClaw via SSH zal draaien, voer deze opdrachten dan uit via dezelfde SSH-wrapper of gebruikerscontext die OpenClaw zal gebruiken.

3. Schakel de private API-bridge in wanneer je geavanceerde acties nodig hebt:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` vereist dat SIP is uitgeschakeld. Basisverzending, geschiedenis en watch werken zonder `imsg launch`; geavanceerde acties niet.

4. Nadat je een ingeschakelde `channels.imessage`-configuratie hebt toegevoegd, verifieer je de bridge via OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Je wilt `imessage.privateApi.available: true`. Als dit `false` rapporteert, los dat dan eerst op; zie [Capaciteitsdetectie](/nl/channels/imessage#private-api-actions). `channels status --probe` test alleen geconfigureerde, ingeschakelde accounts.

5. Maak een snapshot van je configuratie:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Configuratievertaling

iMessage en BlueBubbles delen veel configuratie op kanaalniveau. De sleutels die veranderen zijn vooral transportgerelateerd (REST-server versus lokale CLI). Gedragssleutels (`dmPolicy`, `groupPolicy`, `allowFrom`, enzovoort) behouden dezelfde betekenis.

| BlueBubbles                                                | meegeleverde iMessage                     | Opmerkingen                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Zelfde semantiek.                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.serverUrl`                           | _(verwijderd)_                            | Geen REST-server — de Plugin start `imsg rpc` via stdio.                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.password`                            | _(verwijderd)_                            | Geen Webhook-authenticatie nodig.                                                                                                                                                                                                                                                                                                            |
| _(impliciet)_                                              | `channels.imessage.cliPath`               | Pad naar `imsg` (standaard `imsg`); gebruik een wrapperscript voor SSH.                                                                                                                                                                                                                                                                      |
| _(impliciet)_                                              | `channels.imessage.dbPath`                | Optionele Messages.app-overschrijving voor `chat.db`; automatisch gedetecteerd wanneer weggelaten.                                                                                                                                                                                                                                           |
| _(impliciet)_                                              | `channels.imessage.remoteHost`            | `host` of `user@host` — alleen nodig wanneer `cliPath` een SSH-wrapper is en je SCP-ophaalacties voor bijlagen wilt.                                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Zelfde waarden (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Koppelingsgoedkeuringen worden overgenomen per handle, niet per token.                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Zelfde waarden (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Zelfde.                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Kopieer dit letterlijk, inclusief eventuele jokertekenvermelding `groups: { "*": { ... } }`.** Per groep worden `requireMention`, `tools`, `toolsBySender` overgenomen. Met `groupPolicy: "allowlist"` laat een leeg of ontbrekend `groups`-blok stilzwijgend elk groepsbericht vallen — zie "Voetangel in het groepsregister" hieronder. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standaard `true`. Met de meegeleverde Plugin wordt dit alleen geactiveerd wanneer de private API-probe actief is.                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Zelfde vorm, **ook standaard uitgeschakeld**. Als je bijlagen op BlueBubbles liet doorstromen, moet je dit expliciet opnieuw instellen in het iMessage-blok — het wordt niet impliciet overgenomen, en binnenkomende foto's/media worden stilzwijgend weggegooid zonder `Inbound message`-logregel totdat je dat doet.                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale roots; zelfde regels voor jokertekens.                                                                                                                                                                                                                                                                                                |
| _(N.v.t.)_                                                 | `channels.imessage.remoteAttachmentRoots` | Alleen gebruikt wanneer `remoteHost` is ingesteld voor SCP-ophaalacties.                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standaard 16 MB op iMessage (de standaard van BlueBubbles was 8 MB). Stel dit expliciet in als je de lagere limiet wilt behouden.                                                                                                                                                                                                            |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standaard 4000 op beide.                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Zelfde opt-in. Alleen DM's — groepschats behouden directe verzending per bericht op beide kanalen. Verbreedt de standaard binnenkomende debounce naar 2500 ms wanneer ingeschakeld zonder expliciete `messages.inbound.byChannel.imessage`. Zie [iMessage-docs § DM's met split-send samenvoegen](/nl/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N.v.t.)_                                | iMessage leest weergavenamen van afzenders al uit `chat.db`.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Schakelaars per actie: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                       |

Configuraties met meerdere accounts (`channels.bluebubbles.accounts.*`) worden een-op-een vertaald naar `channels.imessage.accounts.*`.

## Voetangel in het groepsregister

De meegeleverde iMessage-Plugin voert **twee** afzonderlijke allowlist-poorten voor groepen direct na elkaar uit. Beide moeten slagen voordat een groepsbericht de agent bereikt:

1. **Allowlist voor afzender / chatdoel** (`channels.imessage.groupAllowFrom`) — gecontroleerd door `isAllowedIMessageSender`. Matcht binnenkomende berichten op afzenderhandle, `chat_guid`, `chat_identifier` of `chat_id`. Zelfde vorm als BlueBubbles.
2. **Groepsregister** (`channels.imessage.groups`) — gecontroleerd door `resolveChannelGroupPolicy` uit `inbound-processing.ts:199`. Met `groupPolicy: "allowlist"` vereist deze poort ofwel:
   - een jokertekenvermelding `groups: { "*": { ... } }` (zet `allowAll = true`), of
   - een expliciete vermelding per `chat_id` onder `groups`.

Als poort 1 slaagt maar poort 2 faalt, wordt het bericht weggegooid. De Plugin geeft twee signalen op `warn`-niveau, zodat dit niet langer stil is op het standaardlogniveau:

- Een eenmalige `warn` bij opstarten per account wanneer `groupPolicy: "allowlist"` is ingesteld maar `channels.imessage.groups` leeg is (geen `"*"`-jokerteken, geen vermeldingen per `chat_id`) — geactiveerd voordat er berichten binnenkomen.
- Een eenmalige `warn` per `chat_id` de eerste keer dat een specifieke groep tijdens runtime wordt weggegooid, met vermelding van de chat_id en de exacte sleutel die je aan `groups` moet toevoegen om deze toe te staan.

DM's blijven werken omdat ze een ander codepad nemen.

Dit is de meest voorkomende foutmodus bij migratie van BlueBubbles naar de meegeleverde iMessage-Plugin: operators kopiëren `groupAllowFrom` en `groupPolicy`, maar slaan het `groups`-blok over, omdat BlueBubbles' `groups: { "*": { "requireMention": true } }` eruitziet als een niet-gerelateerde vermeldingsinstelling. Het is in werkelijkheid essentieel voor de registerpoort.

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

`requireMention: true` onder `*` is onschadelijk wanneer er geen vermeldingspatronen zijn geconfigureerd: de runtime stelt `canDetectMention = false` in en slaat de vermeldingsdrop kort via `inbound-processing.ts:512`. Met geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`) werkt het zoals verwacht.

Als de gateway `imessage: dropping group message from chat_id=<id>` logt, of de opstartregel `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, dan dropt gate 2 het bericht — voeg het `groups`-blok toe.

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

2. **Controleer voordat verkeer ertoe doet** — stop de Gateway, schakel het iMessage-blok tijdelijk in en bevestig via de CLI dat iMessage gezond rapporteert:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` controleert alleen geconfigureerde, ingeschakelde accounts. Start de Gateway niet opnieuw met zowel BlueBubbles als iMessage ingeschakeld, tenzij je bewust beide kanaalmonitors wilt laten draaien. Als je niet direct omschakelt, zet `channels.imessage.enabled` dan terug op `false` voordat je de Gateway opnieuw start. Gebruik de directe `imsg`-commando's in [Voordat je begint](#before-you-start) om de Mac te valideren voordat je OpenClaw-verkeer inschakelt.

3. **Schakel om.** Zodra het ingeschakelde iMessage-account gezond rapporteert, verwijder je de BlueBubbles-configuratie en houd je iMessage ingeschakeld:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Start de Gateway opnieuw. Inkomend iMessage-verkeer loopt nu via de gebundelde Plugin.

4. **Controleer DM's.** Stuur de agent een direct bericht; bevestig dat het antwoord aankomt.

5. **Controleer groepen apart.** DM's en groepen gebruiken verschillende codepaden — een werkende DM bewijst niet dat groepen worden gerouteerd. Stuur de agent een bericht in een gekoppelde groepschat en bevestig dat het antwoord aankomt. Als de groep stil blijft (geen antwoord van de agent, geen fout), controleer dan het gatewaylog op `imessage: dropping group message from chat_id=<id>` of de opstartregel `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — beide verschijnen op het standaard logniveau. Als een van beide verschijnt, ontbreekt je `groups`-blok of is het leeg — zie "Group registry footgun" hierboven.

6. **Controleer het actie-oppervlak** — vraag de agent vanuit een gekoppelde DM om te reageren, te bewerken, ongedaan te maken, te antwoorden, een foto te sturen en (in een groep) de groep te hernoemen / een deelnemer toe te voegen of te verwijderen. Elke actie zou native in Messages.app moeten aankomen. Als een actie "iMessage `<action>` requires the imsg private API bridge" geeft, voer `imsg launch` dan opnieuw uit en vernieuw `channels status --probe`.

7. **Verwijder de BlueBubbles-server en -configuratie** zodra iMessage-DM's, groepen en acties zijn gecontroleerd. OpenClaw gebruikt `channels.bluebubbles` niet.

## Actiepariteit in één oogopslag

| Actie                                                      | legacy BlueBubbles                  | gebundelde iMessage                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tekst verzenden / SMS-fallback                             | ✅                                  | ✅                                                                                                                      |
| Media verzenden (foto, video, bestand, spraak)             | ✅                                  | ✅                                                                                                                      |
| Threaded reply (`reply_to_guid`)                           | ✅                                  | ✅ (sluit [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                  |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Bewerken / ongedaan maken (macOS 13+-ontvangers)           | ✅                                  | ✅                                                                                                                      |
| Verzenden met schermeffect                                 | ✅                                  | ✅ (sluit een deel van [#9394](https://github.com/openclaw/openclaw/issues/9394))                                       |
| Rich text vet / cursief / onderstrepen / doorhalen         | ✅                                  | ✅ (typed-run-opmaak via attributedBody)                                                                                |
| Groep hernoemen / groepsicoon instellen                    | ✅                                  | ✅                                                                                                                      |
| Deelnemer toevoegen / verwijderen, groep verlaten          | ✅                                  | ✅                                                                                                                      |
| Leesbevestigingen en typindicator                          | ✅                                  | ✅ (afhankelijk van private API-probe)                                                                                  |
| DM's van dezelfde afzender samenvoegen                     | ✅                                  | ✅ (alleen DM; opt-in via `channels.imessage.coalesceSameSenderDms`)                                                    |
| Inkomende berichten inhalen die zijn ontvangen terwijl de gateway offline was | ✅ (webhook-replay + geschiedenis ophalen) | ✅ (opt-in via `channels.imessage.catchup.enabled`; sluit [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

iMessage-catchup is nu beschikbaar als opt-in-functie in de gebundelde Plugin. Bij het opstarten van de gateway voert de gateway, als `channels.imessage.catchup.enabled` `true` is, één `chats.list` + per-chat `messages.history`-run uit tegen dezelfde JSON-RPC-client die door `imsg watch` wordt gebruikt, speelt elke gemiste inkomende rij opnieuw af via het live dispatch-pad (allowlists, groepsbeleid, debouncer, echo-cache) en bewaart per account een cursor zodat volgende starts verdergaan waar ze waren gebleven. Zie [Inhalen na gateway-downtime](/nl/channels/imessage#catching-up-after-gateway-downtime) voor afstemming.

## Koppelen, sessies en ACP-bindingen

- **Koppelingsgoedkeuringen** worden per handle meegenomen. Je hoeft bekende afzenders niet opnieuw goed te keuren — `channels.imessage.allowFrom` herkent dezelfde `+15555550123` / `user@example.com`-strings die BlueBubbles gebruikte.
- **Sessies** blijven gescopeerd per agent + chat. DM's worden onder de standaardinstelling `session.dmScope=main` samengevoegd in de hoofdsessie van de agent; groepssessies blijven geïsoleerd per `chat_id`. De sessiesleutels verschillen (`agent:<id>:imessage:group:<chat_id>` versus het BlueBubbles-equivalent) — oude gespreksgeschiedenis onder BlueBubbles-sessiesleutels wordt niet meegenomen naar iMessage-sessies.
- **ACP-bindingen** die verwijzen naar `match.channel: "bluebubbles"` moeten worden bijgewerkt naar `"imessage"`. De vormen van `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, kale handle) zijn identiek.

## Geen rollback-kanaal

Er is geen ondersteunde BlueBubbles-runtime om naar terug te schakelen. Als iMessage-verificatie mislukt, zet `channels.imessage.enabled: false`, start de Gateway opnieuw, los de `imsg`-blokkade op en probeer de omschakeling opnieuw.

De antwoordcache staat op `~/.openclaw/state/imessage/reply-cache.jsonl` (modus `0600`, bovenliggende map `0700`). Je kunt die veilig verwijderen als je met een schone lei wilt beginnen.

## Gerelateerd

- [BlueBubbles-verwijdering en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) — korte aankondiging en operatorsamenvatting.
- [iMessage](/nl/channels/imessage) — volledige iMessage-kanaalreferentie, inclusief `imsg launch`-installatie en capaciteitsdetectie.
- `/channels/bluebubbles` — legacy-URL die doorverwijst naar deze migratiegids.
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow.
- [Kanaalroutering](/nl/channels/channel-routing) — hoe de gateway een kanaal kiest voor uitgaande antwoorden.
