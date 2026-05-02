---
read_when:
    - Je debugt afwijzingen van providerverzoeken die verband houden met de structuur van het transcript
    - Je wijzigt de transcriptopschoning of reparatielogica voor tool-calls
    - Je onderzoekt verschillen in tool-call-id's tussen aanbieders
summary: 'Referentie: providerspecifieke regels voor transcriptopschoning en -herstel'
title: Transcripthygiëne
x-i18n:
    generated_at: "2026-05-02T11:27:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw past **providerspecifieke reparaties** toe op transcripten vóór een run (bij het opbouwen van modelcontext). De meeste hiervan zijn **in-memory** aanpassingen die worden gebruikt om aan strikte providervereisten te voldoen. Een aparte reparatiepass voor sessiebestanden kan opgeslagen JSONL ook herschrijven voordat de sessie wordt geladen, door misvormde JSONL-regels te verwijderen of door gepersisteerde turns te repareren die syntactisch geldig zijn maar waarvan bekend is dat ze tijdens replay door een
provider worden geweigerd. Wanneer een reparatie plaatsvindt, wordt er naast
het sessiebestand een back-up van het oorspronkelijke bestand gemaakt.

Scope omvat:

- Runtime-only promptcontext blijft buiten voor gebruikers zichtbare transcript-turns
- Sanitization van tool call-id’s
- Validatie van tool call-invoer
- Reparatie van toolresultaat-koppeling
- Turn-validatie / ordening
- Opschoning van denksignaturen
- Opschoning van thinking-signaturen
- Sanitization van image-payloads
- Opschoning van lege tekstblokken vóór provider-replay
- Herkomsttagging van gebruikersinvoer (voor tussen sessies gerouteerde prompts)
- Reparatie van lege assistant-error-turns voor Bedrock Converse-replay

Als je details over transcriptopslag nodig hebt, zie:

- [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction)

---

## Globale regel: runtimecontext is geen gebruikerstranscript

Runtime-/systeemcontext kan worden toegevoegd aan de modelprompt voor een turn, maar het is
geen content die door de eindgebruiker is geschreven. OpenClaw houdt een aparte transcriptgerichte
promptbody bij voor Gateway-antwoorden, opvolgberichten in de wachtrij, ACP, CLI en embedded Pi-
runs. Opgeslagen zichtbare user-turns gebruiken die transcriptbody in plaats van de
runtime-verrijkte prompt.

Voor legacy-sessies waarin runtime-wrappers al waren gepersisteerd, passen Gateway-history-
surfaces een weergaveprojectie toe voordat berichten worden teruggegeven aan WebChat-,
TUI-, REST- of SSE-clients.

---

## Waar dit draait

Alle transcript-hygiëne is gecentraliseerd in de embedded runner:

- Beleidsselectie: `src/agents/transcript-policy.ts`
- Toepassing van sanitization/reparatie: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Het beleid gebruikt `provider`, `modelApi` en `modelId` om te bepalen wat moet worden toegepast.

Los van transcript-hygiëne worden sessiebestanden vóór het laden gerepareerd (indien nodig):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aangeroepen vanuit `run/attempt.ts` en `compact.ts` (embedded runner)

---

## Globale regel: image-sanitization

Image-payloads worden altijd gesaneerd om provider-side weigering door grootte-
limieten te voorkomen (te grote base64-images downscalen/opnieuw comprimeren).

Dit helpt ook om tokenbelasting door images te beheersen voor modellen met vision-mogelijkheden.
Lagere maximale dimensies verminderen doorgaans tokengebruik; hogere dimensies behouden detail.

Implementatie:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- De maximale image-zijde is configureerbaar via `agents.defaults.imageMaxDimensionPx` (standaard: `1200`).
- Lege tekstblokken worden verwijderd terwijl deze pass door replay-content loopt. Assistant-
  turns die daardoor leeg worden, worden uit de replay-kopie verwijderd; user- en tool-result-
  turns die leeg worden, krijgen een niet-lege placeholder voor weggelaten content.

---

## Globale regel: misvormde tool calls

Assistant-tool-call-blokken die zowel `input` als `arguments` missen, worden verwijderd
voordat modelcontext wordt opgebouwd. Dit voorkomt providerweigeringen door gedeeltelijk
gepersisteerde tool calls (bijvoorbeeld na een rate-limit-fout).

Implementatie:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Toegepast in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale regel: herkomst van invoer tussen sessies

Wanneer een agent via `sessions_send` een prompt naar een andere sessie stuurt (inclusief
agent-naar-agent-reply-/announce-stappen), persisteert OpenClaw de aangemaakte user-turn met:

- `message.provenance.kind = "inter_session"`

OpenClaw voegt ook een marker in dezelfde turn toe vóór de gerouteerde prompttekst:
`[Inter-session message ... isUser=false]`, zodat de actieve modelaanroep output van een
vreemde sessie kan onderscheiden van externe eindgebruikersinstructies. Deze marker bevat
de bronsessie, het kanaal en de tool wanneer beschikbaar. Het transcript gebruikt nog steeds
`role: "user"` voor providercompatibiliteit, maar zowel de zichtbare tekst als de provenance-
metadata markeren de turn als data tussen sessies.

Tijdens het opnieuw opbouwen van context past OpenClaw dezelfde marker toe op oudere gepersisteerde
inter-session user-turns die alleen provenance-metadata hebben.

---

## Providermatrix (huidig gedrag)

**OpenAI / OpenAI Codex**

- Alleen image-sanitization.
- Verwijder verweesde reasoning-signaturen (losstaande reasoning-items zonder volgend contentblok) voor OpenAI Responses-/Codex-transcripten, en verwijder replaybare OpenAI-reasoning na een modelrouteswitch.
- Behoud replaybare OpenAI Responses-reasoning-item-payloads, inclusief versleutelde items met lege samenvatting, zodat handmatige/WebSocket-replay vereiste `rs_*`-state gekoppeld houdt aan assistant-outputitems.
- Geen sanitization van tool call-id’s.
- Reparatie van toolresultaat-koppeling kan echte overeenkomende outputs verplaatsen en Codex-stijl `aborted`-outputs synthetiseren voor ontbrekende tool calls.
- Geen turn-validatie of herordening.
- Ontbrekende tooloutputs uit de OpenAI Responses-familie worden gesynthetiseerd als `aborted` om overeen te komen met Codex-replaynormalisatie.
- Geen verwijdering van denksignaturen.

**OpenAI-compatible Gemma 4**

- Historische assistant-thinking-/reasoning-blokken worden vóór replay verwijderd zodat lokale
  OpenAI-compatible Gemma 4-servers geen reasoning-content uit eerdere turns ontvangen.
- Huidige tool-call-continuations binnen dezelfde turn behouden het assistant-reasoning-blok
  gekoppeld aan de tool call totdat het toolresultaat is gereplayed.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitization van tool call-id’s: strikt alfanumeriek.
- Reparatie van toolresultaat-koppeling en synthetische toolresultaten.
- Turn-validatie (Gemini-stijl turn-afwisseling).
- Google-turnordeningsfixup (voeg een kleine user-bootstrap vooraf toe als history met assistant begint).
- Antigravity Claude: normaliseer thinking-signaturen; verwijder niet-ondertekende thinking-blokken.

**Anthropic / Minimax (Anthropic-compatible)**

- Reparatie van toolresultaat-koppeling en synthetische toolresultaten.
- Turn-validatie (voeg opeenvolgende user-turns samen om aan strikte afwisseling te voldoen).
- Afsluitende assistant-prefill-turns worden verwijderd uit uitgaande Anthropic Messages-
  payloads wanneer thinking is ingeschakeld, inclusief Cloudflare AI Gateway-routes.
- Thinking-blokken met ontbrekende, lege of blanke replay-signaturen worden verwijderd
  vóór providerconversie. Als daardoor een assistant-turn leeg wordt, behoudt OpenClaw
  de turn-vorm met niet-lege tekst voor weggelaten reasoning.
- Oudere assistant-turns met alleen thinking die moeten worden verwijderd, worden vervangen door
  niet-lege tekst voor weggelaten reasoning, zodat provideradapters de replay-
  turn niet verwijderen.

**Amazon Bedrock (Converse API)**

- Lege assistant-stream-error-turns worden gerepareerd naar een niet-leeg fallback-tekstblok
  vóór replay. Bedrock Converse weigert assistant-berichten met `content: []`, dus
  gepersisteerde assistant-turns met `stopReason: "error"` en lege content worden ook
  vóór het laden op disk gerepareerd.
- Assistant-stream-error-turns die alleen lege tekstblokken bevatten, worden verwijderd
  uit de in-memory replay-kopie in plaats van een ongeldig leeg blok te replayen.
- Claude-thinking-blokken met ontbrekende, lege of blanke replay-signaturen worden
  verwijderd vóór Converse-replay. Als daardoor een assistant-turn leeg wordt, behoudt OpenClaw
  de turn-vorm met niet-lege tekst voor weggelaten reasoning.
- Oudere assistant-turns met alleen thinking die moeten worden verwijderd, worden vervangen door
  niet-lege tekst voor weggelaten reasoning zodat de Converse-replay een strikte turn-vorm behoudt.
- Replay filtert OpenClaw delivery-mirror- en gateway-geïnjecteerde assistant-turns.
- Image-sanitization wordt toegepast via de globale regel.

**Mistral (inclusief detectie op basis van model-id)**

- Sanitization van tool call-id’s: strict9 (alfanumerieke lengte 9).

**OpenRouter Gemini**

- Opschoning van denksignaturen: verwijder niet-base64 `thought_signature`-waarden (behoud base64).

**OpenRouter Anthropic**

- Afsluitende assistant-prefill-turns worden verwijderd uit geverifieerde OpenRouter
  OpenAI-compatible Anthropic-modelpayloads wanneer reasoning is ingeschakeld, overeenkomstig
  direct Anthropic- en Cloudflare Anthropic-replaygedrag.

**Al het overige**

- Alleen image-sanitization.

---

## Historisch gedrag (vóór 2026.1.22)

Vóór de release 2026.1.22 paste OpenClaw meerdere lagen transcript-hygiëne toe:

- Een **transcript-sanitize-extensie** draaide bij elke contextopbouw en kon:
  - Tool use/result-koppeling repareren.
  - Tool call-id’s saneren (inclusief een niet-strikte modus die `_`/`-` behield).
- De runner voerde ook providerspecifieke sanitization uit, waardoor werk werd gedupliceerd.
- Aanvullende mutaties vonden plaats buiten het providerbeleid, waaronder:
  - `<final>`-tags uit assistant-tekst verwijderen vóór persistence.
  - Lege assistant-error-turns verwijderen.
  - Assistant-content na tool calls inkorten.

Deze complexiteit veroorzaakte cross-provider regressies (met name `openai-responses`
`call_id|fc_id`-koppeling). De opschoning in 2026.1.22 verwijderde de extensie, centraliseerde
logica in de runner en maakte OpenAI **no-touch** buiten image-sanitization.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Session pruning](/nl/concepts/session-pruning)
