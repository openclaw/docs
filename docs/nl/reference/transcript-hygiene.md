---
read_when:
    - Je debugt afwijzingen van providerverzoeken die samenhangen met de transcriptstructuur
    - Je wijzigt de opschoning van transcripties of de reparatielogica voor toolaanroepen
    - Je onderzoekt niet-overeenkomende toolaanroep-id's tussen aanbieders
summary: 'Referentie: providerspecifieke regels voor opschoning en herstel van transcripties'
title: Transcripthygiëne
x-i18n:
    generated_at: "2026-05-05T01:50:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw past **provider-specifieke fixes** toe op transcripties vóór een run (bij het opbouwen van modelcontext). De meeste hiervan zijn **in-memory** aanpassingen die worden gebruikt om aan strikte providervereisten te voldoen. Een aparte reparatiepas voor sessiebestanden kan opgeslagen JSONL ook herschrijven voordat de sessie wordt geladen, maar alleen voor misvormde regels of gepersisteerde beurten die geen geldige duurzame records zijn. Afgeleverde assistentantwoorden blijven op schijf behouden; provider-specifieke verwijdering van assistent-prefill gebeurt alleen tijdens het samenstellen van uitgaande payloads. Wanneer een reparatie plaatsvindt, wordt er naast het sessiebestand een back-up van het oorspronkelijke bestand gemaakt.

Scope omvat:

- Runtime-only promptcontext die buiten gebruikerszichtbare transcriptiebeurten blijft
- Opschoning van tool call-id's
- Validatie van tool call-invoer
- Reparatie van koppeling met toolresultaten
- Beurtvalidatie / volgorde
- Opschoning van thought signatures
- Opschoning van thinking signatures
- Opschoning van image-payloads
- Opschoning van lege tekstblokken vóór provider-replay
- Herkomsttagging van gebruikersinvoer (voor tussen sessies gerouteerde prompts)
- Reparatie van lege assistentfoutbeurten voor Bedrock Converse-replay

Als je details over transcriptieopslag nodig hebt, zie:

- [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction)

---

## Globale regel: runtimecontext is geen gebruikerstranscriptie

Runtime-/systeemcontext kan voor een beurt aan de modelprompt worden toegevoegd, maar is
geen door de eindgebruiker geschreven inhoud. OpenClaw houdt een aparte
transcriptiegerichte promptbody bij voor Gateway-antwoorden, opvolgitems in de wachtrij, ACP, CLI en embedded Pi-runs. Opgeslagen zichtbare gebruikersbeurten gebruiken die transcriptiebody in plaats van de
met runtime verrijkte prompt.

Voor verouderde sessies die al runtime-wrappers hebben gepersisteerd, passen Gateway-geschiedenisoppervlakken
een weergaveprojectie toe voordat berichten worden teruggegeven aan WebChat-,
TUI-, REST- of SSE-clients.

---

## Waar dit draait

Alle transcriptiehygiëne is gecentraliseerd in de embedded runner:

- Beleidsselectie: `src/agents/transcript-policy.ts`
- Toepassing van opschoning/reparatie: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Het beleid gebruikt `provider`, `modelApi` en `modelId` om te bepalen wat wordt toegepast.

Los van transcriptiehygiëne worden sessiebestanden vóór het laden gerepareerd (indien nodig):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aangeroepen vanuit `run/attempt.ts` en `compact.ts` (embedded runner)

---

## Globale regel: image-opschoning

Image-payloads worden altijd opgeschoond om provider-side weigering door groottebeperkingen
te voorkomen (te grote base64-afbeeldingen verkleinen/opnieuw comprimeren).

Dit helpt ook de door afbeeldingen veroorzaakte tokendruk te beheersen voor modellen met vision-mogelijkheden.
Lagere maximumafmetingen verminderen doorgaans het tokengebruik; hogere afmetingen behouden details.

Implementatie:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- De maximale image-zijde is configureerbaar via `agents.defaults.imageMaxDimensionPx` (standaard: `1200`).
- Lege tekstblokken worden verwijderd terwijl deze pas replay-inhoud doorloopt. Assistentbeurten
  die leeg worden, worden uit de replay-kopie verwijderd; gebruikers- en toolresultaatbeurten
  die leeg worden, krijgen een niet-lege placeholder voor weggelaten inhoud.

---

## Globale regel: misvormde tool calls

Assistentblokken voor tool calls waarbij zowel `input` als `arguments` ontbreken, worden verwijderd
voordat modelcontext wordt opgebouwd. Dit voorkomt provider-weigeringen door gedeeltelijk
gepersisteerde tool calls (bijvoorbeeld na een rate-limit-fout).

Implementatie:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Toegepast in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale regel: herkomst van invoer tussen sessies

Wanneer een agent via `sessions_send` een prompt naar een andere sessie stuurt (inclusief
agent-naar-agent antwoord-/aankondigingsstappen), persisteert OpenClaw de aangemaakte gebruikersbeurt met:

- `message.provenance.kind = "inter_session"`

OpenClaw voegt ook een same-turn marker `[Inter-session message ... isUser=false]`
toe vóór de gerouteerde prompttekst, zodat de actieve modelaanroep buitenlandse
sessie-uitvoer kan onderscheiden van externe eindgebruikersinstructies. Deze marker bevat
de bronsessie, het kanaal en de tool wanneer beschikbaar. De transcriptie gebruikt nog steeds
`role: "user"` voor providercompatibiliteit, maar zowel de zichtbare tekst als de herkomstmetadata
markeren de beurt als gegevens tussen sessies.

Tijdens contextherbouw past OpenClaw dezelfde marker toe op oudere gepersisteerde
gebruikersbeurten tussen sessies die alleen herkomstmetadata hebben.

---

## Providermatrix (huidig gedrag)

**OpenAI / OpenAI Codex**

- Alleen image-opschoning.
- Verwijder verweesde reasoning signatures (zelfstandige reasoning-items zonder een volgend inhoudsblok) voor OpenAI Responses-/Codex-transcripties, en verwijder replaybare OpenAI-reasoning na een modelrouteschakeling.
- Behoud replaybare OpenAI Responses-payloads van reasoning-items, inclusief versleutelde items met lege samenvatting, zodat handmatige/WebSocket-replay de vereiste `rs_*`-status gekoppeld houdt aan assistentuitvoeritems.
- Native ChatGPT Codex Responses volgt Codex-wirepariteit door eerdere Responses-reasoning-/bericht-/functiepayloads opnieuw af te spelen zonder eerdere item-ID's, terwijl sessie-`prompt_cache_key` behouden blijft.
- Geen opschoning van tool call-id's.
- Reparatie van koppeling met toolresultaten kan echte gematchte uitvoer verplaatsen en Codex-stijl `aborted`-uitvoer synthetiseren voor ontbrekende tool calls.
- Geen beurtvalidatie of herordening.
- Ontbrekende tooluitvoer uit de OpenAI Responses-familie wordt gesynthetiseerd als `aborted` om overeen te komen met Codex-replaynormalisatie.
- Geen verwijdering van thought signatures.

**OpenAI-compatibele Gemma 4**

- Historische assistentblokken voor thinking/reasoning worden vóór replay verwijderd, zodat lokale
  OpenAI-compatibele Gemma 4-servers geen reasoning-inhoud van eerdere beurten ontvangen.
- Huidige tool-call-vervolgen binnen dezelfde beurt behouden het assistent-reasoningblok
  gekoppeld aan de tool call totdat het toolresultaat opnieuw is afgespeeld.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Opschoning van tool call-id's: strikt alfanumeriek.
- Reparatie van koppeling met toolresultaten en synthetische toolresultaten.
- Beurtvalidatie (Gemini-stijl beurtafwisseling).
- Google-fixup voor beurtvolgorde (voeg een kleine gebruikersbootstrap toe als de geschiedenis met de assistent begint).
- Antigravity Claude: thinking signatures normaliseren; unsigned thinking-blokken verwijderen.

**Anthropic / Minimax (Anthropic-compatibel)**

- Reparatie van koppeling met toolresultaten en synthetische toolresultaten.
- Beurtvalidatie (opeenvolgende gebruikersbeurten samenvoegen om aan strikte afwisseling te voldoen).
- Afsluitende assistent-prefillbeurten worden verwijderd uit uitgaande Anthropic Messages-
  payloads wanneer thinking is ingeschakeld, inclusief Cloudflare AI Gateway-routes.
- Thinking-blokken met ontbrekende, lege of blanco replay signatures worden verwijderd
  vóór providerconversie. Als daardoor een assistentbeurt leeg wordt, behoudt OpenClaw
  de beurtvorm met niet-lege tekst voor weggelaten reasoning.
- Oudere assistentbeurten met alleen thinking die moeten worden verwijderd, worden vervangen door
  niet-lege tekst voor weggelaten reasoning, zodat provideradapters de replaybeurt
  niet laten vallen.

**Amazon Bedrock (Converse API)**

- Lege assistentbeurten voor streamfouten worden gerepareerd naar een niet-leeg fallback-tekstblok
  vóór replay. Bedrock Converse weigert assistentberichten met `content: []`, dus
  gepersisteerde assistentbeurten met `stopReason: "error"` en lege inhoud worden ook
  vóór het laden op schijf gerepareerd.
- Assistentbeurten voor streamfouten die alleen blanco tekstblokken bevatten, worden verwijderd
  uit de in-memory replay-kopie in plaats van een ongeldig blanco blok opnieuw af te spelen.
- Claude thinking-blokken met ontbrekende, lege of blanco replay signatures worden
  verwijderd vóór Converse-replay. Als daardoor een assistentbeurt leeg wordt, behoudt OpenClaw
  de beurtvorm met niet-lege tekst voor weggelaten reasoning.
- Oudere assistentbeurten met alleen thinking die moeten worden verwijderd, worden vervangen door
  niet-lege tekst voor weggelaten reasoning, zodat de Converse-replay de strikte beurtvorm behoudt.
- Replay filtert OpenClaw delivery-mirror- en door Gateway geïnjecteerde assistentbeurten.
- Image-opschoning wordt toegepast via de globale regel.

**Mistral (inclusief detectie op basis van model-id)**

- Opschoning van tool call-id's: strict9 (alfanumeriek lengte 9).

**OpenRouter Gemini**

- Opschoning van thought signatures: verwijder niet-base64 `thought_signature`-waarden (behoud base64).

**OpenRouter Anthropic**

- Afsluitende assistent-prefillbeurten worden verwijderd uit geverifieerde OpenRouter
  OpenAI-compatibele Anthropic-modelpayloads wanneer reasoning is ingeschakeld, in overeenstemming met
  direct Anthropic- en Cloudflare Anthropic-replaygedrag.

**Al het andere**

- Alleen image-opschoning.

---

## Historisch gedrag (vóór 2026.1.22)

Vóór de release 2026.1.22 paste OpenClaw meerdere lagen transcriptiehygiëne toe:

- Een **transcript-sanitize-extensie** draaide bij elke contextopbouw en kon:
  - Koppeling tussen toolgebruik en resultaat repareren.
  - Tool call-id's opschonen (inclusief een niet-strikte modus die `_`/`-` behield).
- De runner voerde ook provider-specifieke opschoning uit, wat werk dupliceerde.
- Er vonden extra mutaties plaats buiten het providerbeleid, waaronder:
  - `<final>`-tags verwijderen uit assistenttekst vóór persistentie.
  - Lege assistentfoutbeurten verwijderen.
  - Assistentinhoud na tool calls inkorten.

Deze complexiteit veroorzaakte regressies tussen providers (met name `openai-responses`
`call_id|fc_id`-koppeling). De opschoning in 2026.1.22 verwijderde de extensie, centraliseerde
logica in de runner en maakte OpenAI **ongemoeid** buiten image-opschoning.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
