---
read_when:
    - Je bouwt of herstructureert het verzendpad van een Plugin voor een berichtenkanaal
    - U hebt duurzaam afleveren van definitieve antwoorden, ontvangstbevestigingen, afronding van livevoorbeelden of beleid voor ontvangstbevestiging nodig
    - U migreert van channel-message, channel-message-runtime of verouderde hulpfuncties voor antwoordafhandeling
summary: 'API voor de levenscyclus van uitgaande berichten voor kanaalplugins: adapters, ontvangstbevestigingen, duurzame verzending, livevoorbeeld en helpers voor de antwoordpijplijn'
title: API voor uitgaande kanaalberichten
x-i18n:
    generated_at: "2026-07-12T09:09:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channelplugins stellen gedrag voor uitgaande berichten beschikbaar via
`openclaw/plugin-sdk/channel-outbound`. Gebruik
`openclaw/plugin-sdk/channel-inbound` voor de orkestratie van
ontvangst/context/dispatch.

De kern beheert wachtrijen, duurzaamheid, algemeen beleid voor nieuwe pogingen, hooks, ontvangstbewijzen en
de gedeelde tool `message`. De plugin beheert systeemeigen aanroepen voor verzenden/bewerken/verwijderen,
normalisatie van doelen, platformspecifieke threads, geselecteerde citaten, meldingsvlaggen,
accountstatus en platformspecifieke neveneffecten.

## Adapter

De meeste plugins definiëren één `message`-adapter:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Declareer alleen mogelijkheden die het systeemeigen transport daadwerkelijk behoudt. Dek
elke gedeclareerde mogelijkheid voor verzending, ontvangstbewijs, livevoorbeeld en ontvangstbevestiging af met
de contracthelpers die vanuit dit subpad worden geëxporteerd.

## Opschoning voor platte tekst

Gebruik `sanitizeForPlainText(...)` wanneer een uitgaande adapter de
ondersteunde HTML-opmaaktags moet omzetten in lichtgewicht tekstopmaak. De standaardinstelling behoudt
de bestaande chatstijlmarkeringen voor vet en doorhalen. Geef
`{ style: "markdown" }` alleen door wanneer het kanaal het resultaat opnieuw als Markdown verwerkt:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

De Markdown-stijl gebruikt `**bold**` en `~~strikethrough~~`; cursief en inline
code behouden in beide stijlen de markeringen `_italic_` en backticks. Selecteer de stijl aan
de kanaalgrens in plaats van de markeringstekst na de opschoning te herschrijven.

## Afleveringsbewijs

Een `MessageReceipt` registreert het resultaat dat door een kanaaladapter wordt geretourneerd. Concrete
platformbericht-ID's tonen aan dat het verzendpad van het platform het
bericht heeft geaccepteerd; ze bewijzen niet dat het apparaat van een ontvanger het heeft weergegeven of gelezen.
Ontvangstbewijzen zonder platformbericht-ID's zijn alleen lokale ontvangstmetadata.
Kanalen met leesbevestigingen of een afleveringsstatus per apparaat moeten die gegevens
via een afzonderlijk kanaalspecifiek pad bijhouden.

Als een kanaaladapter kan bewijzen dat het opnieuw proberen van een fout geen
voor de ontvanger zichtbare verzending kan dupliceren en er geen aanroep met finalisatiemogelijkheid is gestart, genereer dan
`new PlatformMessageNotDispatchedError("...", { cause: error })` vanuit
`openclaw/plugin-sdk/error-runtime`. De kern kan dan verouderd bewijs van verzendpogingen
wissen en de intentie in de wachtrij veilig opnieuw proberen. Alleen de adapter die eigenaar is van de
uiteindelijke dispatchgrens mag deze bewering doen. Gebruik de markering nooit nadat een
finalisatie-/verzendaanroep is gestart of een dubbelzinnig resultaat heeft geretourneerd; een onjuiste markering kan
berichten dupliceren.

## Bestaande uitgaande adapters

Als het kanaal al een compatibele `outbound`-adapter heeft, leid dan de
berichtadapter daarvan af in plaats van verzendcode te dupliceren:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Duurzame verzendingen

Runtimehelpers voor verzending bevinden zich ook in `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helpers voor conceptstreaming/voortgang, zoals `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` retourneert één expliciete uitkomst:

| Uitkomst         | Betekenis                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `sent`           | ten minste één zichtbaar platformbericht is door het verzendpad van het platform geaccepteerd          |
| `suppressed`     | geen enkel platformbericht moet als ontbrekend worden beschouwd                                       |
| `partial_failed` | ten minste één platformbericht is geaccepteerd voordat een latere payload of een neveneffect mislukte  |
| `failed`         | er is geen platformontvangstbewijs geproduceerd                                                        |

Gebruik `payloadOutcomes` wanneer een batch verzonden, onderdrukte en mislukte
payloads combineert. Leid annulering door een hook niet af uit een leeg verouderd
resultaat voor rechtstreekse aflevering.

## Toelating van uitgestelde aflevering

Gebruik `message.durableFinal.admitDeferredDelivery(...)` wanneer een herleid account
door de kern beheerde uitgaande of uitgestelde aflevering niet veilig kan accepteren. De kern roept
deze hook synchroon aan vóór live uitgaand werk, inclusief paden die
persistentie in de wachtrij overslaan, en opnieuw vóór het opnieuw afspelen van een herstelde intentie. De context
bevat `cfg`, `channel`, `to`, `accountId` en een `phase` van `live` of
`recovery`.

Retourneer `{ status: "allowed" }` om door te gaan. Retourneer
`{ status: "permanent_rejection", reason }` wanneer de aflevering niet
persistent mag worden opgeslagen, rechtstreeks mag worden verzonden of opnieuw mag worden afgespeeld. Een live afwijzing mislukt vóór het aanmaken van de wachtrij,
berichthooks of platformwerk. Een afwijzing tijdens herstel markeert de
wachtrijrecord als mislukt en slaat reconciliatie en opnieuw afspelen over. Als de hook wordt weggelaten,
is aflevering toegestaan.

De hook is een synchrone toelatingsbeslissing, geen verzendpad. Lees alleen
reeds geladen configuratie of runtimestatus; voer geen netwerk-, bestandssysteem- of
andere asynchrone I/O uit. Contracttests moeten beide fasen en beide
resultaatvarianten uitvoeren via `ChannelMessageDurableFinalAdapter` vanuit
`openclaw/plugin-sdk/channel-outbound`.

## Compatibiliteitsdispatch

Stel de dispatch van antwoorden op inkomende berichten samen via `dispatchChannelInboundReply(...)`
vanuit `channel-inbound`. Houd platformaflevering in de afleveringsadapter; gebruik
`channel-outbound` voor berichtadapters, duurzame verzendingen, ontvangstbewijzen, livevoorbeelden
en opties voor de antwoordpijplijn.
