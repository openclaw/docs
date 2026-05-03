---
read_when:
    - Je debugt afwijzingen van providerverzoeken die verband houden met de transcriptvorm
    - Je wijzigt de opschoning van transcripties of de herstellogica voor toolaanroepen
    - Je onderzoekt niet-overeenkomende toolaanroep-ID's tussen providers
summary: 'Referentie: aanbiederspecifieke regels voor het opschonen en herstellen van transcripties'
title: Transcripthygiëne
x-i18n:
    generated_at: "2026-05-03T11:17:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw past **providerspecifieke fixes** toe op transcripts vóór een uitvoering (bij het opbouwen van modelcontext). De meeste hiervan zijn aanpassingen **in het geheugen** die worden gebruikt om aan strikte providervereisten te voldoen. Een afzonderlijke reparatiepass voor sessiebestanden kan opgeslagen JSONL ook herschrijven voordat de sessie wordt geladen, maar alleen voor misvormde regels of gepersisteerde beurten die geen geldige duurzame records zijn. Afgeleverde assistentantwoorden blijven op schijf behouden; providerspecifiek strippen van assistent-prefill gebeurt alleen tijdens het samenstellen van uitgaande payloads. Wanneer een reparatie plaatsvindt, wordt van het oorspronkelijke bestand een back-up naast het sessiebestand gemaakt.

Scope omvat:

- Runtime-only promptcontext blijft buiten voor gebruikers zichtbare transcriptbeurten
- Opschonen van toolaanroep-id's
- Validatie van toolaanroepinvoer
- Reparatie van toolresultaatkoppelingen
- Validatie / ordening van beurten
- Opschonen van gedachtehandtekeningen
- Opschonen van denkhandtekeningen
- Opschonen van afbeeldingspayloads
- Opschonen van lege tekstblokken vóór provider-replay
- Tagging van herkomst van gebruikersinvoer (voor tussen sessies gerouteerde prompts)
- Reparatie van lege assistentfoutbeurten voor Bedrock Converse-replay

Als je details over transcriptopslag nodig hebt, zie:

- [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction)

---

## Globale regel: runtimecontext is geen gebruikerstranscript

Runtime-/systeemcontext kan voor een beurt aan de modelprompt worden toegevoegd, maar het is
geen door de eindgebruiker geschreven inhoud. OpenClaw houdt een afzonderlijke transcriptgerichte
promptbody bij voor Gateway-antwoorden, follow-ups in de wachtrij, ACP, CLI en ingebedde Pi-
uitvoeringen. Opgeslagen zichtbare gebruikersbeurten gebruiken die transcriptbody in plaats van de
met runtime verrijkte prompt.

Voor verouderde sessies waarin runtime-wrappers al zijn gepersisteerd, passen Gateway-geschiedenis-
oppervlakken een weergaveprojectie toe voordat berichten worden teruggegeven aan WebChat,
TUI-, REST- of SSE-clients.

---

## Waar dit draait

Alle transcripthygiëne is gecentraliseerd in de ingebedde runner:

- Beleidsselectie: `src/agents/transcript-policy.ts`
- Toepassing van opschoning/reparatie: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Het beleid gebruikt `provider`, `modelApi` en `modelId` om te bepalen wat moet worden toegepast.

Los van transcripthygiëne worden sessiebestanden vóór het laden gerepareerd (indien nodig):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aangeroepen vanuit `run/attempt.ts` en `compact.ts` (ingebedde runner)

---

## Globale regel: afbeeldingsopschoning

Afbeeldingspayloads worden altijd opgeschoond om afwijzing aan providerzijde door grootte-
limieten te voorkomen (te grote base64-afbeeldingen verkleinen/opnieuw comprimeren).

Dit helpt ook om door afbeeldingen veroorzaakte tokendruk te beheersen voor modellen met vision-
mogelijkheden. Lagere maximale afmetingen verlagen doorgaans het tokengebruik; hogere afmetingen behouden details.

Implementatie:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Maximale afbeeldingszijde is configureerbaar via `agents.defaults.imageMaxDimensionPx` (standaard: `1200`).
- Lege tekstblokken worden verwijderd terwijl deze pass replay-inhoud doorloopt. Assistent-
  beurten die leeg worden, worden uit de replay-kopie verwijderd; gebruikers- en toolresultaat-
  beurten die leeg worden, krijgen een niet-lege placeholder voor weggelaten inhoud.

---

## Globale regel: misvormde toolaanroepen

Assistent-toolaanroepblokken waarbij zowel `input` als `arguments` ontbreken, worden verwijderd
voordat modelcontext wordt opgebouwd. Dit voorkomt providerafwijzingen door gedeeltelijk
gepersisteerde toolaanroepen (bijvoorbeeld na een rate-limitfout).

Implementatie:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Toegepast in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale regel: herkomst van invoer tussen sessies

Wanneer een agent via `sessions_send` een prompt naar een andere sessie stuurt (inclusief
agent-naar-agent antwoord-/aankondigingsstappen), persisteert OpenClaw de aangemaakte gebruikersbeurt met:

- `message.provenance.kind = "inter_session"`

OpenClaw voegt ook een marker `[Inter-session message ... isUser=false]` in dezelfde beurt toe
vóór de gerouteerde prompttekst, zodat de actieve modelaanroep uitvoer uit een vreemde sessie kan
onderscheiden van externe eindgebruikersinstructies. Deze marker bevat de bronsessie, het kanaal
en de tool wanneer beschikbaar. Het transcript gebruikt nog steeds `role: "user"` voor
providercompatibiliteit, maar zowel de zichtbare tekst als de herkomstmetadata markeren de beurt
als gegevens tussen sessies.

Tijdens het opnieuw opbouwen van context past OpenClaw dezelfde marker toe op oudere gepersisteerde
gebruikersbeurten tussen sessies die alleen herkomstmetadata hebben.

---

## Providermatrix (huidig gedrag)

**OpenAI / OpenAI Codex**

- Alleen afbeeldingsopschoning.
- Verwijder verweesde reasoning-handtekeningen (losstaande reasoning-items zonder volgend inhoudsblok) voor OpenAI Responses-/Codex-transcripts, en verwijder opnieuw afspeelbare OpenAI-reasoning na een modelrouteswitch.
- Behoud payloads van opnieuw afspeelbare OpenAI Responses-reasoningitems, inclusief versleutelde items met lege samenvatting, zodat handmatige/WebSocket-replay vereiste `rs_*`-status gekoppeld houdt aan assistentuitvoeritems.
- Geen opschoning van toolaanroep-id's.
- Reparatie van toolresultaatkoppelingen kan echte overeenkomende outputs verplaatsen en Codex-stijl `aborted`-outputs synthetiseren voor ontbrekende toolaanroepen.
- Geen validatie of herordening van beurten.
- Ontbrekende tooloutputs uit de OpenAI Responses-familie worden gesynthetiseerd als `aborted` om overeen te komen met Codex-replaynormalisatie.
- Geen stripping van gedachtehandtekeningen.

**OpenAI-compatibele Gemma 4**

- Historische assistent-denk-/reasoningblokken worden vóór replay gestript, zodat lokale
  OpenAI-compatibele Gemma 4-servers geen reasoninginhoud uit eerdere beurten ontvangen.
- Huidige toolaanroepvoortzettingen binnen dezelfde beurt houden het assistent-reasoningblok
  gekoppeld aan de toolaanroep totdat het toolresultaat opnieuw is afgespeeld.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Opschoning van toolaanroep-id's: strikt alfanumeriek.
- Reparatie van toolresultaatkoppelingen en synthetische toolresultaten.
- Beurtvalidatie (Gemini-stijl beurtwisseling).
- Google-beurtordeningsfixup (voegt een kleine gebruikersbootstrap vooraan toe als geschiedenis met een assistent begint).
- Antigravity Claude: normaliseer denkhandtekeningen; verwijder niet-ondertekende denkblokken.

**Anthropic / Minimax (Anthropic-compatibel)**

- Reparatie van toolresultaatkoppelingen en synthetische toolresultaten.
- Beurtvalidatie (voeg opeenvolgende gebruikersbeurten samen om aan strikte afwisseling te voldoen).
- Naloopbeurten met assistent-prefill worden uit uitgaande Anthropic Messages-
  payloads gestript wanneer denken is ingeschakeld, inclusief Cloudflare AI Gateway-routes.
- Denkblokken met ontbrekende, lege of blanco replay-handtekeningen worden vóór providerconversie gestript. Als daardoor een assistentbeurt leeg wordt, behoudt OpenClaw
  de beurtvorm met niet-lege tekst voor weggelaten reasoning.
- Oudere assistentbeurten met alleen denken die moeten worden gestript, worden vervangen door
  niet-lege tekst voor weggelaten reasoning, zodat provideradapters de replay-
  beurt niet verwijderen.

**Amazon Bedrock (Converse API)**

- Lege assistentstreamfoutbeurten worden vóór replay gerepareerd naar een niet-leeg fallbacktekstblok.
  Bedrock Converse wijst assistentberichten met `content: []` af, dus gepersisteerde
  assistentbeurten met `stopReason: "error"` en lege inhoud worden ook vóór het laden op schijf
  gerepareerd.
- Assistentstreamfoutbeurten die alleen lege tekstblokken bevatten, worden verwijderd
  uit de in-memory replay-kopie in plaats van een ongeldig leeg blok opnieuw af te spelen.
- Claude-denkblokken met ontbrekende, lege of blanco replay-handtekeningen worden
  vóór Converse-replay gestript. Als daardoor een assistentbeurt leeg wordt, behoudt OpenClaw
  de beurtvorm met niet-lege tekst voor weggelaten reasoning.
- Oudere assistentbeurten met alleen denken die moeten worden gestript, worden vervangen door
  niet-lege tekst voor weggelaten reasoning, zodat de Converse-replay de strikte beurtvorm behoudt.
- Replay filtert OpenClaw-delivery-mirror- en door Gateway geïnjecteerde assistentbeurten.
- Afbeeldingsopschoning wordt toegepast via de globale regel.

**Mistral (inclusief detectie op basis van model-id)**

- Opschoning van toolaanroep-id's: strict9 (alfanumerieke lengte 9).

**OpenRouter Gemini**

- Opschonen van gedachtehandtekeningen: strip niet-base64 `thought_signature`-waarden (behoud base64).

**OpenRouter Anthropic**

- Naloopbeurten met assistent-prefill worden uit geverifieerde OpenRouter
  OpenAI-compatibele Anthropic-modelpayloads gestript wanneer reasoning is ingeschakeld, in lijn met
  direct Anthropic- en Cloudflare Anthropic-replaygedrag.

**Al het overige**

- Alleen afbeeldingsopschoning.

---

## Historisch gedrag (vóór 2026.1.22)

Vóór de release 2026.1.22 paste OpenClaw meerdere lagen transcripthygiëne toe:

- Een **transcript-sanitize Plugin** draaide bij elke contextopbouw en kon:
  - Toolgebruik-/resultaatkoppelingen repareren.
  - Toolaanroep-id's opschonen (inclusief een niet-strikte modus die `_`/`-` behield).
- De runner voerde ook providerspecifieke opschoning uit, wat werk dupliceerde.
- Aanvullende mutaties vonden plaats buiten het providerbeleid, waaronder:
  - `<final>`-tags strippen uit assistenttekst vóór persistentie.
  - Lege assistentfoutbeurten verwijderen.
  - Assistentinhoud na toolaanroepen inkorten.

Deze complexiteit veroorzaakte regressies tussen providers (met name `openai-responses`
`call_id|fc_id`-koppeling). De opschoning in 2026.1.22 verwijderde de Plugin, centraliseerde
logica in de runner en maakte OpenAI **no-touch** behalve afbeeldingsopschoning.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
