---
read_when:
    - Je debugt afwijzingen van providerverzoeken die samenhangen met de transcriptstructuur
    - Je wijzigt de transcriptopschoning of de reparatielogica voor tool-calls
    - Je onderzoekt niet-overeenkomende toolaanroep-ID's tussen aanbieders
summary: 'Referentie: providerspecifieke regels voor opschoning en herstel van transcripties'
title: Transcript-hygiëne
x-i18n:
    generated_at: "2026-04-29T23:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw past **provider-specifieke fixes** toe op transcripten vóór een run (bij het bouwen van modelcontext). De meeste hiervan zijn **in-memory** aanpassingen die worden gebruikt om aan strikte providereisen te voldoen. Een aparte reparatiepassage voor sessiebestanden kan ook opgeslagen JSONL herschrijven voordat de sessie wordt geladen, door misvormde JSONL-regels te verwijderen of door gepersisteerde turns te repareren die syntactisch geldig zijn maar waarvan bekend is dat ze tijdens replay door een
provider worden geweigerd. Wanneer een reparatie plaatsvindt, wordt het oorspronkelijke bestand naast
het sessiebestand geback-upt.

Scope omvat:

- Runtime-only promptcontext blijft buiten transcriptturns die zichtbaar zijn voor gebruikers
- Sanitization van tool-call-id's
- Validatie van tool-call-invoer
- Reparatie van tool-resultaatkoppeling
- Turnvalidatie / -ordening
- Opschoning van denksignatures
- Opschoning van thinking-signatures
- Sanitization van afbeeldingspayloads
- Opschoning van lege tekstblokken vóór providerreplay
- Tagging van herkomst van gebruikersinvoer (voor intersessie-geroute prompts)
- Reparatie van lege assistent-error-turns voor Bedrock Converse-replay

Als je details over transcriptopslag nodig hebt, zie:

- [Diepgaande sessiebeheeruitleg](/nl/reference/session-management-compaction)

---

## Globale regel: runtimecontext is geen gebruikerstranscript

Runtime-/systeemcontext kan voor een turn aan de modelprompt worden toegevoegd, maar is
geen door de eindgebruiker geschreven content. OpenClaw bewaart een aparte, transcriptgerichte
promptbody voor Gateway-antwoorden, in de wachtrij geplaatste follow-ups, ACP, CLI en embedded Pi-
runs. Opgeslagen zichtbare gebruikersturns gebruiken die transcriptbody in plaats van de
met runtime verrijkte prompt.

Voor legacy-sessies waarin runtimewrappers al zijn gepersisteerd, passen Gateway-geschiedenisoppervlakken
een weergaveprojectie toe voordat berichten worden teruggegeven aan WebChat-,
TUI-, REST- of SSE-clients.

---

## Waar dit draait

Alle transcript-hygiëne is gecentraliseerd in de embedded runner:

- Beleidsselectie: `src/agents/transcript-policy.ts`
- Toepassing van sanitization/reparatie: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Het beleid gebruikt `provider`, `modelApi` en `modelId` om te bepalen wat moet worden toegepast.

Los van transcript-hygiëne worden sessiebestanden (indien nodig) vóór het laden gerepareerd:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aangeroepen vanuit `run/attempt.ts` en `compact.ts` (embedded runner)

---

## Globale regel: afbeeldingssanitization

Afbeeldingspayloads worden altijd gesanitized om provider-side weigering door grootte-
limieten te voorkomen (te grote base64-afbeeldingen worden verkleind/opnieuw gecomprimeerd).

Dit helpt ook om door afbeeldingen veroorzaakte tokendruk te beheersen voor vision-capable modellen.
Lagere maximale afmetingen verminderen doorgaans het tokengebruik; hogere afmetingen behouden detail.

Implementatie:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Maximale afbeeldingszijde is configureerbaar via `agents.defaults.imageMaxDimensionPx` (standaard: `1200`).
- Lege tekstblokken worden verwijderd terwijl deze pass door replay-content loopt. Assistent-
  turns die daardoor leeg worden, worden uit de replaykopie verwijderd; gebruiker- en tool-result-
  turns die leeg worden, krijgen een niet-lege placeholder voor weggelaten content.

---

## Globale regel: misvormde tool-calls

Assistent-tool-call-blokken waarin zowel `input` als `arguments` ontbreken, worden verwijderd
voordat modelcontext wordt gebouwd. Dit voorkomt providerweigeringen door gedeeltelijk
gepersisteerde tool-calls (bijvoorbeeld na een rate-limit-fout).

Implementatie:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Toegepast in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale regel: herkomst van intersessie-invoer

Wanneer een agent via `sessions_send` een prompt naar een andere sessie stuurt (inclusief
agent-naar-agent reply-/announce-stappen), persisteert OpenClaw de aangemaakte gebruikersturn met:

- `message.provenance.kind = "inter_session"`

OpenClaw voegt ook een marker `[Inter-session message ... isUser=false]`
aan dezelfde turn toe vóór de tekst van de geroute prompt, zodat de actieve modelcall
output van een externe sessie kan onderscheiden van externe eindgebruikersinstructies. Deze marker bevat
de bronsessie, het kanaal en de tool wanneer beschikbaar. Het transcript gebruikt nog steeds
`role: "user"` voor providercompatibiliteit, maar zowel de zichtbare tekst als de herkomst-
metadata markeren de turn als intersessiegegevens.

Tijdens het opnieuw opbouwen van context past OpenClaw dezelfde marker toe op oudere gepersisteerde
intersessie-gebruikersturns die alleen herkomstmetadata hebben.

---

## Providermatrix (huidig gedrag)

**OpenAI / OpenAI Codex**

- Alleen afbeeldingssanitization.
- Verwijder verweesde reasoning-signatures (zelfstandige reasoning-items zonder volgend contentblok) voor OpenAI Responses-/Codex-transcripten, en verwijder replaybare OpenAI-reasoning na een modelroutewissel.
- Behoud replaybare payloads van OpenAI Responses-reasoning-items, inclusief versleutelde items met lege samenvatting, zodat handmatige/WebSocket-replay de vereiste `rs_*`-state gekoppeld houdt aan assistentoutputitems.
- Geen sanitization van tool-call-id's.
- Reparatie van tool-resultaatkoppeling kan echte gematchte outputs verplaatsen en Codex-achtige `aborted`-outputs synthetiseren voor ontbrekende tool-calls.
- Geen turnvalidatie of herordening.
- Ontbrekende tooloutputs uit de OpenAI Responses-familie worden gesynthetiseerd als `aborted` om overeen te komen met Codex-replaynormalisatie.
- Geen stripping van denksignatures.

**OpenAI-compatibele Gemma 4**

- Historische thinking-/reasoning-blokken van de assistent worden vóór replay gestript, zodat lokale
  OpenAI-compatibele Gemma 4-servers geen reasoning-content uit eerdere turns ontvangen.
- Huidige voortzettingen van tool-calls binnen dezelfde turn behouden het reasoning-blok van de assistent
  gekoppeld aan de tool-call totdat het toolresultaat is gereplayed.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitization van tool-call-id's: strikt alfanumeriek.
- Reparatie van tool-resultaatkoppeling en synthetische toolresultaten.
- Turnvalidatie (Gemini-achtige turnafwisseling).
- Google-turnordening-fixup (voeg een kleine user-bootstrap vooraan toe als de geschiedenis met assistent begint).
- Antigravity Claude: normaliseer thinking-signatures; verwijder niet-ondertekende thinking-blokken.

**Anthropic / Minimax (Anthropic-compatibel)**

- Reparatie van tool-resultaatkoppeling en synthetische toolresultaten.
- Turnvalidatie (voeg opeenvolgende gebruikersturns samen om aan strikte afwisseling te voldoen).
- Afsluitende assistent-prefill-turns worden gestript uit uitgaande Anthropic Messages-
  payloads wanneer thinking is ingeschakeld, inclusief Cloudflare AI Gateway-routes.
- Thinking-blokken met ontbrekende, lege of blanco replay-signatures worden gestript
  vóór providerconversie. Als daardoor een assistentturn leeg wordt, behoudt OpenClaw
  de turnvorm met niet-lege tekst voor weggelaten reasoning.
- Oudere assistentturns die alleen thinking bevatten en moeten worden gestript, worden vervangen door
  niet-lege tekst voor weggelaten reasoning, zodat provideradapters de replay-
  turn niet verwijderen.

**Amazon Bedrock (Converse API)**

- Lege assistent-stream-error-turns worden vóór replay gerepareerd naar een niet-leeg fallback-tekstblok.
  Bedrock Converse weigert assistentberichten met `content: []`, dus
  gepersisteerde assistentturns met `stopReason: "error"` en lege content worden ook
  vóór het laden op schijf gerepareerd.
- Assistent-stream-error-turns die alleen blanco tekstblokken bevatten, worden
  uit de in-memory replaykopie verwijderd in plaats van een ongeldig blanco blok te replayen.
- Claude-thinking-blokken met ontbrekende, lege of blanco replay-signatures worden
  gestript vóór Converse-replay. Als daardoor een assistentturn leeg wordt, behoudt OpenClaw
  de turnvorm met niet-lege tekst voor weggelaten reasoning.
- Oudere assistentturns die alleen thinking bevatten en moeten worden gestript, worden vervangen door
  niet-lege tekst voor weggelaten reasoning, zodat de Converse-replay de strikte turnvorm behoudt.
- Replay filtert OpenClaw delivery-mirror- en gateway-geïnjecteerde assistentturns.
- Afbeeldingssanitization is van toepassing via de globale regel.

**Mistral (inclusief detectie op basis van model-id)**

- Sanitization van tool-call-id's: strict9 (alfanumeriek, lengte 9).

**OpenRouter Gemini**

- Opschoning van denksignatures: strip niet-base64 `thought_signature`-waarden (behoud base64).

**Al het overige**

- Alleen afbeeldingssanitization.

---

## Historisch gedrag (vóór 2026.1.22)

Vóór de release 2026.1.22 paste OpenClaw meerdere lagen transcript-hygiëne toe:

- Een **transcript-sanitize-extensie** draaide bij elke contextbuild en kon:
  - Tool-use/result-koppeling repareren.
  - Tool-call-id's sanitiseren (inclusief een niet-strikte modus die `_`/`-` behield).
- De runner voerde ook provider-specifieke sanitization uit, wat werk dupliceerde.
- Aanvullende mutaties vonden plaats buiten het providerbeleid, waaronder:
  - `<final>`-tags strippen uit assistenttekst vóór persistentie.
  - Lege assistent-error-turns verwijderen.
  - Assistentcontent na tool-calls trimmen.

Deze complexiteit veroorzaakte regressies tussen providers (met name `openai-responses`
`call_id|fc_id`-koppeling). De opschoning in 2026.1.22 verwijderde de extensie, centraliseerde
logica in de runner en maakte OpenAI **no-touch** buiten afbeeldingssanitization.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Session pruning](/nl/concepts/session-pruning)
