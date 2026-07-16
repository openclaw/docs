---
read_when:
    - WhatsApp-groepen specifiek configureren
    - WhatsApp-activeringsmodi wijzigen (`mention` versus `always`)
    - WhatsApp-groepssessiesleutels of context van wachtende berichten afstemmen
sidebarTitle: WhatsApp groups
summary: Afhandeling van WhatsApp-groepsberichten — activering, toelatingslijsten, sessies en contextinjectie
title: WhatsApp-groepsberichten
x-i18n:
    generated_at: "2026-07-16T15:10:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Voor het kanaaloverschrijdende groepsmodel (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), zie [Groepen](/nl/channels/groups). Deze pagina behandelt het WhatsApp-specifieke gedrag boven op dat model: activering, groepstoelatingslijsten, sessiesleutels per groep en contextinjectie van wachtende berichten.

Doel: OpenClaw laten deelnemen aan WhatsApp-groepen, alleen activeren wanneer het wordt aangeroepen en die conversatie gescheiden houden van de persoonlijke DM-sessie.

<Note>
`agents.list[].groupChat.mentionPatterns` wordt gedeeld met de vermeldingsfiltering van de andere kanalen. Stel dit voor configuraties met meerdere agents per agent in, of gebruik `messages.groupChat.mentionPatterns` als globale terugvaloptie. Als geen van beide is ingesteld, worden patronen afgeleid van de identiteitsnaam/emoji van de agent.
</Note>

## Gedrag

- Activeringsmodi: `mention` (standaard) of `always`. `mention` vereist een aanroep: een echte WhatsApp-@-vermelding (`mentionedJids`), een geconfigureerd regex-patroon, de E.164-cijfers van de bot ergens in de tekst of een geciteerd antwoord op een van de berichten van de bot (behalve bij zelfchatconfiguraties met een gedeeld nummer). `always` activeert de agent bij elk bericht, maar de geïnjecteerde groepsprompt geeft aan dat deze alleen moet antwoorden wanneer dat waarde toevoegt en anders exact het stille token `NO_REPLY` (hoofdletterongevoelig) moet retourneren. Standaardwaarden komen uit de configuratie (`channels.whatsapp.groups` `requireMention`) en kunnen per groep worden overschreven via `/activation`.
- Groepstoelatingslijst: wanneer `channels.whatsapp.groups` is ingesteld, worden alleen vermelde groeps-JID's toegelaten (neem `"*"` op om alles toe te staan); berichten uit niet-vermelde groepen worden genegeerd met een aanwijzing in het logboek.
- Groepsbeleid: `channels.whatsapp.groupPolicy` bepaalt of groepsberichten worden geaccepteerd (`open|disabled|allowlist`). `allowlist` gebruikt `channels.whatsapp.groupAllowFrom` (terugvaloptie: expliciete `channels.whatsapp.allowFrom`). De standaardwaarde is `allowlist` (geblokkeerd totdat je afzenders toevoegt).
- Sessies per groep: sessiesleutels zien eruit als `agent:<agentId>:whatsapp:group:<jid>` (bij niet-standaardaccounts wordt `:thread:whatsapp-account-<accountId>` toegevoegd), zodat instructies zoals `/verbose on`, `/trace on` of `/think high` (verzonden als zelfstandige berichten) tot die groep beperkt blijven; de persoonlijke DM-status blijft onaangetast.
- Contextinjectie: **alleen wachtende** groepsberichten (standaard 50) die _geen_ uitvoering activeerden, worden voorafgegaan door `[Chat messages since your last reply - for context]`, met de activerende regel onder `[Current message - respond to this]`. Het wachtende venster wordt na de uitvoering gewist; berichten die al in de sessie staan, worden niet opnieuw geïnjecteerd.
- Afzendervermelding: elke groepsregel bevat het afzenderlabel in de berichtenvelop, bijvoorbeeld `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, en de identiteit van de afzender plus het groepsonderwerp/de groepsleden worden opgenomen in het blok met niet-vertrouwde gespreksmetadata.
- Tijdelijk/eenmalig bekijken: omhullingen worden verwijderd voordat tekst/vermeldingen worden geëxtraheerd, zodat aanroepen daarin nog steeds activeren.
- Systeemprompt voor groepen: bij de eerste beurt van een groepssessie (en elke beurt nadat `/activation` de modus wijzigt) wordt activeringsbegeleiding in de systeemprompt geïnjecteerd (`Activation: trigger-only ...` of `Activation: always-on ...`, plus "richt je tot de specifieke afzender"). Permanente bezorgingsrichtlijnen voor groepschats ("Je bevindt je in een WhatsApp-groepschat...") worden altijd opgenomen.

## Configuratievoorbeeld (WhatsApp)

Zorg dat aanroepen via de weergavenaam werken, zelfs wanneer WhatsApp de zichtbare `@` uit de berichttekst verwijdert:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // venster voor wachtende groepscontext (standaard 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Opmerkingen:

- De reguliere expressies zijn hoofdletterongevoelig en gebruiken dezelfde beveiligingsmaatregelen voor veilige regex als andere configuratieoppervlakken voor regex; ongeldige patronen en onveilige geneste herhalingen worden genegeerd.
- WhatsApp verstuurt nog steeds canonieke vermeldingen via `mentionedJids` wanneer iemand op het contact tikt, dus de terugvaloptie met het nummer is zelden nodig, maar vormt een nuttig vangnet.
- Het venster voor wachtende context wordt bepaald als `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Activeringsopdracht (alleen eigenaar)

Gebruik de groepschatopdracht:

- `/activation mention`
- `/activation always`

Alleen eigenaarsnummers (uit `channels.whatsapp.allowFrom`, of het eigen E.164-nummer van de bot wanneer dit niet is ingesteld) kunnen dit wijzigen; `/activation` van iemand anders wordt genegeerd en alleen als context opgeslagen. Verzend `/status` als zelfstandig bericht in de groep om de huidige activeringsmodus te bekijken.

## Gebruik

1. Voeg je WhatsApp-account (het account waarop OpenClaw wordt uitgevoerd) toe aan de groep.
2. Zeg `@openclaw ...` (of neem het nummer op). Alleen afzenders op de toelatingslijst kunnen de agent activeren, tenzij je `groupPolicy: "open"` instelt.
3. De agentprompt bevat de wachtende groepscontext plus regels met afzenderlabels, zodat de agent zich tot de juiste persoon kan richten.
4. Sessie-instructies (`/verbose on`, `/trace on`, `/think high`, `/new` of `/reset`, `/compact`) zijn alleen van toepassing op de sessie van die groep; verzend ze als zelfstandige berichten zodat ze worden geregistreerd. Je persoonlijke DM-sessie blijft onafhankelijk.

## Testen/verificatie

- Handmatige rooktest:
  - Verzend een `@openclaw`-aanroep in de groep en controleer of het antwoord naar de naam van de afzender verwijst.
  - Verzend een tweede aanroep en controleer of het geschiedenisblok is opgenomen en vervolgens bij de volgende beurt is gewist.
- Controleer de Gateway-logboeken (uitvoeren met `--verbose`) op `inbound web message`-vermeldingen die `from: <groupJid>` en de berichttekst met afzenderlabel tonen.

## Bekende aandachtspunten

- Heartbeats worden uitgevoerd in de hoofdsessie van de agent; groepssessies krijgen nooit Heartbeat-uitvoeringen.
- Echo-onderdrukking onthoudt de gecombineerde prompt (geschiedenis + huidig bericht) per sessie, zodat de eigen bezorgde berichten van de bot deze niet opnieuw activeren; een identieke herhaalde batch kan als echo worden overgeslagen.
- Sessievermeldingen verschijnen als `agent:<agentId>:whatsapp:group:<jid>` in het SQLite-sessiearchief per agent; een ontbrekende vermelding betekent alleen dat de groep nog geen uitvoering heeft geactiveerd.
- Typindicatoren volgen `session.typingMode` / `agents.defaults.typingMode`. Wanneer voor zichtbare antwoorden de modus met uitsluitend berichttools is ingeschakeld, begint het typen standaard onmiddellijk, zodat groepsleden kunnen zien dat de agent bezig is, zelfs als er geen automatisch definitief antwoord wordt geplaatst. Een expliciete configuratie voor de typmodus heeft nog steeds voorrang.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Uitzendgroepen](/nl/channels/broadcast-groups)
