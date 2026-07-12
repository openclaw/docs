---
read_when:
    - Je onderzoekt afwijzingen van providerverzoeken die verband houden met de vorm van het transcript
    - Je wijzigt de opschoning van transcripties of de herstellogica voor toolaanroepen
    - Je onderzoekt verschillen in tool-call-ID's tussen providers
summary: 'Referentie: providerspecifieke regels voor het opschonen en herstellen van transcripten'
title: Transcripthygiëne
x-i18n:
    generated_at: "2026-07-12T09:18:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw past **providerspecifieke correcties** toe op transcripten vóór een uitvoering
(bij het opbouwen van de modelcontext). De meeste hiervan zijn aanpassingen **in het geheugen** die worden gebruikt om
aan strikte providervereisten te voldoen. Een afzonderlijke herstelbewerking voor sessiebestanden kan
ook opgeslagen JSONL herschrijven voordat de sessie wordt geladen, maar alleen voor
ongeldige regels of opgeslagen beurten die geen geldige duurzame records zijn.
Afgeleverde assistentantwoorden blijven op schijf behouden; het verwijderen van
providerspecifieke assistent-prefill vindt alleen plaats tijdens het samenstellen van uitgaande
payloads.

Wanneer herstel plaatsvindt, wordt het oorspronkelijke bestand naar een tijdelijk
aangrenzend bestand `*.bak-<pid>-<ts>` geschreven vóór de atomaire vervanging en vervolgens verwijderd zodra de
vervanging is geslaagd. De back-up blijft alleen behouden als het opschonen zelf mislukt; in
dat geval wordt het pad teruggekoppeld.

Het bereik omvat:

- Voorkomen dat uitsluitend tijdens runtime gebruikte promptcontext in voor gebruikers zichtbare transcriptbeurten terechtkomt
- Opschoning van toolaanroep-id's
- Validatie van invoer voor toolaanroepen
- Herstel van koppelingen tussen toolresultaten
- Validatie/volgorde van beurten
- Opschoning van gedachtehandtekeningen
- Opschoning van redeneerhandtekeningen
- Opschoning van afbeeldingspayloads
- Opschoning van lege tekstblokken vóór herhaling naar de provider
- Opschoning van onvolledige beurten met alleen redenering en een lengtelimiet vóór herhaling naar de provider
- Herkomstmarkering van gebruikersinvoer (voor prompts die tussen sessies worden doorgestuurd)
- Herstel van lege assistentfoutbeurten voor herhaling via Bedrock Converse

Zie voor details over transcriptopslag
[Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction).

---

## Algemene regel: runtimecontext is geen gebruikerstranscript

Runtime-/systeemcontext kan voor een beurt aan de modelprompt worden toegevoegd, maar is
geen door de eindgebruiker geschreven inhoud. OpenClaw houdt een afzonderlijke, op het transcript gerichte
prompttekst bij voor Gateway-antwoorden, in de wachtrij geplaatste vervolgacties, ACP, CLI en ingesloten
OpenClaw-uitvoeringen. Opgeslagen zichtbare gebruikersbeurten gebruiken deze transcripttekst in plaats van
de met runtimecontext verrijkte prompt.

Voor oudere sessies waarin runtimewrappers al zijn opgeslagen, passen oppervlakken voor Gateway-geschiedenis
een weergaveprojectie toe voordat ze berichten retourneren aan WebChat-,
TUI-, REST- of SSE-clients.

---

## Waar dit wordt uitgevoerd

Alle transcripthygiëne is gecentraliseerd in de ingesloten runner:

- Beleidsselectie: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, gebaseerd op `provider`, `modelApi` en `modelId`)
- Toepassing van opschoning/herstel: `sanitizeSessionHistory` in
  `src/agents/embedded-agent-runner/replay-history.ts`

Los van transcripthygiëne worden sessiebestanden zo nodig vóór het laden
hersteld:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aangeroepen vanuit `src/agents/embedded-agent-runner/run/attempt.ts` en
  `src/agents/embedded-agent-runner/compact.ts`

---

## Algemene regel: opschoning van afbeeldingen

Afbeeldingspayloads worden altijd opgeschoond om afwijzing door de provider wegens
groottelimieten te voorkomen (te grote base64-afbeeldingen verkleinen/opnieuw comprimeren). Dit helpt ook
om de door afbeeldingen veroorzaakte tokendruk te beheersen voor modellen met visiemogelijkheden: lagere maximale
afmetingen verminderen het tokengebruik, terwijl hogere afmetingen details behouden.

Implementatie:

- `sanitizeSessionMessagesImages` in
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- De maximale afbeeldingszijde kan worden geconfigureerd via `agents.defaults.imageMaxDimensionPx`
  (standaard: `1200`)
- Lege tekstblokken worden verwijderd terwijl deze bewerking de herhalingsinhoud doorloopt.
  Assistentbeurten die hierdoor leeg worden, worden uit de herhalingskopie verwijderd; gebruikers-
  en toolresultaatbeurten die leeg worden, krijgen een niet-lege
  tijdelijke aanduiding voor weggelaten inhoud.

---

## Algemene regel: ongeldige toolaanroepen

Assistentblokken voor toolaanroepen waarin zowel `input` als `arguments` ontbreekt, worden verwijderd
voordat de modelcontext wordt opgebouwd. Dit voorkomt afwijzingen door providers vanwege
gedeeltelijk opgeslagen toolaanroepen (bijvoorbeeld na een fout door een snelheidslimiet).

Implementatie:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Toegepast in `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Algemene regel: onvolledige beurten met alleen redenering

Assistentbeurten die de uitvoerlimiet van de provider bereiken met alleen redeneerinhoud of
geredigeerde redeneerinhoud, worden weggelaten uit de herhalingskopie in het geheugen. Zulke
beurten bevatten een onvolledige providerstatus en kunnen een gedeeltelijke redeneerhandtekening
bevatten.

Lege lengtebeurten blijven ongewijzigd, net als lengtebeurten met zichtbare tekst,
toolaanroepen of onbekende inhoudsblokken. Opgeslagen transcripten worden niet herschreven.

Implementatie: `normalizeAssistantReplayContent` in
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Algemene regel: herkomst van invoer tussen sessies

Wanneer een agent via `sessions_send` een prompt naar een andere sessie stuurt
(inclusief antwoord-/aankondigingsstappen tussen agents), slaat OpenClaw de
aangemaakte gebruikersbeurt op met `message.provenance.kind = "inter_session"`.

OpenClaw voegt ook vóór de doorgestuurde prompttekst in dezelfde beurt een markering
`[Bericht tussen sessies] ... isUser=false` toe, zodat de actieve modelaanroep
uitvoer van een andere sessie kan onderscheiden van externe instructies van eindgebruikers. Deze
markering bevat indien beschikbaar de bronsessie, het kanaal en de tool. Het
transcript gebruikt voor compatibiliteit met providers nog steeds `role: "user"`, maar zowel de
zichtbare tekst als de herkomstmetadata markeren de beurt als gegevens tussen sessies.

Tijdens het opnieuw opbouwen van de context past OpenClaw dezelfde markering toe op oudere opgeslagen
gebruikersbeurten tussen sessies die alleen herkomstmetadata bevatten.

---

## Providermatrix (huidig gedrag)

**OpenAI / OpenAI Codex**

- Alleen opschoning van afbeeldingen.
- Verweesde redeneerhandtekeningen verwijderen (zelfstandige redeneeritems zonder een
  volgend inhoudsblok) voor OpenAI Responses-/Codex-transcripten, en
  herhaalbare OpenAI-redenering verwijderen na een wijziging van de modelroute.
- Payloads van herhaalbare OpenAI Responses-redeneeritems behouden, inclusief
  versleutelde items met een lege samenvatting, zodat handmatige/WebSocket-herhaling de vereiste
  `rs_*`-status gekoppeld houdt aan assistentuitvoeritems.
- Native ChatGPT Codex Responses volgt Codex-protocolpariteit door eerdere
  Responses-payloads voor redenering/berichten/functies te herhalen zonder eerdere item-id's,
  terwijl `prompt_cache_key` van de sessie behouden blijft.
- Herhaling binnen de OpenAI Responses-familie behoudt canonieke `call_*|fc_*`-
  redeneerparen voor hetzelfde model, maar normaliseert ongeldige of
  te lange `call_id`-/functieaanroepitem-id's deterministisch vóór omzetting naar een pi-ai-payload.
- Herstel van koppelingen tussen toolresultaten kan echte overeenkomende uitvoer verplaatsen en
  uitvoer in Codex-stijl met `aborted` genereren voor ontbrekende toolaanroepen.
- Geen validatie of herschikking van beurten; gedachtehandtekeningen worden niet verwijderd.

**OpenAI-compatibele Chat Completions**

- Historische redeneerblokken van de assistent worden vóór herhaling verwijderd,
  zodat lokale en proxy-achtige OpenAI-compatibele servers geen
  redeneervelden uit eerdere beurten ontvangen, zoals `reasoning` of `reasoning_content`.
- Voortzettingen van toolaanroepen binnen dezelfde huidige beurt houden het redeneerblok van de assistent
  gekoppeld aan de toolaanroep totdat het toolresultaat is herhaald.
- Aangepaste/zelfgehoste modelvermeldingen met `reasoning: true` behouden herhaalde
  redeneermetadata.
- Uitzonderingen die eigendom zijn van de provider kunnen zich afmelden wanneer hun protocol
  herhaalde redeneermetadata vereist.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Opschoning van toolaanroep-id's: strikt alfanumeriek.
- Herstel van koppelingen tussen toolresultaten en synthetische toolresultaten.
- Validatie van beurten (beurtafwisseling in Gemini-stijl).
- Correctie van de Google-beurtvolgorde (een minimale gebruikersinitialisatie voorvoegen als de geschiedenis
  met de assistent begint).
- Antigravity Claude: redeneerhandtekeningen normaliseren; niet-ondertekende redeneerblokken
  verwijderen.

**Anthropic / Minimax (Anthropic-compatibel)**

- Herstel van koppelingen tussen toolresultaten en synthetische toolresultaten.
- Validatie van beurten (opeenvolgende gebruikersbeurten samenvoegen om aan strikte
  afwisseling te voldoen).
- Afsluitende assistent-prefillbeurten worden uit uitgaande Anthropic
  Messages-payloads verwijderd wanneer redeneren is ingeschakeld, inclusief routes via Cloudflare AI
  Gateway.
- Redeneerhandtekeningen van de assistent van vóór Compaction worden vóór herhaling naar de provider
  verwijderd wanneer een sessie is gecompacteerd. Redeneerhandtekeningen zijn
  tijdens het genereren cryptografisch gebonden aan het gespreksvoorvoegsel;
  na Compaction verandert het voorvoegsel (samengevatte inhoud vervangt het
  origineel), waardoor herhaling van de oorspronkelijke handtekeningen ertoe leidt dat Anthropic
  het verzoek afwijst met "Invalid signature in thinking block". De
  redeneertekst blijft behouden als een niet-ondertekend blok en wordt vervolgens afgehandeld door de
  onderstaande regel.
- Redeneerblokken met ontbrekende, lege of blanco herhalingshandtekeningen worden
  vóór omzetting voor de provider verwijderd. Als een assistentbeurt daardoor leeg wordt,
  behoudt OpenClaw de beurtstructuur met niet-lege tekst voor weggelaten redenering.
- Oudere assistentbeurten met alleen redenering die moeten worden verwijderd, worden vervangen
  door niet-lege tekst voor weggelaten redenering, zodat provideradapters de
  herhalingsbeurt niet verwijderen.

**Amazon Bedrock (Converse API)**

- Lege assistentbeurten met een streamfout worden vóór herhaling hersteld naar een niet-leeg
  reservetekstblok. Bedrock Converse wijst assistentberichten
  met `content: []` af, waardoor opgeslagen assistentbeurten met `stopReason:
"error"` en lege inhoud ook vóór het laden op schijf worden hersteld.
- Assistentbeurten met een streamfout die alleen lege tekstblokken bevatten, worden uit
  de herhalingskopie in het geheugen verwijderd in plaats van een ongeldig leeg blok te herhalen.
- Redeneerhandtekeningen van de assistent van vóór Compaction worden vóór herhaling via Converse
  verwijderd wanneer een sessie is gecompacteerd, om dezelfde reden als bij
  Anthropic hierboven.
- Claude-redeneerblokken met ontbrekende, lege of blanco herhalingshandtekeningen
  worden vóór herhaling via Converse verwijderd. Als een assistentbeurt daardoor leeg wordt,
  behoudt OpenClaw de beurtstructuur met niet-lege tekst voor weggelaten redenering.
- Oudere assistentbeurten met alleen redenering die moeten worden verwijderd, worden vervangen
  door niet-lege tekst voor weggelaten redenering, zodat de Converse-herhaling
  een strikte beurtstructuur behoudt.
- Herhaling filtert door OpenClaw gespiegeld afgeleverde en door de Gateway geïnjecteerde assistentbeurten.
- Opschoning van afbeeldingen wordt toegepast via de algemene regel.

**Mistral (inclusief detectie op basis van model-id)**

- Opschoning van toolaanroep-id's: strict9 (alfanumeriek, lengte 9).

**OpenRouter Gemini**

- Opschoning van gedachtehandtekeningen: niet-base64-waarden van `thought_signature` verwijderen
  (base64 behouden).

**OpenRouter Anthropic**

- Afsluitende assistent-prefillbeurten worden verwijderd uit geverifieerde
  OpenRouter-payloads van OpenAI-compatibele Anthropic-modellen wanneer redeneren is ingeschakeld,
  overeenkomstig het herhalingsgedrag van rechtstreeks Anthropic en Cloudflare Anthropic.

**Alle overige providers**

- Alleen opschoning van afbeeldingen.

---

## Historisch gedrag (vóór 2026.1.22)

Vóór versie 2026.1.22 paste OpenClaw meerdere lagen
transcripthygiëne toe:

- Bij elke contextopbouw werd een **transcriptopschoningsuitbreiding** uitgevoerd die:
  - Koppelingen tussen toolgebruik en -resultaten kon herstellen.
  - Toolaanroep-id's kon opschonen (inclusief een niet-strikte modus waarin
    `_`/`-` behouden bleven).
- De runner voerde ook providerspecifieke opschoning uit, waardoor
  werk dubbel werd uitgevoerd.
- Aanvullende mutaties vonden buiten het providerbeleid plaats, waaronder
  het verwijderen van `<final>`-tags uit assistenttekst vóór opslag, het verwijderen
  van lege assistentfoutbeurten en het inkorten van assistentinhoud na
  toolaanroepen.

Deze complexiteit veroorzaakte regressies tussen providers (met name bij de
koppeling van `openai-responses`-`call_id|fc_id`). De opschoning in versie 2026.1.22 verwijderde
de uitbreiding, centraliseerde de logica in de runner en zorgde ervoor dat OpenAI
buiten de opschoning van afbeeldingen **onaangeroerd** bleef.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoei](/nl/concepts/session-pruning)
