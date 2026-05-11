---
read_when:
    - Je onderzoekt afwijzingen van providerverzoeken die samenhangen met de transcriptstructuur
    - Je wijzigt de transcriptopschoning of de herstellogica voor toolaanroepen
    - Je onderzoekt niet-overeenkomende toolaanroep-ID's tussen aanbieders
summary: 'Referentie: providerspecifieke regels voor het opschonen en herstellen van transcripties'
title: Transcripthygiëne
x-i18n:
    generated_at: "2026-05-11T20:49:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw past **providerspecifieke correcties** toe op transcripties vóór een run (bij het bouwen van modelcontext). De meeste hiervan zijn **in-memory** aanpassingen die worden gebruikt om aan strikte providervereisten te voldoen. Een afzonderlijke herstelpass voor sessiebestanden kan opgeslagen JSONL ook herschrijven voordat de sessie wordt geladen, maar alleen voor misvormde regels of opgeslagen turns die geen geldige duurzame records zijn. Afgeleverde assistentantwoorden blijven op schijf behouden; providerspecifiek verwijderen van assistentprefill gebeurt alleen tijdens het samenstellen van uitgaande payloads. Wanneer herstel plaatsvindt, wordt er naast het sessiebestand een back-up van het oorspronkelijke bestand gemaakt.

Scope omvat:

- Runtime-only promptcontext buiten gebruikerszichtbare transcriptieturns houden
- Sanering van tool call-id's
- Validatie van tool call-invoer
- Herstel van koppeling van toolresultaten
- Turnvalidatie / ordening
- Opschonen van gedachtesignatures
- Opschonen van thinking-signatures
- Sanering van afbeeldingspayloads
- Opschonen van lege tekstblokken vóór provider-replay
- Tagging van herkomst van gebruikersinvoer (voor tussen sessies gerouteerde prompts)
- Herstel van lege assistentfoutturns voor Bedrock Converse-replay

Als je details over transcriptieopslag nodig hebt, zie:

- [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction)

---

## Globale regel: runtimecontext is geen gebruikerstranscriptie

Runtime-/systeemcontext kan voor een turn aan de modelprompt worden toegevoegd, maar het is
geen inhoud die door de eindgebruiker is geschreven. OpenClaw houdt een afzonderlijke, op transcriptie gerichte
promptbody bij voor Gateway-antwoorden, vervolgberichten in de wachtrij, ACP, CLI en ingebedde Pi-
runs. Opgeslagen zichtbare gebruikersturns gebruiken die transcriptiebody in plaats van de
met runtime verrijkte prompt.

Voor legacy-sessies die al runtime-wrappers hebben opgeslagen, passen Gateway-geschiedenis-
surfaces een displayprojectie toe voordat berichten worden teruggestuurd naar WebChat,
TUI-, REST- of SSE-clients.

---

## Waar dit draait

Alle transcriptiehygiëne is gecentraliseerd in de ingebedde runner:

- Beleidsselectie: `src/agents/transcript-policy.ts`
- Toepassing van sanering/herstel: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Het beleid gebruikt `provider`, `modelApi` en `modelId` om te bepalen wat wordt toegepast.

Los van transcriptiehygiëne worden sessiebestanden (indien nodig) vóór het laden hersteld:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aangeroepen vanuit `run/attempt.ts` en `compact.ts` (ingebedde runner)

---

## Globale regel: afbeeldingssanering

Afbeeldingspayloads worden altijd gesaneerd om afwijzing aan providerzijde door grootte-
limieten te voorkomen (oversized base64-afbeeldingen verkleinen/opnieuw comprimeren).

Dit helpt ook de door afbeeldingen gedreven tokendruk te beheersen voor vision-capable modellen.
Lagere maximale afmetingen verminderen doorgaans tokengebruik; hogere afmetingen behouden detail.

Implementatie:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Maximale afbeeldingszijde is configureerbaar via `agents.defaults.imageMaxDimensionPx` (standaard: `1200`).
- Lege tekstblokken worden verwijderd terwijl deze pass replay-inhoud doorloopt. Assistent-
  turns die daardoor leeg worden, worden uit de replay-kopie verwijderd; gebruikers- en toolresultaat-
  turns die leeg worden, krijgen een niet-lege placeholder voor weggelaten inhoud.

---

## Globale regel: misvormde tool calls

Assistentblokken voor tool calls waarbij zowel `input` als `arguments` ontbreekt, worden verwijderd
voordat modelcontext wordt gebouwd. Dit voorkomt providerafwijzingen door gedeeltelijk
opgeslagen tool calls (bijvoorbeeld na een rate limit-fout).

Implementatie:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Toegepast in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale regel: herkomst van invoer tussen sessies

Wanneer een agent via `sessions_send` een prompt naar een andere sessie stuurt (inclusief
antwoord-/aankondigingsstappen van agent naar agent), slaat OpenClaw de aangemaakte gebruikersturn op met:

- `message.provenance.kind = "inter_session"`

OpenClaw voegt ook een same-turn-marker `[Inter-session message ... isUser=false]`
toe vóór de gerouteerde prompttekst, zodat de actieve modelaanroep uitvoer uit een vreemde sessie kan onderscheiden
van externe eindgebruikersinstructies. Deze marker bevat
de bronsessie, het kanaal en de tool wanneer beschikbaar. De transcriptie gebruikt nog steeds
`role: "user"` voor providercompatibiliteit, maar zowel de zichtbare tekst als de herkomst-
metadata markeren de turn als gegevens tussen sessies.

Tijdens het opnieuw bouwen van context past OpenClaw dezelfde marker toe op oudere opgeslagen
gebruikersturns tussen sessies die alleen herkomstmetadata hebben.

---

## Providermatrix (huidig gedrag)

**OpenAI / OpenAI Codex**

- Alleen afbeeldingssanering.
- Laat verweesde redeneringssignatures vallen (losstaande redeneringsitems zonder een volgend inhoudsblok) voor OpenAI Responses/Codex-transcripties, en laat replaybare OpenAI-redenering vallen na een modelrouteswitch.
- Behoud replaybare OpenAI Responses-redeneringsitempayloads, inclusief versleutelde items met lege samenvatting, zodat handmatige/WebSocket-replay de vereiste `rs_*`-status gekoppeld houdt aan assistentuitvoeritems.
- Native ChatGPT Codex Responses volgt Codex wire-pariteit door eerdere Responses-redenerings-/bericht-/functiepayloads opnieuw af te spelen zonder eerdere item-id's, terwijl sessie-`prompt_cache_key` behouden blijft.
- Geen sanering van tool call-id's.
- Herstel van koppeling van toolresultaten kan echte gematchte uitvoer verplaatsen en Codex-achtige `aborted`-uitvoer synthetiseren voor ontbrekende tool calls.
- Geen turnvalidatie of herordening.
- Ontbrekende tooluitvoer uit de OpenAI Responses-familie wordt gesynthetiseerd als `aborted` om overeen te komen met Codex-replaynormalisatie.
- Geen verwijdering van gedachtesignatures.

**OpenAI-compatibele Chat Completions**

- Historische thinking-/redeneringsblokken van de assistent worden vóór replay verwijderd, zodat
  lokale en proxy-achtige OpenAI-compatibele servers geen redeneringsvelden uit eerdere turns ontvangen,
  zoals `reasoning` of `reasoning_content`.
- Huidige same-turn-vervolgen van tool calls behouden het assistentredeneringsblok
  dat aan de tool call is gekoppeld totdat het toolresultaat opnieuw is afgespeeld.
- Provider-eigen uitzonderingen kunnen zich afmelden wanneer hun wire-protocol
  opnieuw afgespeelde redeneringsmetadata vereist.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanering van tool call-id's: strikt alfanumeriek.
- Herstel van koppeling van toolresultaten en synthetische toolresultaten.
- Turnvalidatie (Gemini-achtige turnafwisseling).
- Google-turnordeningsfixup (voeg een kleine gebruikersbootstrap vooraan toe als geschiedenis met assistent begint).
- Antigravity Claude: thinking-signatures normaliseren; niet-ondertekende thinking-blokken verwijderen.

**Anthropic / Minimax (Anthropic-compatibel)**

- Herstel van koppeling van toolresultaten en synthetische toolresultaten.
- Turnvalidatie (opeenvolgende gebruikersturns samenvoegen om aan strikte afwisseling te voldoen).
- Trailing assistentprefill-turns worden uit uitgaande Anthropic Messages-
  payloads verwijderd wanneer thinking is ingeschakeld, inclusief Cloudflare AI Gateway-routes.
- Thinking-blokken met ontbrekende, lege of blanke replaysignatures worden verwijderd
  vóór providerconversie. Als daardoor een assistentturn leeg wordt, behoudt OpenClaw
  de turnvorm met niet-lege tekst voor weggelaten redenering.
- Oudere thinking-only assistentturns die moeten worden verwijderd, worden vervangen door
  niet-lege tekst voor weggelaten redenering, zodat provideradapters de replay-
  turn niet laten vallen.

**Amazon Bedrock (Converse API)**

- Lege assistentstreamfoutturns worden vóór replay hersteld naar een niet-leeg fallbacktekstblok.
  Bedrock Converse wijst assistentberichten met `content: []` af, dus
  opgeslagen assistentturns met `stopReason: "error"` en lege inhoud worden ook
  vóór het laden op schijf hersteld.
- Assistentstreamfoutturns die alleen blanke tekstblokken bevatten, worden verwijderd
  uit de in-memory replay-kopie in plaats van een ongeldig blank blok opnieuw af te spelen.
- Claude thinking-blokken met ontbrekende, lege of blanke replaysignatures worden
  vóór Converse-replay verwijderd. Als daardoor een assistentturn leeg wordt, behoudt OpenClaw
  de turnvorm met niet-lege tekst voor weggelaten redenering.
- Oudere thinking-only assistentturns die moeten worden verwijderd, worden vervangen door
  niet-lege tekst voor weggelaten redenering, zodat Converse-replay de strikte turnvorm behoudt.
- Replay filtert delivery-mirror- en gateway-geïnjecteerde assistentturns van OpenClaw.
- Afbeeldingssanering wordt toegepast via de globale regel.

**Mistral (inclusief detectie op basis van model-id)**

- Sanering van tool call-id's: strict9 (alfanumeriek, lengte 9).

**OpenRouter Gemini**

- Opschonen van gedachtesignatures: verwijder niet-base64 `thought_signature`-waarden (behoud base64).

**OpenRouter Anthropic**

- Trailing assistentprefill-turns worden verwijderd uit geverifieerde OpenRouter
  OpenAI-compatibele Anthropic-modelpayloads wanneer redenering is ingeschakeld, overeenkomstig
  direct Anthropic- en Cloudflare Anthropic-replaygedrag.

**Al het andere**

- Alleen afbeeldingssanering.

---

## Historisch gedrag (vóór 2026.1.22)

Vóór de release 2026.1.22 paste OpenClaw meerdere lagen transcriptiehygiëne toe:

- Een **transcript-sanitize Plugin** draaide bij elke contextbuild en kon:
  - Koppeling van toolgebruik/resultaten herstellen.
  - Tool call-id's saneren (inclusief een niet-strikte modus die `_`/`-` behield).
- De runner voerde ook providerspecifieke sanering uit, wat werk dupliceerde.
- Aanvullende mutaties vonden plaats buiten het providerbeleid, waaronder:
  - `<final>`-tags uit assistenttekst verwijderen vóór opslag.
  - Lege assistentfoutturns verwijderen.
  - Assistentinhoud na tool calls inkorten.

Deze complexiteit veroorzaakte regressies tussen providers (met name `openai-responses`
`call_id|fc_id`-koppeling). De opschoning in 2026.1.22 verwijderde de Plugin, centraliseerde
logica in de runner en maakte OpenAI **no-touch** behalve afbeeldingssanering.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
