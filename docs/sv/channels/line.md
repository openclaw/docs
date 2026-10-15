---
read_when:
    - Du vill ansluta OpenClaw till LINE
    - Du behöver konfigurera LINE-Webhook + autentiseringsuppgifter
    - Du vill ha LINE-specifika meddelandealternativ
summary: Konfiguration, inställningar och användning av pluginen för LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-10-15T00:25:48Z"
    postprocess_version: locale-links-v1
    prompt_version: 32
    source_hash: f4de2decbf2d08f8d1767ccef1cccb2b785d54d221cb9ea4b5b8378c452026b0
    source_path: channels/line.md
    workflow: 17
---

LINE ansluter till OpenClaw via LINE Messaging API. Pluginen körs som en webhook-
mottagare på Gateway och använder din kanalåtkomsttoken + kanalhemlighet för
autentisering.

Status: officiell plugin, installeras separat. Direktmeddelanden, gruppchattar, medier,
platser, Flex-meddelanden, mallmeddelanden och snabbsvar stöds.
Reaktioner och trådar stöds inte.

## Installation

Installera LINE innan du konfigurerar kanalen:

```bash
openclaw plugins install @openclaw/line
```

Lokal utcheckning (vid körning från ett git-arkiv):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfiguration

1. Skapa ett LINE Developers-konto och öppna Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Skapa (eller välj) en Provider och lägg till en **Messaging API**-kanal.
3. Kopiera **Channel access token** och **Channel secret** från kanalinställningarna.
4. Aktivera **Use webhook** i inställningarna för Messaging API.
5. Ange din Gateway-slutpunkt som webhook-URL (HTTPS krävs):

```text
https://gateway-host/line/webhook
```

Gateway besvarar LINE:s signerade begäran om webhook-verifiering: en `POST` med en
tom `events`-lista. Signerade händelser i LINE:s `standby`-läge bekräftas utan
att köas eller besvaras, eftersom en annan kanal har kontroll över chatten. Andra signerade
inkommande händelser läggs i den beständiga inkommande kön före `200`. Agentens bearbetning
fortsätter asynkront.
Misslyckade leveranser görs om från kön, även efter en omstart av Gateway, och
händelser som konsekvent misslyckas blir misslyckade köposter efter ett begränsat antal återförsök. Om beständig
lagring misslyckas returnerar begäran
`500` i stället för att bekräfta en händelse som kan gå förlorad.
Leverans sker minst en gång över gränsen mellan kö och agent: om Gateway stängs av eller
kraschar under en pågående leverans kan turen spelas upp igen. Meddelandehändelser dedupliceras efter
LINE-meddelande-ID. Andra händelsetyper använder `webhookEventId`. Sparade poster om slutförda leveranser
undertrycker vanliga dubbletter av webhooks, men hanterare som utför externa sidoeffekter
bör ändå undvika att upprepa sina effekter vid återförsök.
Om du behöver en anpassad sökväg anger du `channels.line.webhookPath` eller
`channels.line.accounts.<id>.webhookPath` och uppdaterar URL:en därefter.

Säkerhetsinformation:

- LINE:s signaturverifiering beror på meddelandekroppen (HMAC över den råa kroppen), så OpenClaw tillämpar en strikt storleksgräns för kroppen före autentisering (64 KB) och en tidsgräns för läsning före verifiering.
- OpenClaw bearbetar webhook-händelser från de verifierade råa bytevärdena i begäran. `req.body`-värden som har omvandlats av tidigare mellanprogramvara ignoreras för att skydda signaturens integritet.

## Beständighet för inkommande händelser

Webhook-kontraktet i [Konfiguration](#setup) bekräftar en händelse först när den har lagts i
en beständig kö. Den beständiga `200` innehåller `x-openclaw-delivery-accepted: durable`. Signerade
verifieringspingar (tomma händelselistor), batcher med enbart standby-händelser och felsvar
utelämnar markören, så att
omvända proxyservrar kan kräva den för att skilja beständigt mottagande från en allmän
`200`. Därifrån sker leveransen genom kärnans tömning av kön för inkommande kanalhändelser med
LINE-specifika inställningar:

- **Ordningsföljd per konversation.** Händelser behandlas i serie per källflöde —
  `group:<groupId>`, `room:<roomId>` eller `user:<userId>`. Händelser utan en
  konversationskälla använder ett eget händelsespecifikt flöde. Inom ett flöde
  skickas händelser vidare i mottagningsordning, så en händelse som görs om fördröjer senare händelser i samma
  chatt. En chatts kö av väntande händelser blockerar aldrig en annan chatts flöde, men alla flöden delar
  en gräns på 8 samtidiga leveranser: andra chattar fortsätter oberoende så länge en
  plats är ledig, och ett 9:e flöde väntar på att en plats ska bli ledig.
- **Återförsök.** En misslyckad leverans görs om med exponentiellt ökande väntetid som börjar på
  1 sekund och fördubblas för varje försök, med ungefär två minuters sammanlagd väntetid
  under perioden. Efter det 8:e misslyckade försöket flyttas händelsen omedelbart till felkön
  (`retry-limit-exceeded`): LINE använder inte den allmänna minimiåldern på 24 timmar
  för flytt till felkön, så att en händelse som konsekvent misslyckas inte kan blockera sitt konversationsflöde i
  ett dygn.
- **Fel som inte kan åtgärdas med återförsök.** Dessa flyttas omedelbart till felkön, utan ytterligare
  återförsök oavsett antalet försök: lagrade nyttolaster som inte längre kan tolkas
  (`invalid-event`), leveranser som redan har verkställt sidoeffekter
  (`delivery-side-effects-committed`) och autentiseringsfel i LINE API
  (`authentication-failed`, HTTP 401/403).
- **Övervakning av avstannade leveranser.** En reserverad leverans som varken tas över av en agenttur
  eller rapporterar fortsatta framsteg i uppskjuten bearbetning under 5 minuter avbryts och släpps
  tillbaka till sitt flöde enligt samma återförsökspolicy som alla andra fel: händelsen
  återgår till väntande status med antalet försök ökat och `handler-timeout`
  registrerat som senaste fel, och behåller sin plats först i flödet. Ett
  stopp innebär inte i sig en flytt till felkön — endast återförsöksgränsen ovan avslutar händelsen,
  som `retry-limit-exceeded`. Övervakningen omfattar bara perioden mellan reservation
  och övertagande: framsteg i uppskjuten bearbetning återställer den och övertagandet stänger av den, så en lång
  agenttur avbryts aldrig av den. Övertaganden som sker efter att
  övervakningen har utlösts spärras, så en sen tur inte kan reservera en händelse som
  redan har lämnats tillbaka.
- **Återställning efter krasch.** Varje tömningsomgång börjar med en återställningsgenomgång som återtar
  alla reservationer vars ägande Gateway-process inte längre körs, så en leverans som förlorats
  vid en hård krasch görs om vid nästa genomgång i stället för efter en tidsgräns. Reservationens
  giltighetstid på 30 minuter är reservgränsen för det motsatta fallet: utan en
  lyckad förnyelse begränsar den hur länge en reservation förblir skyddad enbart
  för att ägarens PID fortfarande verkar vara aktivt — inklusive ett återanvänt PID vars processidentitet
  inte kan verifieras. Händelser som tas emot medan Gateway stoppas
  lagras fortfarande beständigt och behandlas ur kön efter nästa start.
- **Tidsfönster för dubblettundertryckning.** Vid varje insläpp tar LINE bort slutförda
  och misslyckade köposter som är äldre än 30 dagar och behåller sedan de 4096 senast
  uppdaterade posterna av varje typ per konto. Eftersom rensningen körs innan
  den nya händelsen läggs i kön i stället för med en timer kan poster finnas kvar längre än 30 dagar på
  ett inaktivt konto, och en nyligen slutförd post kan få antalet att överstiga 4096 fram till
  nästa insläpp. Så länge en post finns kvar bekräftas en återlevererad webhook för samma
  händelse utan att skickas vidare en andra gång. När posten har tagits bort — på grund av ålder eller
  antalsgränsen — släpps en återleverans in och skickas vidare igen, så hanterare med externa
  sidoeffekter bör inte betrakta detta tidsfönster som en ersättning för sitt eget
  skydd mot dubbletter.

Kontraktet som anger `500` vid lagringsfel hjälper bara om LINE skickar händelsen igen.
LINE återlevererar en webhook när **Webhook redelivery** är aktiverat för kanalen i
LINE Developers Console (inställningarna för Messaging API, intill **Use webhook**) och
botservern inte svarade `2xx`. Utan den inställningen skickas en händelse som nekats med
`500` inte igen. Även när inställningen är aktiverad sker återleverans efter bästa förmåga och är ingen
garanti: LINE dokumenterar att den inte är tillförlitlig, att antalet återförsök och
intervallet inte offentliggörs och att återlevererade händelser kan komma i fel ordning eller
mer än en gång (tidsfönstret för dubblettundertryckning ovan fångar upp upprepningarna). Se
[Återleverera en webhook som inte kunde tas emot](https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-redelivery).

Händelser som flyttats till felkön kan fortfarande granskas och, beroende på felorsaken,
återställas. Se [Inkommande händelser i felkön](/cli/channels#inbound-dead-letters) och
[Felsökning](#troubleshooting) nedan.

## Konfigurera

Minimal konfiguration:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Konfiguration för öppna direktmeddelanden:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Miljövariabler (endast standardkontot):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Filer för token/hemlighet:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` och `secretFile` måste peka på vanliga filer. Symboliska länkar avvisas.
Värden direkt i konfigurationen har företräde framför filer. Miljövariabler används som sista reserv för standardkontot.

Flera konton:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Åtkomstkontroll

Direktmeddelanden använder parkoppling som standard. Okända avsändare får en parkopplingskod och deras
meddelanden ignoreras tills de har godkänts:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Tillåtelselistor och policyer:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (standard `pairing`)
- `channels.line.allowFrom`: tillåtna LINE-användar-ID:n för direktmeddelanden. `dmPolicy: "open"` kräver `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (standard `allowlist`)
- `channels.line.groupAllowFrom`: tillåtna LINE-användar-ID:n för grupper. Poster i `allowFrom` för direktmeddelanden ger inte gruppavsändare åtkomst
- Åsidosättningar per grupp: `channels.line.groups.<groupId>.allowFrom` (samt `enabled`, `requireMention`, `systemPrompt`, `skills`). Med
  `groupPolicy: "allowlist"` anger du `groupAllowFrom` eller `allowFrom` per grupp. En tom tillåtelselista för grupper blockerar gruppmeddelanden även när direktmeddelanden är öppna.
- `channels.line.groups."*"` är posten med standardvärden för varje grupp och rum, inte en reserv som ersätts av en namngiven post. En namngiven post åsidosätter `"*"` fält för fält, så varje fält som den namngivna posten utelämnar hämtas från `"*"`. Detta motsvarar hur `requireMention` redan löses genom det gemensamma trädet för gruppomfattning. Se [Grupper](/channels/groups).
- Kontroll inför uppgradering: om du anger `enabled` eller `allowFrom` endast på `channels.line.groups."*"` samtidigt som du listar en namngiven grupp eller ett namngivet rum, gäller dessa jokerteckenvärden nu även för den namngivna posten. Tidigare utgåvor returnerade enbart den namngivna posten, så fält som endast angavs för jokertecknet nådde aldrig fram till den. Före uppgradering bör du granska alla `"*"`-poster som anger `enabled: false` eller begränsar `allowFrom`, och upprepa värdet på en namngiven post som ska behålla sin nuvarande åtkomst.
- Att citera ett av bottens egna meddelanden räknas som att tilltala den, så ett gruppsvar som görs med LINE:s citeringsgest når agenten utan ett uttryckligt omnämnande. Ange `channels.defaults.implicitMentions.quotedBot: false` för att förhindra att detta kringgår kravet på omnämnande. LINE läser det gemensamma standardvärdet och har inget eget `implicitMentions`-block på kanalnivå. Se [Grupper](/channels/groups). Botten känner igen citat av sina egna meddelanden bland de senaste som den minns att den har skickat (några hundra per konto), så ett citat av ett äldre meddelande, eller ett som skickades före den senaste omstarten av Gateway, kräver fortfarande ett omnämnande.
- Statiska åtkomstgrupper för avsändare kan refereras från `allowFrom`, `groupAllowFrom` och `allowFrom` per grupp med `accessGroup:<name>`. Se [Åtkomstgrupper](/channels/access-groups).
- Information om körmiljön: om `channels.line` saknas helt använder körmiljön `groupPolicy="allowlist"` som reserv för gruppkontroller (även om `channels.defaults.groupPolicy` är angivet).

LINE-ID:n är skiftlägeskänsliga. Giltiga ID:n ser ut så här:

- Användare: `U` + 32 hexadecimala tecken
- Grupp: `C` + 32 hexadecimala tecken
- Rum: `R` + 32 hexadecimala tecken

## Katalog

`openclaw directory peers list --channel line` listar användar-ID:n från det valda
kontots `allowFrom`, `groupAllowFrom` och `allowFrom`-poster för varje grupp.
`openclaw directory groups list --channel line` listar konfigurerade grupp- och rums-ID:n.
Prefix normaliseras till ID:n som går att skicka till, dubbletter visas en gång, och `*`- och
`accessGroup:<name>`-poster utelämnas. Använd `--account`, `--query`, `--limit`
och `--json` enligt beskrivningen i [Katalog](/cli/directory).

Dessa listor läser konfigurationen. De hämtar inte en aktuell kontaktlista från LINE och
inkluderar inte godkännanden som lagrats genom parkoppling.

## Presentationer när boten går med i en grupp

När boten går med i en tillåten grupp eller ett tillåtet flerpersonsrum publicerar den en
presentation där. LINE tillhandahåller ett gruppnamn via sitt API för gruppsammanfattningar, men
inget rumsnamn eller ämne för flerpersonsrum. Messaging API kan inte läsa tidigare
meddelanden, så presentationer använder endast tillgängliga metadata och frågar vad rummet
vill att boten ska ta sig an i stället för att hitta på aktivitet.

Presentationer är aktiverade som standard. Ange `channels.line.joinIntro: false` för att
inaktivera dem, eller använd `channels.line.accounts.<accountId>.joinIntro` för att åsidosätta inställningen
för ett konto. De körs aldrig i enskilda användarchattar eller när en annan medlem går med.
Se [presentationer när boten går med i en grupp](/channels#group-join-introductions) för tillträde till rum,
beteendet med en presentation per rum och den verktygsfria turen som behandlar rumsinnehåll
som icke betrott.

## Meddelandebeteende

- Text delas upp i delar om 5000 tecken.
- Markdown-formatering tas bort. Kodblock och tabeller omvandlas till Flex-kort
  när det är möjligt.
- Strömmande svar buffras. LINE tar emot hela delar. Laddningsanimationen
  körs endast i enskilda chattar — LINE:s laddnings-API accepterar ett användar-ID
  och avvisar grupp- och rums-ID:n — så ett gruppsvar kommer utan den. Heartbeat-turer
  visar också laddningsanimationen medan svaret genereras.
- Medienedladdningar begränsas av `channels.line.mediaMaxMb` (standard 10).
- Inkommande medier sparas under `~/.openclaw/media/inbound/` innan de skickas vidare
  till agenten, i samma gemensamma medielager som andra kanalpluginer använder.
- LINE:s webhooks innehåller ID:n men inga namn, så avsändarens visningsnamn och
  gruppens namn hämtas en gång och cachelagras i fem minuter. Grupp- och rumsmedlemmar
  läses via sin konversation, vilket är det enda sättet att se en
  medlem som inte har lagt till boten som vän. Om någon av uppslagningarna misslyckas används det råa
  ID:t och meddelandet levereras ändå. Flerpersonsrum saknar ett API för namn,
  så de behåller sitt rums-ID.
- LINE beskriver emoji i löptext med metadata och alternativtext. Tomma `()`-alternativ
  når agenten som `[emoji]`. Meningsfulla alternativ som
  `(hello)` och parenteser som avsändaren skrivit bevaras.
- LINE skickar flera bilder som valts i en enda åtgärd som en webhook-händelse per bild,
  i oordning. De hålls kvar en kort stund och besvaras som en enda tur som innehåller
  alla bilder, sorterade efter det index LINE rapporterar; för en avsändare vars klient utelämnar
  detta index - LINE 11.15 och tidigare för Android - behålls den ordning bilderna
  levererades i. En uppsättning som aldrig blir komplett levereras med det som
  kommit fram i stället för att hållas kvar på obestämd tid, några sekunder efter dess senaste
  del - eller när chattens kö når den, om den fortfarande väntar på sin
  tur. Allt annat som anländer under tiden - ett meddelande eller en annan uppsättning
  bilder - väntar bakom den, så svaren behåller den ordning som innehållet skickades i chatten; i en
  grupp omfattar kön hela rummet, eftersom LINE-konversationer ordnas per
  chatt och inte per medlem. En modell utan inbyggd bildförståelse läser bara den
  första bilden om inte `tools.media.image.attachments` anger både `mode: "all"` och
  `maxAttachments`; med bara en av nycklarna förblir gränsen en. En uppsättning vars delar
  inte anger ett totalt antal levereras med det som kommit fram och säger inget
  om resten, eftersom inget anger hur många de var.

## Citering i svar

`channels.line.replyToMode` styr inbyggda citatsvar (ett utgående svar
citerar synligt meddelandet det besvarar, vilket gör att gruppen ser vem boten
talar med):

| Värde             | Beteende                             |
| ----------------- | ------------------------------------ |
| `"off"` (standard) | Citera inte automatiskt           |
| `"first"`         | Citera endast det första svaret i en tur |
| `"all"`           | Citera varje svar i en tur          |

`"batched"`, som andra kanaler accepterar, avvisas här: det skiljer mellan ett
svar på en sammanförd tur och ett svar på en omedelbar tur, och inget i
LINE-flödet markerar en tur som sammanförd, så den skillnaden uppstår aldrig.

Åsidosättning per konto: `channels.line.accounts.<id>.replyToMode`. Det finns ingen
åsidosättning per chattyp: `replyToModeByChatType`, som Slack, Signal och
Mattermost accepterar, avvisas här, så ett konto citerar på samma sätt i
direktchattar och grupper.

```json5
{ channels: { line: { replyToMode: "all" } } }
```

Precis som på Telegram stänger `"off"` endast av automatisk citering: en uttrycklig svarstagg
som agenten skriver respekteras fortfarande. Svar citerar direkt i texten och förblir synliga i
konversationen, så inget döljs genom att placeras i trådar.

LINE citerar med hjälp av en token som utfärdas för varje inkommande meddelande i stället för meddelandets
ID, och OpenClaw kan bara citera ett meddelande vars token har sparats. Citering
har därför begränsningar som inställningen inte kan undanröja:

- LINE utfärdar en citeringstoken endast för text-, bild-, video- och dekalmeddelanden.
  Ett svar som besvarar någon annan typ skickas utan citat.
- LINE avvisar citat på Flex-kort, medier och platsmarkörer, så ett
  svar citerar en gång, i det första meddelandet som kan innehålla citatet. Ett svar som enbart består av
  dessa skickas utan citat.
- Ett svar kan bara citera ett meddelande som OpenClaw har tagit emot. LINE returnerar också en citeringstoken
  för varje meddelande som boten själv skickar, men dessa sparas inte, så ett svar
  som besvarar ett av botens egna tidigare meddelanden skickas utan citat.
- Endast ett meddelande som OpenClaw har lämnat till agenten som en egen tur sparas. I
  en grupp med `requireMention` aktiverat når ett överhoppat meddelande fortfarande agenten som
  en rad i grupphistoriken, men raden innehåller inget ID som svaret kan hänvisa till, så det
  kan inte citeras.
- En tur som en person startade genom att trycka på en knapp innehåller inget eget meddelande,
  så dess svar skickas utan citat.
- Token lagras i den Gateway som körs, de senaste 500 per konto över alla
  dess chattar. Ett svar som besvarar ett meddelande från före den senaste omstarten, ett
  som en mer aktiv chatt på samma konto sedan dess har trängt undan, eller ett som skickats av en
  separat process som `openclaw message send`, skickas utan citat.
- Om LINE avvisar en begäran som innehåller en citeringstoken med HTTP 400 försöker OpenClaw
  skicka samma svar igen utan citatet. Att radera eller återkalla det citerade
  meddelandet ogiltigförklarar inte i sig dess token; LINE kan i stället visa det citerade
  innehållet som otillgängligt. Se [Citatmeddelanden i LINE](https://developers.line.biz/en/docs/messaging-api/sending-messages/#send-quote-messages).

## Blockströmning

Blockströmning skickar varje färdigt assistentblock som ett eget LINE-meddelande
i stället för att vänta på hela svaret. Den är avstängd som standard, och
`channels.line.streaming` styr den enbart för LINE:

```json5
{ channels: { line: { streaming: { block: { enabled: true } } } } }
```

| Inställning                          | Effekt                                                               |
| -------------------------------- | -------------------------------------------------------------------- |
| `streaming.block.enabled: true`  | Skicka färdiga block så snart de är klara, oavsett agentens standardinställning  |
| `streaming.block.enabled: false` | Låt LINE fortsätta med hela svar även när agentens standardinställning är `on`       |
| ej angivet (standard)                  | Följ `agents.defaults.blockStreamingDefault`                       |
| `streaming.block.coalesce`       | Slå samman små block före sändning (`minChars`, `maxChars`, `idleMs`) |
| `streaming.chunkMode`            | `length` (standard) eller `newline` för att dela vid styckegränser     |

Åsidosättning per konto: `channels.line.accounts.<id>.streaming`. Detta är de
inställningar för blockströmning som är gemensamma för kanalerna; se
[Strömning](/concepts/streaming).

Varje block som LINE tar emot är ett separat meddelande, och LINE räknar meddelanden mot
kanalens månadskvot, så om detta lämnas avstängt skickas ett långt svar med så få
meddelanden som möjligt. `coalesce.minChars` är inställningen att använda om du vill att block ska komma tidigt men
inte ett stycke i taget — OpenClaws eget standardvärde är 800 tecken.

LINE kan inte redigera ett meddelande som redan har skickats, så det finns inget läge för förhandsvisning
av strömmande svar: här finns varken `streaming.mode` eller `streaming.preview`, och ett svar
ändras aldrig på plats.

## Strukturerade meddelanden med utökat innehåll

Använd de gemensamma presentationsfälten för meddelanden för val som fungerar över flera kanaler. LINE visar
`buttons`-block som Flex-kontroller och `select`-block som snabbsvar. Ett block med två knappar
är den kanaloberoende formen för bekräftelser.

Ett `buttons`-block visas som ett Flex-kort som innehåller presentationens titel och
text. En presentation vars enda kontroll är en `select` visas utan kort, eftersom
snabbsvar kopplas till svarets eget textmeddelande. Dess titel och textblock
läggs i stället till i den texten. LINE visar högst 13 snabbsvar i ett
meddelande, räknat över alla `select`-block i svaret och inte per block.
Varje valkontroll håller ihop sin uppmaning och eventuella överskjutande alternativ i den texten.
Uppmaningar och namn på överskjutande alternativ förblir fullständiga. Endast etiketter på inbyggda snabbsvarsknappar
förkortas till LINE:s gräns på 20 tecken.

I direktchattar blir alternativen som en `ask_user`-fråga erbjuder tryckbara kontroller
på samma Flex-kort, och ett tryck besvarar frågan direkt. LINE skickar det alternativindex
som Gateway tilldelade i stället för etiketten, så ett svar vars alternativ Gateway inte längre
listar faller tillbaka på läsbar text i stället för att visa en tryckbar kontroll som besvarar frågan med fel
alternativ. Formen som stöds är en enda fråga där ett alternativ kan väljas, som inte gäller hemlig information och som erbjuder två till
fyra olika alternativ — samma gräns som Telegram, Discord och Slack använder; allt annat
förblir läsbar text som fortfarande kan besvaras med ett skrivet svar. Grupper, flerpersonschattar och
okända destinationer använder också denna läsbara reservlösning. LINE:s postbacks för grupper och rum
innehåller inte den avsändaridentitet som behövs för att tillåta ett svar på en fråga;
svara med alternativets text i stället.

Fritextkontrollen **Annat…** visas inte. Ett tryck på den avgör inget i sig, och LINE
kan inte ta bort en kontroll från ett kort som redan har levererats, så knappen skulle lägga till ett tryck som
inte ändrar något utöver vad frågans egen text redan erbjuder. Discord och Slack låter det
alternativet finnas i text av samma skäl. I direktchattar som uppfyller villkoren behåller varje angivet alternativ
en inbyggd kontroll, och **Annat…** står kvar i kortets text under `Actions:` oavsett antalet alternativ.

LINE kan inte redigera ett meddelande som redan har levererats, så kontrollerna finns kvar på skärmen efter
att frågan avslutats. Ett tryck som kommer då besvaras med `That question is no longer
waiting for an answer.` Inledande tryck följer kanalens vanliga regler för tillträde och
parkoppling. Om parkopplingen återkallas medan frågan läses ignoreras svaret
utan någon svarsavisering eller ny begäran om parkoppling. Gateway rapporterar ett
gemensamt sluttillstånd för besvarade, avbrutna och utgångna frågor, så aviseringen
anger inte vilket av dem det var.

```json5
{
  action: "send",
  message: "Välj en åtgärd",
  presentation: {
    title: "Meny",
    blocks: [
      {
        type: "buttons",
        buttons: [
          { label: "Status", action: { type: "command", command: "/status" } },
          { label: "Webbplats", action: { type: "url", url: "https://example.com" } },
        ],
      },
      {
        type: "select",
        placeholder: "Välj ett alternativ",
        options: [
          { label: "Alfa", action: { type: "callback", value: "alpha" } },
          { label: "Hjälp", action: { type: "command", command: "/help" } },
        ],
      },
    ],
  },
}
```

Utdata som enbart gäller LINE använder de schemavaliderade fälten `channelData.line` på
`message(action="send")`. Skicka en plats och/eller en `card`. De korttyper som stöds
är `media_player`, `event`, `agenda`, `device` och `appletv_remote`.

```json5
{
  action: "send",
  message: "Varsågod",
  channelData: {
    line: {
      location: {
        title: "Kontor",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      card: {
        type: "event",
        title: "Teammöte",
        date: "2026-08-18",
        time: "10:00",
        location: "Konferensrum",
        description: "Veckoplanering",
      },
    },
  },
}
```

Andra kortformat:

```json5 validate=false
{ type: "media_player", title: "Låt", artist: "Artist", source: "Vardagsrum", status: "playing", imageUrl: "https://example.com/cover.jpg" }
{ type: "agenda", title: "Idag", events: [{ title: "Daglig avstämning", time: "09:00", location: "Online" }] }
{ type: "device", name: "TV", deviceType: "Strömningsbox", status: "Spelar", controls: [{ label: "Pausa", action: "pause" }] }
{ type: "appletv_remote", name: "Vardagsrum", status: "Spelar" }
```

Strängar med dubbla hakparenteser som `[[buttons: ...]]` är vanlig text och tolkas inte
som instruktioner för meddelanden med utökat innehåll.

LINE-pluginen innehåller också kommandot `/card` för förinställda Flex-meddelanden:

```text
/card info "Välkommen" "Tack för att du gick med!"
```

Kortbilder och ikoner måste använda HTTPS. OpenClaw tar bort bilder med felaktiga URL:er eller
URL:er som inte använder HTTPS och lägger till meddelandet ”Bild inte tillgänglig” när det ryms inom LINE:s
gränser på 30 KB för bubblor och 50 KB för karuseller. Videor i huvudsektionen
behåller sitt obligatoriska alternativa innehåll: om videons eller förhandsvisningens URL inte kan användas
används det innehållet, och en alternativ bild som inte kan användas blir en textruta.
Ogiltiga mallminiatyrer tas bort. Karusellminiatyrer tas bort tillsammans
så att alla kolumner behåller samma bildlayout. Text och åtgärdsknappar förblir intakta.

## ACP-stöd

LINE stöder konversationsbindningar för ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` binder den aktuella LINE-chatten till en ACP-session utan att skapa en undertråd.
- Konfigurerade ACP-bindningar och aktiva konversationsbundna ACP-sessioner fungerar på LINE som på andra konversationskanaler.

Se [ACP-agenter](/tools/acp-agents) för mer information.

## Utgående medier

LINE-pluginen skickar bilder, videor och ljud via agentens meddelandeverktyg:

- **Bilder**: skickas som LINE-bildmeddelanden. Förhandsvisningsbilden använder mediets URL som standard.
- **Videor**: kräver en förhandsvisningsbild. Ange en bild-URL i `channelData.line.previewImageUrl`.
- **Ljud**: skickas som LINE-ljudmeddelanden. Längden är som standard 60 sekunder om inte `channelData.line.durationMs` anges.

När `mediaKind` utelämnas härleder LINE det från LINE-specifika alternativ eller URL:ens
suffix. Den inbyggda suffixbaserade härledningen stöder JPEG/PNG, MP4 och MP3/M4A. URL:er utan suffix
behåller bild som reservval. Andra URL:er med suffix och härledd MP4 utan förhandsvisning
blir textlänkar. Explicit angiven video kräver fortfarande `previewImageUrl`.

URL:er för utgående medier måste vara offentliga HTTPS-URL:er med högst 2000 tecken. OpenClaw
validerar målvärdnamnet innan URL:en överlämnas till LINE och avvisar loopbackadresser,
länklokala adresser och mål i privata nätverk.

## Felsökning

- **Webhook-verifieringen misslyckas:** kontrollera att webhook-URL:en använder HTTPS och att
  `channelSecret` stämmer överens med LINE-konsolen.
- **Inga inkommande händelser:** kör `openclaw channels status --probe`. LINE levererar bara
  händelser medan kanalens webhook-URL är registrerad och **Use webhook** är aktiverat på
  fliken Messaging API i LINE Developers Console, och kontrollen rapporterar båda —
  en kanal vars webhook är avstängd eller oregistrerad anges tillsammans med inställningen som behöver ändras.
  OpenClaw ställer inte in något av detta åt dig: URL:en har ett API men är beroende av en offentlig
  adress som OpenClaw inte känner till, och reglaget **Use webhook** har inget API alls.
  Webhook-statusen kommer från kontrollen, så
  `openclaw channels status` utan `--probe` rapporterar den inte. Om kontrollen
  rapporterar att webhook är aktiverad, bekräfta att webhook-sökvägen stämmer överens med
  `channels.line.webhookPath` och att Gateway kan nås från LINE.
- **Fel vid medienedladdning:** höj `channels.line.mediaMaxMb` om mediet överskrider
  standardgränsen.
- **Push-meddelanden nekas med HTTP 429:** kör
  `openclaw channels status --channel line --probe --json`. Vid begränsad kvot
  innehåller kontots `quota` värdena `used` och `limit`. Saknad kvot är okänd, inte obegränsad.
  En fungerande botidentitet kan förekomma samtidigt som kvoten för push-meddelanden är förbrukad. Kontrollera
  kontots kvot eller abonnemang i LINE Official Account Manager innan du försöker igen.
  429 kan också bero på anropsbegränsningar eller tillfälliga meddelandereservationer. Vanliga
  meddelanden med svarstoken förbrukar inte denna månadskvot, till skillnad från push-meddelanden.
  Se [Prissättning för LINE-meddelanden](https://developers.line.biz/en/docs/messaging-api/pricing/).
- **Boten hoppar över meddelanden utan att meddela det (händelser placeras i felkö):** `openclaw logs` visar
  `line: spooled update <id> ... dead-lettered`-rader med felorsaken.
  Granska med `openclaw channels dead-letters list --channel line --account default`
  och kontrollera felorsaken före återställning: `resubmit` lägger tillbaka händelsen i kön utifrån dess
  id utan att kontrollera varför den misslyckades. När du har åtgärdat orsaken till ett fel
  utan verkställda sidoeffekter (till exempel `retry-limit-exceeded` efter ett
  avbrott hos leverantören), lägg tillbaka en händelse i kön med
  `openclaw channels dead-letters resubmit <event-id> --channel line --account default`.
  Skicka aldrig in en `delivery-side-effects-committed`-händelse igen: den orsaken innebär att
  leveransen redan har övertagit en agenttur eller förbrukat sin svarstoken, så
  att lägga tillbaka den i kön upprepar det verkställda arbetet — till exempel ett andra synligt svar.
  `openclaw health` rapporterar antalet händelser i felkön och `openclaw doctor` anger
  berörda konton.
- **Återförsök vid `handler-timeout`:** leveransen togs i anspråk men nådde varken
  övertagandet av en agenttur eller rapporterade framsteg för uppskjuten körning under 5 minuter. Detta är ett
  stopp _innan_ turen startar —
  övertagandet avaktiverar övervakningstimern, så en tur som redan körs är aldrig
  orsaken och avbryts aldrig av den. Granska i stället fördelningsflödet: de
  leveransförberedelser som körs mellan ianspråktagandet och övertagandet, till exempel nedladdning av
  inkommande medier eller en Gateway som inte tar emot nytt arbete. Detta placerar inte
  händelsen i felkön. `openclaw logs` visar
  `applying retry policy (handler-timeout)` och händelsen väntar ut fördröjningen inför nästa försök
  med `handler-timeout` som sitt senaste fel. Ett stopp som upprepas är det som
  till slut förbrukar alla återförsök, så en händelse som hamnar i felkön efter upprepade
  stopp hamnar under `retry-limit-exceeded`, inte under en tidsgränsorsak. Kontrollera
  `openclaw logs --follow` kring det berörda händelse-id:t.

## Relaterat

- [Översikt över kanaler](/channels) — alla kanaler som stöds
- [Parkoppling](/channels/pairing) — autentisering för direktmeddelanden och parkopplingsflöde
- [Grupper](/channels/groups) — gruppchattbeteende och krav på omnämnande
- [Kanalroutning](/channels/channel-routing) — sessionsroutning för meddelanden
- [Säkerhet](/gateway/security) — åtkomstmodell och härdning
