---
read_when:
    - WhatsApp-groepen specifiek configureren
    - WhatsApp-activeringsmodi wijzigen (`mention` versus `always`)
    - WhatsApp-groepssessiesleutels of context voor wachtende berichten afstemmen
sidebarTitle: WhatsApp groups
summary: Afhandeling van WhatsApp-groepsberichten — activering, toelatingslijsten, sessies en contextinjectie
title: WhatsApp-groepsberichten
x-i18n:
    generated_at: "2026-05-06T09:02:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

Voor het model voor cross-channel groepen (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo), zie [Groepen](/nl/channels/groups). Deze pagina behandelt het WhatsApp-specifieke gedrag bovenop dat model: activering, allowlists voor groepen, sessiesleutels per groep en contextinjectie voor wachtende berichten.

Doel: OpenClaw in WhatsApp-groepen laten meedoen, alleen wakker laten worden wanneer het wordt gepingd, en die thread gescheiden houden van de persoonlijke DM-sessie.

<Note>
`agents.list[].groupChat.mentionPatterns` wordt ook gebruikt door Telegram, Discord, Slack en iMessage. Stel dit voor setups met meerdere agents per agent in, of gebruik `messages.groupChat.mentionPatterns` als globale fallback.
</Note>

## Gedrag

- Activeringsmodi: `mention` (standaard) of `always`. `mention` vereist een ping (echte WhatsApp-@vermeldingen via `mentionedJids`, veilige regex-patronen, of het E.164-nummer van de bot ergens in de tekst). `always` maakt de agent wakker bij elk bericht, maar hij zou alleen moeten antwoorden wanneer hij betekenisvolle waarde kan toevoegen; anders retourneert hij het exacte stille token `NO_REPLY` / `no_reply`. Standaarden kunnen in de configuratie (`channels.whatsapp.groups`) worden ingesteld en per groep via `/activation` worden overschreven. Wanneer `channels.whatsapp.groups` is ingesteld, fungeert dit ook als allowlist voor groepen (neem `"*"` op om alles toe te staan).
- Groepsbeleid: `channels.whatsapp.groupPolicy` bepaalt of groepsberichten worden geaccepteerd (`open|disabled|allowlist`). `allowlist` gebruikt `channels.whatsapp.groupAllowFrom` (fallback: expliciet `channels.whatsapp.allowFrom`). Standaard is `allowlist` (geblokkeerd totdat je afzenders toevoegt).
- Sessies per groep: sessiesleutels zien eruit als `agent:<agentId>:whatsapp:group:<jid>`, zodat opdrachten zoals `/verbose on`, `/trace on` of `/think high` (verzonden als losse berichten) tot die groep beperkt blijven; de persoonlijke DM-status blijft onaangetast. Heartbeats worden voor groepsthreads overgeslagen.
- Contextinjectie: groepsberichten die **alleen wachten** (standaard 50) en _geen_ run hebben geactiveerd, worden voorafgegaan door `[Chat messages since your last reply - for context]`, met de activerende regel onder `[Current message - respond to this]`. Berichten die al in de sessie staan, worden niet opnieuw geïnjecteerd.
- Afzenderweergave: elke groepsbatch eindigt nu met `[from: Sender Name (+E164)]`, zodat Pi weet wie er spreekt.
- Vluchtig/view-once: we pakken deze uit voordat tekst/vermeldingen worden geëxtraheerd, zodat pings daarin nog steeds activeren.
- Systeemprompt voor groepen: bij de eerste beurt van een groepssessie (en telkens wanneer `/activation` de modus wijzigt) injecteren we een korte toelichting in de systeemprompt, zoals `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Als metadata niet beschikbaar is, vertellen we de agent nog steeds dat het een groepschat is.

## Configuratievoorbeeld (WhatsApp)

Voeg een `groupChat`-blok toe aan `~/.openclaw/openclaw.json`, zodat pings op weergavenaam werken, zelfs wanneer WhatsApp de visuele `@` uit de tekstbody verwijdert:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Opmerkingen:

- De regexes zijn hoofdletterongevoelig en gebruiken dezelfde safe-regex-vangrails als andere configuratievlakken voor regexes; ongeldige patronen en onveilige geneste herhaling worden genegeerd.
- WhatsApp verstuurt nog steeds canonieke vermeldingen via `mentionedJids` wanneer iemand op het contact tikt, dus de fallback op nummer is zelden nodig, maar is een nuttig vangnet.

### Activeringsopdracht (alleen eigenaar)

Gebruik de groepschatopdracht:

- `/activation mention`
- `/activation always`

Alleen het nummer van de eigenaar (uit `channels.whatsapp.allowFrom`, of het eigen E.164-nummer van de bot wanneer dit niet is ingesteld) kan dit wijzigen. Verstuur `/status` als los bericht in de groep om de huidige activeringsmodus te zien.

## Gebruik

1. Voeg je WhatsApp-account (het account waarop OpenClaw draait) toe aan de groep.
2. Zeg `@openclaw …` (of neem het nummer op). Alleen afzenders op de allowlist kunnen dit activeren, tenzij je `groupPolicy: "open"` instelt.
3. De agentprompt bevat recente groepscontext plus de afsluitende marker `[from: …]`, zodat hij de juiste persoon kan aanspreken.
4. Richtlijnen op sessieniveau (`/verbose on`, `/trace on`, `/think high`, `/new` of `/reset`, `/compact`) gelden alleen voor de sessie van die groep; verstuur ze als losse berichten zodat ze worden geregistreerd. Je persoonlijke DM-sessie blijft onafhankelijk.

## Testen / verificatie

- Handmatige smoke-test:
  - Verstuur een `@openclaw`-ping in de groep en bevestig een antwoord dat naar de naam van de afzender verwijst.
  - Verstuur een tweede ping en verifieer dat het geschiedenisblok wordt opgenomen en vervolgens bij de volgende beurt wordt gewist.
- Controleer Gateway-logboeken (uitvoeren met `--verbose`) om vermeldingen van `inbound web message` te zien met `from: <groupJid>` en het achtervoegsel `[from: …]`.

## Bekende aandachtspunten

- Heartbeats worden voor groepen bewust overgeslagen om rumoerige broadcasts te vermijden.
- Echo-onderdrukking gebruikt de gecombineerde batchstring; als je twee keer identieke tekst zonder vermeldingen verstuurt, krijgt alleen de eerste een reactie.
- Sessiestore-vermeldingen verschijnen als `agent:<agentId>:whatsapp:group:<jid>` in de sessiestore (standaard `~/.openclaw/agents/<agentId>/sessions/sessions.json`); een ontbrekende vermelding betekent alleen dat de groep nog geen run heeft geactiveerd.
- Typing-indicatoren in groepen volgen `agents.defaults.typingMode`. Wanneer zichtbare antwoorden de standaardmodus gebruiken waarbij alleen de berichtentool zichtbaar is, start typing standaard onmiddellijk, zodat groepsleden kunnen zien dat de agent bezig is, zelfs als er geen automatisch eindantwoord wordt geplaatst. Expliciete typing-mode-configuratie heeft nog steeds voorrang.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Broadcast-groepen](/nl/channels/broadcast-groups)
