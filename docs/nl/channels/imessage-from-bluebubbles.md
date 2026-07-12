---
read_when:
    - Een overstap plannen van BlueBubbles naar de meegeleverde iMessage-plugin
    - BlueBubbles-configuratiesleutels vertalen naar iMessage-equivalenten
    - imsg verifiëren voordat de iMessage-plugin wordt ingeschakeld
summary: 'Vertaal oude BlueBubbles-configuraties naar de meegeleverde iMessage-plugin: sleuteltoewijzing, groepsallowlist-poorten en verificatie van de omschakeling.'
title: Overstappen vanaf BlueBubbles
x-i18n:
    generated_at: "2026-07-12T08:35:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles-ondersteuning is verwijderd. OpenClaw ondersteunt iMessage alleen via de meegeleverde `imessage`-plugin, die [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC aanstuurt en toegang biedt tot hetzelfde private API-oppervlak als BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, systeemeigen peilingen, groepsbeheer, bijlagen). Eén CLI-binair bestand vervangt de BlueBubbles-server, client-app en Webhook-infrastructuur: geen REST-eindpunt en geen Webhook-authenticatie.

Deze handleiding migreert oude `channels.bluebubbles`-configuraties naar `channels.imessage`. Er is geen ander ondersteund migratiepad. In de huidige versie van OpenClaw is een achtergebleven `channels.bluebubbles`-blok inert: geen enkel runtime-onderdeel leest het.

<Note>
Zie [Verwijdering van BlueBubbles en het imsg-pad voor iMessage](/nl/announcements/bluebubbles-imessage) voor de korte aankondiging en samenvatting voor beheerders.
</Note>

## Migratiechecklist

Dit is de kortste veilige aanpak als je je oude BlueBubbles-configuratie al kent:

1. Controleer `imsg` rechtstreeks op de Mac waarop Messages.app wordt uitgevoerd (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Kopieer gedragssleutels van `channels.bluebubbles` naar `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` en `actions`.
3. Verwijder transportsleutels die niet meer bestaan: `serverUrl`, `password`, Webhook-URL's en de BlueBubbles-serverconfiguratie.
4. Als de Gateway niet op de Mac met Messages wordt uitgevoerd, stel je `channels.imessage.cliPath` in op een SSH-wrapper en stel je `remoteHost` in om bijlagen op afstand op te halen.
5. Schakel `channels.imessage` in, start de Gateway opnieuw en voer vervolgens `openclaw channels status --probe --channel imessage` uit.
6. Test één privébericht, één toegestane groep, bijlagen indien ingeschakeld en elke private API-actie waarvan je verwacht dat de agent die gebruikt.
7. Verwijder de BlueBubbles-server en de oude `channels.bluebubbles`-configuratie nadat het iMessage-pad is geverifieerd.

## Wat imsg doet

`imsg` is een lokale macOS-CLI voor Messages. OpenClaw start `imsg rpc` als een onderliggend proces en communiceert via JSON-RPC over stdin/stdout. Er is geen HTTP-server, Webhook-URL, achtergronddienst, startagent of poort die beschikbaar moet worden gesteld.

- Berichten worden uit `~/Library/Messages/chat.db` gelezen via een alleen-lezen SQLite-handle.
- Live inkomende berichten komen van `imsg watch` / `watch.subscribe`, dat bestandssysteemgebeurtenissen voor `chat.db` volgt en terugvalt op periodieke controle.
- Voor normale tekst- en bestandsverzending wordt automatisering van Messages.app gebruikt.
- Voor geavanceerde acties gebruikt `imsg` `imsg launch` om de `imsg`-helper in Messages.app te injecteren. Dit maakt leesbevestigingen, typindicatoren, uitgebreide verzendingen, bewerken, verzenden ongedaan maken, antwoorden in threads, tapbacks, peilingen en groepsbeheer mogelijk.
- Linux-builds kunnen een gekopieerd `chat.db` inspecteren, maar kunnen niet verzenden, de live Mac-database bewaken of Messages.app aansturen. Voer voor OpenClaw iMessage `imsg` uit op de aangemelde Mac of via een SSH-wrapper naar die Mac.

## Voordat je begint

1. Installeer `imsg` op de Mac waarop Messages.app wordt uitgevoerd:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Voor de gebruikelijke lokale configuratie kan de OpenClaw-configuratie, na bevestiging door de gebruiker, aanbieden om `imsg` via Homebrew te installeren of bij te werken op de Mac waarop bij Messages is aangemeld. Handmatige configuraties en topologieën met een SSH-wrapper blijven onder beheer van de beheerder: herhaal de Homebrew-update in dezelfde lokale of externe gebruikerscontext waarin `imsg` wordt uitgevoerd. Als `imsg chats` mislukt met `unable to open database file`, lege uitvoer of `authorization denied`, verleen dan volledige schijftoegang aan de terminal, editor, het Node-proces, de Gateway-service of het bovenliggende SSH-proces dat `imsg` start, en open dat bovenliggende proces vervolgens opnieuw.

2. Controleer de lees-, bewakings-, verzend- en RPC-oppervlakken voordat je de OpenClaw-configuratie wijzigt:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Vervang `42` door een echte chat-ID uit `imsg chats`. Voor verzending is automatiseringstoestemming voor Messages.app vereist. Als OpenClaw via SSH wordt uitgevoerd, voer je deze opdrachten uit via dezelfde SSH-wrapper of gebruikerscontext die OpenClaw zal gebruiken. Als lezen werkt maar verzenden mislukt met AppleEvents `-1743`, controleer dan of de automatiseringstoestemming aan `/usr/libexec/sshd-keygen-wrapper` is toegekend; zie [Verzending via de SSH-wrapper mislukt met AppleEvents -1743](/nl/channels/imessage#requirements-and-permissions-macos).

3. Schakel de private API-brug in. Dit wordt sterk aanbevolen voor OpenClaw iMessage, omdat antwoorden, tapbacks, effecten, peilingen, antwoorden op bijlagen en groepsacties hiervan afhankelijk zijn:

   ```bash
   imsg launch
   imsg status --json
   ```

   Voor `imsg launch` moet SIP zijn uitgeschakeld (en op moderne versies van macOS moet bibliotheekvalidatie zijn versoepeld — zie [De private API van imsg inschakelen](/nl/channels/imessage#enabling-the-imsg-private-api)). Basisfuncties voor verzenden, geschiedenis en bewaken werken zonder `imsg launch`; het volledige iMessage-actieoppervlak van OpenClaw niet.

4. Nadat je `channels.imessage` hebt ingeschakeld en de Gateway hebt gestart, controleer je de brug via OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Het iMessage-account moet `works` rapporteren; met `--json` bevat de controlepayload `privateApi.available: true`. Als `false` wordt gerapporteerd, los je dat eerst op — zie [Mogelijkheidsdetectie](/nl/channels/imessage#private-api-actions). Voor controle is een bereikbare Gateway vereist (anders valt de CLI terug op uitvoer die alleen op de configuratie is gebaseerd) en alleen geconfigureerde, ingeschakelde accounts worden gecontroleerd.

5. Maak een momentopname van je configuratie:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Configuratievertaling

iMessage en BlueBubbles delen de meeste gedragssleutels op kanaalniveau. Wat verandert, is het transport (REST-server tegenover lokale CLI) en de indeling van de sleutel voor het groepsregister.

| BlueBubbles                                                | gebundelde iMessage                       | Opmerkingen                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Dezelfde semantiek (standaard `true` zodra het blok bestaat).                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.serverUrl`                           | _(verwijderd)_                            | Geen REST-server — de Plugin start `imsg rpc` via stdio.                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.password`                            | _(verwijderd)_                            | Geen Webhook-authenticatie nodig.                                                                                                                                                                                                                                                                                     |
| _(impliciet)_                                              | `channels.imessage.cliPath`               | Pad naar `imsg` (standaard `imsg`); gebruik een wrapperscript voor SSH.                                                                                                                                                                                                                                               |
| _(impliciet)_                                              | `channels.imessage.dbPath`                | Optionele overschrijving voor `chat.db` van Messages.app; wordt automatisch gedetecteerd wanneer weggelaten.                                                                                                                                                                                                         |
| _(impliciet)_                                              | `channels.imessage.remoteHost`            | `host` of `user@host` — alleen nodig wanneer `cliPath` een SSH-wrapper is en je bijlagen via SCP wilt ophalen.                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Dezelfde waarden (`pairing` / `allowlist` / `open` / `disabled`); standaard `pairing`.                                                                                                                                                                                                                                |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Dezelfde indelingen voor adressen (`+15555550123`, `user@example.com`). Goedkeuringen uit de koppelingsopslag worden niet overgedragen — zie hieronder.                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Dezelfde waarden (`allowlist` / `open` / `disabled`); standaard `allowlist`.                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Hetzelfde. Wanneer niet ingesteld, valt iMessage terug op `allowFrom`; een expliciet lege `groupAllowFrom: []` blokkeert alle groepen onder `groupPolicy: "allowlist"`.                                                                                                                                                 |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Kopieer de jokervermelding `"*"` letterlijk; geef vermeldingen per groep een nieuwe sleutel op basis van de numerieke iMessage-`chat_id` — zie 'Valkuil van het groepsregister'. `requireMention`, `tools`, `toolsBySender` en `systemPrompt` worden overgenomen.                                                          |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standaard `true`. Met de gebundelde Plugin wordt dit alleen uitgevoerd wanneer de controle voor de private API actief is.                                                                                                                                                                                             |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Dezelfde structuur, eveneens standaard uitgeschakeld. Als bijlagen via BlueBubbles binnenkwamen, stel dit dan expliciet in — inkomende foto's/media worden stilzwijgend genegeerd (geen logregel `Inbound message`) totdat je dit doet.                                                                                   |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale hoofdmappen; dezelfde jokerregels.                                                                                                                                                                                                                                                                             |
| _(n.v.t.)_                                                 | `channels.imessage.remoteAttachmentRoots` | Alleen gebruikt wanneer `remoteHost` is ingesteld voor ophalen via SCP.                                                                                                                                                                                                                                               |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standaard 16 MB op iMessage (de standaardwaarde van BlueBubbles was 8 MB). Stel dit expliciet in om de lagere limiet te behouden.                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standaard 4000 voor beide.                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Dezelfde expliciete inschakeling. Alleen voor privéberichten — groepen blijven elk bericht afzonderlijk doorsturen. Verhoogt de standaardvertraging voor inkomende berichten naar 7000 ms, tenzij `messages.inbound.byChannel.imessage` of een globale `messages.inbound.debounceMs` is ingesteld. Zie [Gesplitst verzonden privéberichten samenvoegen](/nl/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(n.v.t.)_                                | `imsg` levert al weergavenamen van afzenders uit `chat.db`.                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Dezelfde schakelaars per actie (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`), plus de nieuwe optie `polls`. Ze zijn allemaal standaard ingeschakeld; acties via de private API vereisen nog steeds de bridge. |

Configuraties met meerdere accounts (`channels.bluebubbles.accounts.*`) worden één-op-één omgezet naar `channels.imessage.accounts.*`.

## Valkuil van het groepsregister

De gebundelde iMessage-Plugin voert twee groepscontroles direct na elkaar uit. Een groepsbericht moet beide doorstaan om de agent te bereiken:

1. **Toegestane afzenders/chatdoelen** (`channels.imessage.groupAllowFrom`) — komt overeen met het adres van de afzender of het chatdoel (vermeldingen met `chat_id:`, `chat_guid:`, `chat_identifier:`). Wanneer `groupAllowFrom` niet is ingesteld, valt deze controle terug op `allowFrom`; een expliciete `groupAllowFrom: []` schakelt die terugval uit en verwijdert elk groepsbericht onder `groupPolicy: "allowlist"`.
2. **Groepsregister** (`channels.imessage.groups`) — gebruikt de numerieke iMessage-`chat_id` als sleutel:
   - Geen `groups`-blok (of een leeg blok): groepen doorstaan deze controle zolang controle 1 een niet-lege effectieve lijst met toegestane afzenders heeft; afzenderfiltering bepaalt de toegang en er verschijnt bij het opstarten geen waarschuwing dat alles wordt verwijderd.
   - `groups` met vermeldingen maar zonder `"*"`: alleen de vermelde `chat_id`-sleutels worden doorgelaten. Door een willekeurige groep te vermelden, wordt het register een lijst met toegestane groepen, zelfs onder `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: elke groep doorstaat deze controle.

De migratievalkuil: BlueBubbles gebruikte chat-GUID's/chat-id's als sleutels voor vermeldingen in `groups`, terwijl het iMessage-register de numerieke `chat_id` als sleutel gebruikt. Letterlijk gekopieerde vermeldingen per groep maken een niet-leeg register waarvan de sleutels nooit overeenkomen, waardoor elk groepsbericht bij controle 2 wordt verwijderd. Kopieer de jokervermelding `"*"` letterlijk; geef specifieke groepsvermeldingen nieuwe sleutels met `chat_id`-waarden uit `imsg chats`.

Beide verwijderingspaden zijn op het standaardlogniveau zichtbaar via `warn`-regels:

- Eén keer per account bij het opstarten, wanneer `groupPolicy: "allowlist"` is ingesteld en de effectieve lijst met toegestane groepsafzenders leeg is: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Stel `groupAllowFrom` (of `allowFrom`) in om afzenders toe te laten; alleen `groups` toevoegen voldoet niet aan de afzendercontrole.
- Eén keer per `chat_id` tijdens uitvoering, wanneer het register een groep verwijdert: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, met de exacte sleutel die moet worden toegevoegd.

Privéberichten blijven in beide gevallen werken — ze volgen een ander codepad, dus succesvolle privéberichten bewijzen niet dat groepsroutering werkt.

De minimale afzendergebonden configuratie met `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Hiermee worden de geconfigureerde afzenders in elke groep toegelaten. Voeg vermeldingen aan `groups` toe om toegestane chats te beperken of opties per chat in te stellen, zoals `requireMention`; kopieer de BlueBubbles-vermelding `"*"` letterlijk, maar geef specifieke vermeldingen nieuwe sleutels met numerieke iMessage-`chat_id`-waarden.

## Stap voor stap

1. Vertaal de configuratie. Houd het nieuwe blok uitgeschakeld terwijl je het bewerkt; het oude blok `channels.bluebubbles` wordt door de huidige versie van OpenClaw genegeerd en kan ter referentie ernaast blijven staan:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **Schakel over en voer een probe uit.** Stel `channels.imessage.enabled: true` in, start de Gateway opnieuw en bevestig dat het kanaal als gezond wordt gerapporteerd:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   Voor de probe is een bereikbare Gateway vereist en alleen geconfigureerde, ingeschakelde accounts worden gecontroleerd. Gebruik de rechtstreekse `imsg`-opdrachten in [Voordat je begint](#before-you-start) om de Mac zelf te valideren.

3. **Controleer privéberichten.** Stuur de agent een rechtstreeks bericht en bevestig dat het antwoord aankomt.

4. **Controleer groepen afzonderlijk.** Privéberichten en groepen volgen verschillende codepaden — succes met privéberichten bewijst niet dat groepen correct worden gerouteerd. Stuur een bericht in een toegestane groepschat en bevestig dat het antwoord aankomt. Als de groep stilvalt (geen antwoord van de agent en geen fout), controleer dan het Gateway-logboek op de twee `warn`-regels uit ‘Group registry footgun’ hierboven. De waarschuwing bij het opstarten betekent dat de effectieve lijst met toegestane afzenders leeg is; een waarschuwing per `chat_id` betekent dat een gevuld `groups`-register die chat niet bevat.

5. **Controleer het actieoppervlak.** Vraag de agent vanuit een gekoppeld privébericht om te reageren, te bewerken, het verzenden ongedaan te maken, te antwoorden, een foto te sturen en (in een groep) de groep te hernoemen of een deelnemer toe te voegen of te verwijderen. Elke actie hoort als systeemeigen actie in Messages.app terecht te komen. Als een actie de fout `iMessage <action> requires the imsg private API bridge` veroorzaakt, voer je `imsg launch` opnieuw uit en vernieuw je de status met `openclaw channels status --probe`.

6. **Verwijder de BlueBubbles-server en het blok `channels.bluebubbles`** zodra privéberichten, groepen en acties van iMessage zijn gecontroleerd. OpenClaw leest `channels.bluebubbles` niet.

## Actiepariteit in één oogopslag

| Actie                                               | verouderde BlueBubbles | gebundelde iMessage                                                           |
| --------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| Tekst verzenden / terugvallen op sms                | ✅                     | ✅                                                                            |
| Media verzenden (foto, video, bestand, spraak)      | ✅                     | ✅                                                                            |
| Antwoord in gesprek (`reply_to_guid`)               | ✅                     | ✅ (sluit [#51892](https://github.com/openclaw/openclaw/issues/51892))        |
| Tapback (`react`)                                   | ✅                     | ✅                                                                            |
| Bewerken / verzenden ongedaan maken (ontvangers met macOS 13+) | ✅          | ✅                                                                            |
| Verzenden met schermeffect                          | ✅                     | ✅ (sluit een deel van [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Tekst vet / cursief / onderstreept / doorgestreept opmaken | ✅             | ✅ (opmaak met getypeerde tekstsegmenten via attributedBody)                  |
| Systeemeigen peilingen van Messages (maken en stemmen) | ❌                  | ✅ (`actions.polls`; ontvangers hebben iOS/macOS 26+ nodig voor systeemeigen weergave) |
| Groep hernoemen / groepspictogram instellen         | ✅                     | ✅                                                                            |
| Deelnemer toevoegen/verwijderen, groep verlaten     | ✅                     | ✅                                                                            |
| Leesbevestigingen en typindicator                   | ✅                     | ✅ (afhankelijk van de probe van de private API)                              |
| Privéberichten van dezelfde afzender samenvoegen    | ✅                     | ✅ (alleen privéberichten; opt-in via `channels.imessage.coalesceSameSenderDms`) |
| Inkomende berichten herstellen na opnieuw opstarten | ✅                     | ✅ (automatisch: herhaling via `since_rowid` + deduplicatie op GUID; ruimer venster bij lokale uitvoering) |

iMessage herstelt berichten die zijn gemist terwijl de Gateway niet actief was: bij het opstarten worden berichten vanaf de laatst verzonden rowid opnieuw verwerkt via `imsg watch.subscribe` met `since_rowid`, op GUID gededupliceerd en onderdrukt een leeftijdsgrens voor verouderde achterstanden de ‘backlog bomb’ van een Push-flush. Dit verloopt via de RPC-verbinding van `imsg`, zodat het ook werkt voor externe SSH-configuraties van `cliPath`; lokale configuraties krijgen een ruimer herstelvenster omdat ze `chat.db` kunnen lezen. Zie [Inkomende berichten herstellen na het opnieuw opstarten van een bridge of Gateway](/nl/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Koppeling, sessies en ACP-bindingen

- **Lijsten met toegestane afzenders worden per handle overgenomen.** `channels.imessage.allowFrom` herkent dezelfde tekenreeksen `+15555550123` / `user@example.com` die BlueBubbles gebruikte — kopieer ze ongewijzigd.
- **Goedkeuringen uit de koppelingsopslag worden niet overgedragen.** De koppelingsopslag is kanaalspecifiek en de oude BlueBubbles-opslag wordt niet gemigreerd. Afzenders die uitsluitend via koppeling waren goedgekeurd, moeten nogmaals onder iMessage worden gekoppeld, of je voegt hun handles toe aan `allowFrom`.
- **Sessies** blijven beperkt tot de combinatie van agent en chat. Privéberichten worden met de standaardinstelling `session.dmScope=main` samengevoegd in de hoofdsessie van de agent; groepssessies blijven per `chat_id` geïsoleerd (`agent:<agentId>:imessage:group:<chat_id>`). Oude gespreksgeschiedenis onder BlueBubbles-sessiesleutels wordt niet overgenomen in iMessage-sessies.
- **ACP-bindingen** die verwijzen naar `match.channel: "bluebubbles"` moeten worden gewijzigd in `"imessage"`. De vormen van `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, alleen een handle) zijn identiek.

## Geen kanaal voor terugdraaien

Er is geen ondersteunde BlueBubbles-runtime om naar terug te schakelen. Als de controle van iMessage mislukt, stel je `channels.imessage.enabled: false` in, start je de Gateway opnieuw, verhelp je de blokkade in `imsg` en probeer je de overschakeling opnieuw.

De antwoordcache bevindt zich in de SQLite-status van de Plugin. `openclaw doctor --fix` importeert en archiveert het oude nevenbestand `imessage/reply-cache.jsonl` wanneer dit aanwezig is.

## Gerelateerd

- [Verwijdering van BlueBubbles en het iMessage-pad via imsg](/nl/announcements/bluebubbles-imessage) — korte aankondiging en samenvatting voor beheerders.
- [iMessage](/nl/channels/imessage) — volledige referentie voor het iMessage-kanaal, inclusief de configuratie van `imsg launch` en detectie van mogelijkheden.
- `/channels/bluebubbles` — verouderde URL die doorverwijst naar deze migratiehandleiding.
- [Koppeling](/nl/channels/pairing) — authenticatie van privéberichten en het koppelingsproces.
- [Kanaalroutering](/nl/channels/channel-routing) — hoe de Gateway een kanaal kiest voor uitgaande antwoorden.
