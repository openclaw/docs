---
read_when:
    - Je debugt afwijzingen van providerverzoeken die verband houden met de transcriptstructuur
    - Je wijzigt transcriptopschoning of reparatielogica voor tool-calls
    - Je onderzoekt mismatches in tool-call-id's tussen providers
summary: 'Referentie: providerspecifieke regels voor transcriptopschoning en -herstel'
title: Transcript-hygiëne
x-i18n:
    generated_at: "2026-06-27T18:20:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw past **provider-specifieke fixes** toe op transcripts vóór een run (bij het bouwen van modelcontext). De meeste hiervan zijn **in-memory** aanpassingen die worden gebruikt om aan strikte providervereisten te voldoen. Een aparte reparatiepass voor sessiebestanden kan opgeslagen JSONL ook herschrijven voordat de sessie wordt geladen, maar alleen voor misvormde regels of opgeslagen turns die geen geldige duurzame records zijn. Afgeleverde assistentantwoorden blijven op schijf behouden; provider-specifiek strippen van assistant-prefill gebeurt alleen tijdens het bouwen van uitgaande payloads. Wanneer een reparatie plaatsvindt, wordt het oorspronkelijke bestand naar een tijdelijk `*.bak-<pid>-<ts>` sibling geschreven vóór de atomische vervanging en verwijderd zodra de vervanging is geslaagd; de back-up blijft alleen behouden als het opschonen zelf mislukt (in dat geval wordt het pad teruggerapporteerd).

Scope omvat:

- Runtime-only promptcontext die buiten user-visible transcriptturns blijft
- Sanering van tool call-id's
- Validatie van tool call-invoer
- Reparatie van toolresultaatkoppeling
- Turnvalidatie / ordening
- Opschoning van thought signatures
- Opschoning van thinking signatures
- Sanering van image-payloads
- Opschoning van lege tekstblokken vóór provider-replay
- Opschoning van onvolledige reasoning-only length-turns vóór provider-replay
- Provenance-tagging van gebruikersinvoer (voor inter-session gerouteerde prompts)
- Reparatie van lege assistant error-turns voor Bedrock Converse-replay

Als je details over transcriptopslag nodig hebt, zie:

- [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction)

---

## Globale regel: runtimecontext is geen gebruikerstranscript

Runtime-/systeemcontext kan voor een turn aan de modelprompt worden toegevoegd, maar het is
geen door de eindgebruiker geschreven content. OpenClaw houdt een aparte transcriptgerichte
promptbody bij voor Gateway-antwoorden, queued followups, ACP, CLI en embedded OpenClaw-
runs. Opgeslagen zichtbare user-turns gebruiken die transcriptbody in plaats van de
runtime-verrijkte prompt.

Voor legacy-sessies waarin runtime-wrappers al zijn opgeslagen, passen Gateway-geschiedenis-
surfaces een weergaveprojectie toe voordat berichten worden teruggegeven aan WebChat,
TUI, REST- of SSE-clients.

---

## Waar dit draait

Alle transcripthygiëne is gecentraliseerd in de embedded runner:

- Beleidsselectie: `src/agents/transcript-policy.ts`
- Toepassing van sanering/reparatie: `sanitizeSessionHistory` in `src/agents/embedded-agent-runner/replay-history.ts`

Het beleid gebruikt `provider`, `modelApi` en `modelId` om te bepalen wat moet worden toegepast.

Los van transcripthygiëne worden sessiebestanden vóór het laden gerepareerd (indien nodig):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aangeroepen vanuit `run/attempt.ts` en `compact.ts` (embedded runner)

---

## Globale regel: imagesanering

Image-payloads worden altijd gesaneerd om provider-side afwijzing door grootte-
limieten te voorkomen (oversized base64-images downscalen/hercomprimeren).

Dit helpt ook om door images veroorzaakte tokendruk te beheersen voor vision-capable modellen.
Lagere maximale dimensies verminderen doorgaans het tokengebruik; hogere dimensies behouden detail.

Implementatie:

- `sanitizeSessionMessagesImages` in `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Maximale imagezijde is configureerbaar via `agents.defaults.imageMaxDimensionPx` (standaard: `1200`).
- Lege tekstblokken worden verwijderd terwijl deze pass replay-content doorloopt. Assistant-
  turns die daardoor leeg worden, worden uit de replay-kopie verwijderd; user- en tool-result-
  turns die leeg worden, krijgen een niet-lege placeholder voor weggelaten content.

---

## Globale regel: misvormde tool calls

Assistant tool-call-blokken waarbij zowel `input` als `arguments` ontbreekt, worden verwijderd
voordat modelcontext wordt gebouwd. Dit voorkomt provider-afwijzingen door gedeeltelijk
opgeslagen tool calls (bijvoorbeeld na een rate limit-fout).

Implementatie:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Toegepast in `sanitizeSessionHistory` in `src/agents/embedded-agent-runner/replay-history.ts`

---

## Globale regel: onvolledige reasoning-only turns

Assistant-turns die de provider-outputlimiet bereiken met alleen thinking- of
redacted-thinking-content worden weggelaten uit de in-memory replay-kopie. Zulke turns
bevatten onvolledige providerstatus en kunnen een gedeeltelijke thinking signature bevatten.

Lege length-turns blijven ongewijzigd, net als length-turns met zichtbare tekst, tool
calls of onbekende contentblokken. Opgeslagen transcripts worden niet herschreven.

Implementatie:

- `normalizeAssistantReplayContent` in `src/agents/embedded-agent-runner/replay-history.ts`

---

## Globale regel: provenance van inter-session invoer

Wanneer een agent via `sessions_send` een prompt naar een andere sessie stuurt (inclusief
agent-to-agent reply/announce-stappen), slaat OpenClaw de aangemaakte user-turn op met:

- `message.provenance.kind = "inter_session"`

OpenClaw voegt ook een same-turn `[Inter-session message ... isUser=false]`-
marker toe vóór de gerouteerde prompttekst, zodat de actieve modelcall output uit een
andere sessie kan onderscheiden van externe eindgebruikersinstructies. Deze marker bevat,
waar beschikbaar, de bronsessie, het kanaal en de tool. Het transcript gebruikt nog steeds
`role: "user"` voor providercompatibiliteit, maar zowel de zichtbare tekst als de provenance-
metadata markeren de turn als inter-session data.

Tijdens context rebuild past OpenClaw dezelfde marker toe op oudere opgeslagen
inter-session user-turns die alleen provenance-metadata hebben.

---

## Providermatrix (huidig gedrag)

**OpenAI / OpenAI Codex**

- Alleen imagesanering.
- Verwijder verweesde reasoning signatures (zelfstandige reasoning-items zonder volgend contentblok) voor OpenAI Responses-/Codex-transcripts, en verwijder replayable OpenAI-reasoning na een modelrouteswitch.
- Behoud replayable OpenAI Responses reasoning item-payloads, inclusief versleutelde empty-summary-items, zodat handmatige/WebSocket-replay de vereiste `rs_*`-status gekoppeld houdt aan assistant-outputitems.
- Native ChatGPT Codex Responses volgt Codex wire-pariteit door eerdere Responses reasoning/message/function-payloads zonder eerdere item-ID's te replayen, terwijl de sessie-`prompt_cache_key` behouden blijft.
- OpenAI Responses-family replay behoudt canonieke `call_*|fc_*` same-model reasoning pairs, maar normaliseert deterministisch misvormde of te lange `call_id` / function-call item-id's vóór pi-ai-payloadconversie.
- Reparatie van toolresultaatkoppeling kan echte gematchte outputs verplaatsen en Codex-achtige `aborted` outputs synthetiseren voor ontbrekende tool calls.
- Geen turnvalidatie of herordening.
- Ontbrekende OpenAI Responses-family tool-outputs worden gesynthetiseerd als `aborted` om overeen te komen met Codex-replaynormalisatie.
- Geen stripping van thought signatures.

**OpenAI-compatible Chat Completions**

- Historische assistant thinking-/reasoning-blokken worden vóór replay gestript, zodat
  lokale en proxy-achtige OpenAI-compatible servers geen prior-turn
  reasoning-velden ontvangen, zoals `reasoning` of `reasoning_content`.
- Huidige same-turn tool-call-continuations behouden het assistant reasoning-blok
  dat aan de tool call is gekoppeld totdat het toolresultaat is gereplayed.
- Custom/self-hosted modelentries met `reasoning: true` behouden gereplayde
  reasoning-metadata.
- Provider-owned uitzonderingen kunnen zich afmelden wanneer hun wire protocol
  gereplayde reasoning-metadata vereist.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanering van tool call-id's: strikt alfanumeriek.
- Reparatie van toolresultaatkoppeling en synthetische toolresultaten.
- Turnvalidatie (Gemini-achtige turnafwisseling).
- Google-turnvolgordefixup (voeg een kleine user-bootstrap vooraan toe als geschiedenis met assistant begint).
- Antigravity Claude: normaliseer thinking signatures; verwijder unsigned thinking blocks.

**Anthropic / Minimax (Anthropic-compatible)**

- Reparatie van toolresultaatkoppeling en synthetische toolresultaten.
- Turnvalidatie (opeenvolgende user-turns samenvoegen om aan strikte afwisseling te voldoen).
- Trailing assistant prefill-turns worden gestript uit uitgaande Anthropic Messages-
  payloads wanneer thinking is ingeschakeld, inclusief Cloudflare AI Gateway-routes.
- Pre-compaction assistant thinking signatures worden gestript vóór provider-
  replay wanneer een sessie is gecompact. Thinking signatures zijn op generatietijd
  cryptografisch gebonden aan de conversatieprefix; na compaction verandert
  de prefix (samengevatte content wordt vervangen door een compaction-
  summary), waardoor het replayen van de oorspronkelijke signatures ertoe leidt dat Anthropic de
  aanvraag afwijst met "Invalid signature in thinking block". De thinking-tekst blijft
  behouden als unsigned block en wordt vervolgens afgehandeld door de onderstaande regel.
- Thinking blocks met ontbrekende, lege of blanco replay signatures worden gestript
  vóór providerconversie. Als dat een assistant-turn leeg maakt, behoudt OpenClaw
  de turnvorm met niet-lege omitted-reasoning-tekst.
- Oudere thinking-only assistant-turns die moeten worden gestript, worden vervangen door
  niet-lege omitted-reasoning-tekst, zodat provideradapters de replay-
  turn niet verwijderen.

**Amazon Bedrock (Converse API)**

- Lege assistant stream-error-turns worden gerepareerd naar een niet-leeg fallback-tekstblok
  vóór replay. Bedrock Converse wijst assistant-berichten met `content: []` af, dus
  opgeslagen assistant-turns met `stopReason: "error"` en lege content worden ook
  vóór het laden op schijf gerepareerd.
- Assistant stream-error-turns die alleen blanco tekstblokken bevatten, worden verwijderd
  uit de in-memory replay-kopie in plaats van een ongeldig blanco blok te replayen.
- Pre-compaction assistant thinking signatures worden vóór Converse-
  replay gestript wanneer een sessie is gecompact, om dezelfde reden als bij Anthropic
  hierboven.
- Claude thinking blocks met ontbrekende, lege of blanco replay signatures worden
  vóór Converse-replay gestript. Als dat een assistant-turn leeg maakt, behoudt OpenClaw
  de turnvorm met niet-lege omitted-reasoning-tekst.
- Oudere thinking-only assistant-turns die moeten worden gestript, worden vervangen door
  niet-lege omitted-reasoning-tekst, zodat de Converse-replay de strikte turnvorm behoudt.
- Replay filtert OpenClaw delivery-mirror- en gateway-injected assistant-turns.
- Imagesanering wordt toegepast via de globale regel.

**Mistral (inclusief model-id-gebaseerde detectie)**

- Sanering van tool call-id's: strict9 (alfanumerieke lengte 9).

**OpenRouter Gemini**

- Opschoning van thought signatures: strip niet-base64 `thought_signature`-waarden (behoud base64).

**OpenRouter Anthropic**

- Trailing assistant prefill-turns worden gestript uit geverifieerde OpenRouter
  OpenAI-compatible Anthropic-modelpayloads wanneer reasoning is ingeschakeld, overeenkomstig
  direct Anthropic- en Cloudflare Anthropic-replaygedrag.

**Al het overige**

- Alleen imagesanering.

---

## Historisch gedrag (vóór 2026.1.22)

Vóór de 2026.1.22-release paste OpenClaw meerdere lagen transcripthygiëne toe:

- Een **transcript-sanitize extension** draaide bij elke contextbuild en kon:
  - Tool use/result-koppeling repareren.
  - Tool call-id's saneren (inclusief een niet-strikte modus die `_`/`-` behield).
- De runner voerde ook provider-specifieke sanering uit, wat werk dupliceerde.
- Aanvullende mutaties vonden plaats buiten het providerbeleid, waaronder:
  - `<final>`-tags uit assistant-tekst strippen vóór persistentie.
  - Lege assistant error-turns verwijderen.
  - Assistant-content na tool calls trimmen.

Deze complexiteit veroorzaakte cross-provider regressies (met name `openai-responses`
`call_id|fc_id`-koppeling). De opschoning in 2026.1.22 verwijderde de extension, centraliseerde
logica in de runner en maakte OpenAI **no-touch** afgezien van imagesanering.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
