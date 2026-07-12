---
read_when:
    - Je wilt OpenClaw uitvoeren met cloudmodellen of lokale modellen via Ollama
    - Je hebt hulp nodig bij het instellen en configureren van Ollama
    - Je wilt Ollama-visionmodellen gebruiken voor beeldherkenning
summary: Voer OpenClaw uit met Ollama (cloud- en lokale modellen)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T09:14:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw communiceert met de native API van Ollama (`/api/chat`), niet met het OpenAI-compatibele
`/v1`-eindpunt. Er worden drie modi ondersteund:

| Modus          | Wat deze gebruikt                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Cloud + lokaal | Een bereikbare Ollama-host die lokale modellen en (indien aangemeld) `:cloud`-modellen aanbiedt       |
| Alleen cloud   | Rechtstreeks `https://ollama.com`, zonder lokale daemon                                               |
| Alleen lokaal  | Een bereikbare Ollama-host, uitsluitend met lokale modellen                                           |

Zie [Ollama Cloud](/nl/providers/ollama-cloud) voor een configuratie die uitsluitend de cloud gebruikt met de specifieke provider-id `ollama-cloud`. Gebruik verwijzingen als `ollama-cloud/<model>` wanneer
u cloudroutering gescheiden wilt houden van een lokale `ollama`-provider.

<Warning>
Gebruik niet de OpenAI-compatibele `/v1`-URL (`http://host:11434/v1`). Hierdoor werken toolaanroepen niet correct en kunnen modellen onbewerkte JSON voor toolaanroepen als platte tekst uitvoeren. Gebruik de native URL: `baseUrl: "http://host:11434"` (zonder `/v1`).
</Warning>

De canonieke configuratiesleutel is `baseUrl`. `baseURL` wordt ook geaccepteerd voor
voorbeelden in OpenAI-SDK-stijl, maar nieuwe configuraties moeten `baseUrl` gebruiken.

## Authenticatieregels

<AccordionGroup>
  <Accordion title="Lokale en LAN-hosts">
    Ollama-URL's voor loopback, privénetwerken, `.local` en kale hostnamen hebben geen echt bearer-token nodig. OpenClaw gebruikt hiervoor de markering `ollama-local`.
  </Accordion>
  <Accordion title="Externe hosts en Ollama Cloud-hosts">
    Openbare externe hosts en `https://ollama.com` vereisen echte aanmeldgegevens: `OLLAMA_API_KEY`, een authenticatieprofiel of de `apiKey` van de provider. Gebruik voor rechtstreeks gehost gebruik bij voorkeur de provider `ollama-cloud`.
  </Accordion>
  <Accordion title="Aangepaste provider-id's">
    Voor een aangepaste provider met `api: "ollama"` gelden dezelfde regels. Een provider `ollama-remote` die bijvoorbeeld naar een privéhost in het LAN verwijst, kan `apiKey: "ollama-local"` gebruiken; subagents verwerken die markering via de Ollama-providerhook in plaats van deze als ontbrekende aanmeldgegevens te beschouwen. `agents.defaults.memorySearch.provider` kan ook naar een aangepaste provider-id verwijzen, zodat insluitingen dat Ollama-eindpunt gebruiken.
  </Accordion>
  <Accordion title="Authenticatieprofielen">
    `auth-profiles.json` bewaart de aanmeldgegevens voor een provider-id; plaats eindpuntinstellingen (`baseUrl`, `api`, modellen, headers, time-outs) in `models.providers.<id>`. Oudere platte bestanden, zoals `{ "ollama-windows": { "apiKey": "ollama-local" } }`, zijn geen runtime-indeling; `openclaw doctor --fix` herschrijft ze met een back-up naar een canoniek API-sleutelprofiel `ollama-windows:default`. Een waarde voor `baseUrl` in dat verouderde bestand is ruis en moet naar de providerconfiguratie worden verplaatst.
  </Accordion>
  <Accordion title="Bereik van geheugeninsluitingen">
    Bearer-authenticatie voor Ollama-geheugeninsluitingen is beperkt tot de host waarvoor deze is gedeclareerd:

    - Een sleutel op providerniveau wordt alleen naar de host van die provider verzonden.
    - `agents.*.memorySearch.remote.apiKey` wordt alleen naar de externe host voor insluitingen verzonden.
    - Een uitsluitend via de omgevingsvariabele `OLLAMA_API_KEY` ingestelde waarde wordt behandeld als de conventie voor Ollama Cloud en wordt standaard niet naar lokale/zelfgehoste hosts verzonden.

  </Accordion>
</AccordionGroup>

## Aan de slag

<Tabs>
  <Tab title="Onboarding (aanbevolen)">
    <Steps>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard
        ```

        Selecteer **Ollama** en kies vervolgens een modus: **Cloud + lokaal**, **Alleen cloud** of **Alleen lokaal**.
      </Step>
      <Step title="Een model selecteren">
        `Cloud only` vraagt om `OLLAMA_API_KEY` en stelt standaard gehoste cloudmodellen voor. `Cloud + Local` en `Local only` vragen om een Ollama-basis-URL, detecteren beschikbare modellen en halen het geselecteerde lokale model automatisch op als het ontbreekt. Een geïnstalleerde `:latest`-tag, zoals `gemma4:latest`, wordt één keer weergegeven in plaats van `gemma4` te dupliceren. `Cloud + Local` controleert ook of de host is aangemeld voor cloudtoegang.
      </Step>
      <Step title="Verifiëren">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Niet-interactief:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` en `--custom-model-id` zijn optioneel; als u ze weglaat, worden de standaard lokale host en het voorgestelde model `gemma4` gebruikt.

  </Tab>

  <Tab title="Handmatige configuratie">
    <Steps>
      <Step title="Ollama installeren en starten">
        Download het van [ollama.com/download](https://ollama.com/download) en haal vervolgens een model op:

        ```bash
        ollama pull gemma4
        ```

        Voer voor hybride cloudtoegang `ollama signin` uit op dezelfde host.
      </Step>
      <Step title="Aanmeldgegevens instellen">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # lokale/LAN-host, elke waarde werkt
        export OLLAMA_API_KEY="your-real-key"   # uitsluitend https://ollama.com
        ```

        Of in de configuratie: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Het model selecteren">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Of in de configuratie:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Cloudmodellen via een lokale host

`Cloud + Local` routeert zowel lokale als `:cloud`-modellen via één bereikbare
Ollama-host — dit is de hybride werkwijze van Ollama en de modus die u tijdens de configuratie kiest
wanneer u beide wilt gebruiken.

OpenClaw vraagt om de basis-URL, detecteert lokale modellen en controleert
de status van `ollama signin`. Wanneer u bent aangemeld, stelt het gehoste standaardmodellen voor
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Als
u niet bent aangemeld, blijft de configuratie uitsluitend lokaal totdat u `ollama signin` uitvoert.

Gebruik voor cloudtoegang zonder lokale daemon `openclaw onboard --auth-choice ollama-cloud` en zie [Ollama Cloud](/nl/providers/ollama-cloud) — voor dat pad zijn `ollama signin` en een actieve server niet nodig:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

De lijst met cloudmodellen die tijdens `openclaw onboard` wordt weergegeven, wordt live gevuld vanuit
`https://ollama.com/api/tags` en is beperkt tot 500 vermeldingen, zodat de keuzelijst
de huidige gehoste catalogus weergeeft. Als `ollama.com` onbereikbaar is of tijdens de configuratie geen
modellen retourneert, valt OpenClaw terug op de hardgecodeerde lijst met voorstellen, zodat
de onboarding toch wordt voltooid.

## Modeldetectie (impliciete provider)

Wanneer `OLLAMA_API_KEY` (of een authenticatieprofiel) is ingesteld en noch
`models.providers.ollama`, noch een andere aangepaste provider met `api: "ollama"` is
gedefinieerd, detecteert OpenClaw modellen via `http://127.0.0.1:11434`:

| Gedrag                 | Details                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalogusquery         | `/api/tags`                                                                                                                                                                                                                                                                                                                                                 |
| Mogelijkhedendetectie  | `/api/show` leest op basis van beste inspanning `contextWindow`, de Modelfile-parameters `num_ctx` en mogelijkheden (beeld/tools/redeneren)                                                                                                                                                                                                                  |
| Beeldmodellen          | Een mogelijkheid `vision` van `/api/show` markeert het model als geschikt voor afbeeldingen (`input: ["text", "image"]`)                                                                                                                                                                                                                                    |
| Redeneerdetectie       | Gebruikt indien beschikbaar de mogelijkheid `thinking` van `/api/show`; valt terug op een heuristiek op basis van de naam (`r1`, `reason`, `reasoning`, `think`) wanneer Ollama geen mogelijkheden opgeeft. `glm-5.2:cloud` en `deepseek-v4-flash\|pro:cloud` worden ongeacht de gerapporteerde mogelijkheden altijd als redeneermodellen behandeld. |
| Tokenlimieten          | `maxTokens` gebruikt standaard de maximale tokenlimiet van OpenClaw voor Ollama                                                                                                                                                                                                                                                                             |
| Kosten                 | Alle kosten zijn `0`                                                                                                                                                                                                                                                                                                                                        |

```bash
ollama list
openclaw models list
```

Door `models.providers.ollama` in te stellen met een expliciete `models`-array, of een
aangepaste provider met `api: "ollama"` en een `baseUrl` die geen loopback gebruikt, wordt
automatische detectie uitgeschakeld; modellen moeten dan handmatig worden gedefinieerd (zie
[Configuratie](#configuration)). Een vermelding `models.providers.ollama` die naar
het gehoste `https://ollama.com` verwijst, slaat detectie ook over, omdat Ollama Cloud-modellen
door de provider worden beheerd. Aangepaste loopbackproviders, zoals
`http://127.0.0.2:11434`, gelden nog steeds als lokaal en behouden automatische detectie.

U kunt een volledige verwijzing, zoals `ollama/<pulled-model>:latest`, gebruiken zonder een
handmatig geschreven vermelding in `models.json`; OpenClaw verwerkt deze live. Voor aangemelde
hosts wordt bij het selecteren van een niet-vermelde verwijzing `ollama/<model>:cloud` dat exacte
model met `/api/show` gevalideerd en alleen aan de runtimecatalogus toegevoegd als Ollama
de metagegevens bevestigt — typefouten blijven als onbekende modellen mislukken.

### Rooktests

Voor een gerichte teksttest die het volledige tooloppervlak van de agent overslaat:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Voeg `--file` met een afbeelding toe voor een beknopte test van een beeldmodel (ondersteunt PNG/JPEG/WebP;
bestanden die geen afbeelding zijn, worden geweigerd voordat Ollama wordt aangeroepen — gebruik
`openclaw infer audio transcribe` voor audio):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

Geen van beide paden laadt chattools, geheugen of sessiecontext. Als dit wel werkt
terwijl normale agentreacties mislukken, ligt het probleem waarschijnlijk bij de tool-/agentcapaciteit
van het model en niet bij het eindpunt.

Het selecteren van een model met `/model ollama/<model>` is een exacte gebruikerskeuze: als de
geconfigureerde `baseUrl` onbereikbaar is, mislukt het volgende antwoord met de providerfout
in plaats van stilzwijgend terug te vallen op een ander geconfigureerd model.

Geïsoleerde Cron-taken voegen één lokale veiligheidscontrole toe voordat de agentbeurt wordt gestart:
als het geselecteerde model wordt omgezet naar een Ollama-provider op een lokaal/privénetwerk/`.local`
en `/api/tags` onbereikbaar is, registreert OpenClaw die uitvoering als
`skipped`, met het model in de fouttekst. Deze eindpuntcontrole wordt
5 minuten per host in de cache opgeslagen, zodat herhaalde Cron-taken voor een gestopte daemon niet allemaal
mislukkende aanvragen starten.

Liveverificatie:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Voor Ollama Cloud richt u dezelfde live-test op het gehoste eindpunt (slaat
embeddings standaard over; forceer ze met `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, omdat een
cloudsleutel mogelijk geen toegang geeft tot `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Om een model toe te voegen, haalt u het op; het wordt vervolgens automatisch gedetecteerd:

```bash
ollama pull mistral
```

## Node-lokale inferentie

Agents kunnen een korte taak delegeren aan een Ollama-model op een gekoppelde desktop- of
server-Node. De prompt en het antwoord lopen via de bestaande geauthenticeerde
Gateway/Node-verbinding; de aanvraag wordt uitgevoerd op het eigen local loopback Ollama-
eindpunt van de Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Ollama starten op de Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="De Node-host verbinden">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Keur het apparaat en de bijbehorende Node-opdrachten goed op de Gateway-host en verifieer daarna:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Een eerste verbinding, of een upgrade die Ollama-opdrachten toevoegt, kan
    goedkeuring van Node-opdrachten activeren. Als de Node verbinding maakt zonder
    `ollama.models` en `ollama.chat` aan te kondigen, controleert u `openclaw nodes pending` opnieuw.

  </Step>
  <Step title="Gebruiken vanuit een agent">
    De meegeleverde Ollama-Plugin stelt het hulpmiddel `node_inference` beschikbaar. Agents roepen
    eerst `action: "discover"` aan en daarna `action: "run"` met een Node en model uit
    dat resultaat (`run` mag de Node weglaten wanneer precies één geschikte Node is
    verbonden). Bijvoorbeeld: "Detecteer de Ollama-modellen op mijn Nodes en gebruik vervolgens
    het snelste geladen model om deze tekst samen te vatten."
  </Step>
</Steps>

Detectie leest `/api/tags`, controleert mogelijkheden via `/api/show` en gebruikt
`/api/ps` indien beschikbaar om reeds geladen modellen als eerste te rangschikken. Alleen
lokale modellen die Ollama als geschikt voor chat rapporteert (mogelijkheid `completion`) worden geretourneerd —
Ollama Cloud-vermeldingen en modellen die uitsluitend embeddings ondersteunen, worden uitgesloten. Elke uitvoering schakelt
het denkproces van het model uit en beperkt de uitvoer standaard tot 512 tokens (harde limiet 8192), tenzij de
hulpmiddelaanroep een andere `maxTokens` aanvraagt; sommige modellen (bijvoorbeeld GPT-OSS)
ondersteunen het uitschakelen van het denkproces niet en kunnen alsnog redeneertokens produceren.

Om Ollama actief te houden op een Node zonder het beschikbaar te stellen aan agents:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Start de Node opnieuw (`openclaw node restart`, of stop `openclaw node run` en voer het opnieuw uit
voor een voorgrondsessie). De Node kondigt `ollama.models` en
`ollama.chat` niet langer aan; Ollama zelf en de Ollama-provider van de Gateway blijven ongewijzigd.
Stel de waarde weer in op `true` en start opnieuw om dit weer in te schakelen; voor een gewijzigd
opdrachtoppervlak kan na opnieuw verbinden opnieuw goedkeuring via `openclaw nodes pending` nodig zijn.

Verifieer de Node-opdrachten rechtstreeks, zonder een agentbeurt:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` begrenst hoelang de Node de opdracht mag uitvoeren;
`--timeout` begrenst de volledige Gateway-aanroep en moet groter zijn.

Node-lokale inferentie gebruikt altijd het eigen local loopback-eindpunt van de Node — een geconfigureerde externe/cloud-
`models.providers.ollama.baseUrl` wordt niet hergebruikt. De
Node-opdrachten zijn standaard beschikbaar op macOS-, Linux- en Windows-Node-
hosts en blijven onderworpen aan het normale beleid voor het koppelen van Nodes en opdrachten.

## Visie en afbeeldingsbeschrijving

De meegeleverde Ollama-Plugin registreert Ollama als een provider voor
media-analyse met afbeeldingsondersteuning, zodat OpenClaw expliciete aanvragen voor afbeeldingsbeschrijvingen
en geconfigureerde standaardwaarden voor afbeeldingsmodellen kan routeren via lokale of gehoste Ollama-
visiemodellen.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` moet een volledige verwijzing van de vorm `<provider/model>` zijn; wanneer deze is ingesteld, probeert `infer image
describe` dat model eerst, in plaats van de beschrijving over te slaan voor modellen
die al ingebouwde visie ondersteunen. Als de aanroep mislukt, kan OpenClaw doorgaan
via `agents.defaults.imageModel.fallbacks`; fouten bij het voorbereiden van bestanden/URL's
treden op voordat een terugvalpoging wordt uitgevoerd. Gebruik `infer image describe` voor de
afbeeldingsanalyse van OpenClaw en het geconfigureerde `imageModel`; gebruik `infer model run
--file` voor een onbewerkte multimodale test met een aangepaste prompt.

Om Ollama de standaardprovider voor afbeeldingsanalyse van binnenkomende media te maken:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Geef de voorkeur aan de volledige verwijzing `ollama/<model>`. Een kale `imageModel`-verwijzing zoals
`qwen2.5vl:7b` wordt alleen genormaliseerd naar `ollama/qwen2.5vl:7b` wanneer dat exacte model
onder `models.providers.ollama.models` staat vermeld met
`input: ["text", "image"]` en geen andere geconfigureerde afbeeldingsprovider dezelfde
kale id beschikbaar stelt; gebruik anders expliciet het providervoorvoegsel.

Langzame lokale visiemodellen kunnen een langere time-out voor afbeeldingsanalyse nodig hebben dan
cloudmodellen en kunnen vastlopen op hardware met beperkte capaciteit als Ollama probeert
de volledige aangekondigde visiecontext van het model toe te wijzen. Stel een time-out voor de mogelijkheid in
en begrens `num_ctx`:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Deze time-out geldt voor de analyse van binnenkomende afbeeldingen en voor het expliciete
hulpmiddel `image`. `models.providers.ollama.timeoutSeconds` regelt nog steeds de
onderliggende beveiliging tegen time-outs van Ollama-HTTP-aanvragen voor normale modelaanroepen.

Live-verificatie:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Als u `models.providers.ollama.models` handmatig definieert, markeer visiemodellen dan
expliciet:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw weigert aanvragen voor afbeeldingsbeschrijvingen voor modellen die niet als
geschikt voor afbeeldingen zijn gemarkeerd. Bij impliciete detectie is dit afkomstig van de
visiemogelijkheid van `/api/show`.

## Configuratie

<Tabs>
  <Tab title="Basis (impliciete detectie)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Als `OLLAMA_API_KEY` is ingesteld, kunt u `apiKey` weglaten in de providervermelding; OpenClaw vult deze in voor beschikbaarheidscontroles.
    </Tip>

  </Tab>

  <Tab title="Expliciet (handmatige modellen)">
    Gebruik expliciete configuratie voor een gehoste cloudopstelling, een niet-standaardhost/-poort, afgedwongen
    contextvensters of volledig handmatige modellenlijsten:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Aangepaste basis-URL">
    Expliciete configuratie schakelt automatische detectie uit, dus modellen moeten worden vermeld:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Geen /v1 - URL van de ingebouwde Ollama-API
            api: "ollama", // Expliciet: garandeert ingebouwd gedrag voor hulpmiddelaanroepen
            timeoutSeconds: 300, // Optioneel: ruimer verbindings-/streambudget voor koude lokale modellen
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optioneel: houd het model tussen beurten geladen
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Voeg `/v1` niet toe. Dat pad selecteert de OpenAI-compatibele modus, waarin hulpmiddelaanroepen niet betrouwbaar zijn.
    </Warning>

  </Tab>
</Tabs>

## Veelgebruikte recepten

Vervang model-id's door exacte namen uit `ollama list` of
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Lokaal model met automatische detectie">
    Ollama op dezelfde machine als de Gateway, automatisch gedetecteerd:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Voeg geen blok `models.providers.ollama` toe, tenzij u handmatige modellen nodig hebt.

  </Accordion>

  <Accordion title="Ollama-host op het LAN met handmatige modellen">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` is het contextbudget van OpenClaw; `params.num_ctx` wordt naar
    Ollama verzonden. Houd ze op elkaar afgestemd wanneer de hardware de volledige
    aangekondigde context van het model niet kan uitvoeren.

  </Accordion>

  <Accordion title="Alleen Ollama Cloud">
    Geen lokale daemon; rechtstreeks gehoste modellen:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    Zie [Ollama Cloud](/nl/providers/ollama-cloud) voor de specifieke provider-id `ollama-cloud`
    in plaats van deze vorm.

  </Accordion>

  <Accordion title="Cloud plus lokaal via een aangemelde daemon">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Multiple Ollama hosts">
    Aangepaste provider-ID's wanneer je meer dan één Ollama-server uitvoert; elke server krijgt
    een eigen host, modellen, authenticatie en time-out.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw verwijdert het actieve providerprefix (met een kaal
    `ollama/`-prefix als terugvaloptie) voordat Ollama wordt aangeroepen, zodat `ollama-large/qwen3.5:27b`
    Ollama bereikt als `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Sommige lokale modellen kunnen eenvoudige prompts verwerken, maar hebben moeite met het volledige
    agenttooloppervlak. Beperk de tools en context voordat je algemene runtime-
    instellingen wijzigt:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Gebruik `compat.supportsTools: false` alleen wanneer het model of de server consequent
    faalt bij toolschema's — hiermee ruil je agentmogelijkheden in voor stabiliteit.
    `localModelLean` verwijdert zware browser-, Cron-, berichten-, mediageneratie-,
    spraak- en PDF-tools uit het directe agentoppervlak, tenzij ze expliciet vereist zijn,
    en plaatst grotere catalogi achter Tool Search. Het wijzigt de
    runtimecontext of denkmodus van Ollama niet. Combineer het met `params.num_ctx` en
    `params.thinking: false` voor kleine Qwen-achtige denkmodellen die in een lus raken of
    hun budget besteden aan verborgen redeneringen.

  </Accordion>
</AccordionGroup>

### Modelselectie

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Aangepaste provider-ID's werken op dezelfde manier: voor een verwijzing die het actieve providerprefix
gebruikt, zoals `ollama-spark/qwen3:32b`, verwijdert OpenClaw dat prefix voordat
Ollama wordt aangeroepen en wordt `qwen3:32b` verzonden.

Geef voor trage lokale modellen de voorkeur aan providerspecifieke afstemming voordat je de time-out van de volledige
agentruntime verhoogt:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` omvat het HTTP-verzoek aan het model: het opzetten van de verbinding, headers,
het streamen van de hoofdtekst en de totale bewaakte afbreking van de ophaalbewerking. `params.keep_alive` wordt
doorgestuurd als `keep_alive` op het hoogste niveau bij systeemeigen `/api/chat`-verzoeken; stel dit per
model in wanneer de laadtijd van de eerste beurt het knelpunt vormt.

### Snelle verificatie

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Vervang voor externe hosts `127.0.0.1` door de host uit `baseUrl`. Als `curl`
werkt maar OpenClaw niet, controleer dan of de Gateway op een andere
machine, in een andere container of onder een ander serviceaccount wordt uitgevoerd.

## Ollama Web Search

OpenClaw bevat **Ollama Web Search** als `web_search`-provider.

| Eigenschap   | Details                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host         | `models.providers.ollama.baseUrl` indien ingesteld, anders `http://127.0.0.1:11434`; `https://ollama.com` gebruikt rechtstreeks de gehoste API             |
| Authenticatie | Zonder sleutel voor een aangemelde lokale host; `OLLAMA_API_KEY` of geconfigureerde providerauthenticatie voor rechtstreeks zoeken via `https://ollama.com` of hosts met authenticatiebeveiliging |
| Vereiste     | Lokale/zelfgehoste hosts moeten actief en aangemeld zijn met `ollama signin`; rechtstreeks gehost zoeken vereist `baseUrl: "https://ollama.com"` plus een echte API-sleutel |

Kies dit tijdens `openclaw onboard` of `openclaw configure --section web`, of stel het volgende in:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Voor rechtstreeks gehost zoeken via Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Voor een zelfgehoste host probeert OpenClaw eerst de lokale proxy
`/api/experimental/web_search` en valt daarna terug op het gehoste pad `/api/web_search`
op dezelfde host; een aangemelde lokale daemon antwoordt normaal gesproken via de lokale proxy. Rechtstreekse
aanroepen naar `https://ollama.com` gebruiken altijd het gehoste eindpunt `/api/web_search`.

<Note>
Zie [Ollama Web Search](/nl/tools/ollama-search) voor de volledige configuratie en werking.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **Het aanroepen van tools is in deze modus niet betrouwbaar.** Gebruik deze modus alleen wanneer een proxy de OpenAI-indeling vereist en je niet afhankelijk bent van systeemeigen toolaanroepen.
    </Warning>

    Stel `api: "openai-completions"` expliciet in voor een proxy achter
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Deze modus ondersteunt mogelijk niet gelijktijdig streamen en toolaanroepen; mogelijk
    moet je `params: { streaming: false }` instellen op het model.

    OpenClaw voegt in deze modus standaard `options.num_ctx` toe, zodat Ollama niet
    stilzwijgend terugvalt op een context van 4096 tokens. Als je proxy onbekende
    `options`-velden weigert, schakel dit dan uit:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Context windows">
    Voor automatisch ontdekte modellen gebruikt OpenClaw het contextvenster dat door `/api/show`
    wordt gemeld, inclusief grotere `PARAMETER num_ctx`-waarden uit aangepaste
    Modelfiles; anders valt het terug op het standaardcontextvenster van OpenClaw
    voor Ollama.

    `contextWindow`, `contextTokens` en `maxTokens` op providerniveau stellen
    standaardwaarden in voor elk model onder die provider en kunnen per
    model worden overschreven. `contextWindow` is OpenClaws eigen budget voor prompts en Compaction. Bij systeemeigen
    `/api/chat`-verzoeken blijft `options.num_ctx` oningesteld, tenzij je
    `params.num_ctx` expliciet instelt, zodat Ollama zijn eigen standaardwaarde voor het model,
    `OLLAMA_CONTEXT_LENGTH` of een op VRAM gebaseerde standaardwaarde toepast; ongeldige, nul-, negatieve
    of niet-eindige waarden voor `params.num_ctx` worden genegeerd. Als een oudere configuratie
    alleen `contextWindow`/`maxTokens` gebruikte om de context van systeemeigen verzoeken af te dwingen, voer dan
    `openclaw doctor --fix` uit om deze naar `params.num_ctx` te kopiëren. De
    OpenAI-compatibele adapter voegt `options.num_ctx` nog steeds standaard toe op basis van
    de geconfigureerde `params.num_ctx` of `contextWindow`; schakel dit uit met
    `injectNumCtxForOpenAICompat: false` als de bovenliggende service `options` weigert.

    Systeemeigen modelvermeldingen accepteren ook algemene Ollama-runtimeopties onder
    `params`, die als systeemeigen `/api/chat`-`options` worden doorgestuurd: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` en `num_thread`.
    Enkele sleutels (`format`, `keep_alive`, `truncate`, `shift`) worden als
    verzoekvelden op het hoogste niveau doorgestuurd in plaats van als geneste `options`. OpenClaw
    stuurt alleen deze Ollama-verzoeksleutels door, zodat uitsluitend voor de runtime bedoelde parameters zoals
    `streaming` nooit naar Ollama worden verzonden. Gebruik `params.think` (of
    `params.thinking`) om `think` op het hoogste niveau in te stellen; `false` schakelt denken op API-niveau
    uit voor Qwen-achtige denkmodellen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` per model
    werkt ook; de expliciete providermodelvermelding heeft voorrang als beide zijn ingesteld.

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw stuurt denken door zoals Ollama dit verwacht: `think` op het hoogste niveau, niet
    `options.think`. Automatisch ontdekte modellen waarvan `/api/show` een
    `thinking`-mogelijkheid meldt, bieden `/think low`, `/think medium`, `/think high`
    en `/think max`; modellen zonder denkfunctie bieden alleen `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Of stel een standaardwaarde voor het model in:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think`/`params.thinking` per model kan API-denken voor een specifiek model uitschakelen of afdwingen. OpenClaw behoudt die expliciete configuratie wanneer de actieve uitvoering alleen de impliciete standaardwaarde `off` heeft; een runtime-opdracht met een andere waarde dan `off`, zoals `/think medium`, overschrijft deze nog steeds. Een waarheidswaardig denkverzoek wordt nooit verzonden naar een model dat expliciet is gemarkeerd met `reasoning: false`; een verzoek met `think: false` wordt altijd verzonden.

  </Accordion>

  <Accordion title="Redeneermodellen">
    Modellen met de naam `deepseek-r1`, `reasoning`, `reason` of `think` worden standaard beschouwd als modellen die kunnen redeneren — er is geen aanvullende configuratie nodig:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Modelkosten">
    Ollama wordt lokaal uitgevoerd en is gratis, dus alle modelkosten zijn `0` voor zowel automatisch ontdekte als handmatig gedefinieerde modellen.
  </Accordion>

  <Accordion title="Geheugen-embeddings">
    De meegeleverde Ollama-Plugin registreert een provider voor geheugen-embeddings voor [zoeken in het geheugen](/nl/concepts/memory). Deze gebruikt de geconfigureerde Ollama-basis-URL en API-sleutel, roept `/api/embed` aan en bundelt waar mogelijk meerdere geheugenfragmenten in één `input`-verzoek.

    Wanneer `proxy.enabled=true`, gebruiken embeddingverzoeken naar de exacte hostlokale loopback-oorsprong die van de geconfigureerde `baseUrl` is afgeleid het beveiligde directe pad van OpenClaw in plaats van de beheerde doorstuurproxy. De geconfigureerde hostnaam moet zelf `localhost` of een letterlijk loopback-IP-adres zijn — DNS-namen die alleen naar loopback worden omgezet, gebruiken nog steeds het beheerde proxypad. Ollama-hosts op het LAN, tailnet, privénetwerk en openbare netwerk blijven altijd op het beheerde proxypad en omleidingen naar een andere host of poort nemen het vertrouwen niet over. `proxy.loopbackMode: "proxy"` leidt loopbackverkeer desondanks via de proxy; `proxy.loopbackMode: "block"` weigert het voordat verbinding wordt gemaakt — zie [Beheerde proxy](/nl/security/network-proxy#gateway-loopback-mode).

    | Eigenschap | Waarde |
    | --- | --- |
    | Standaardmodel | `nomic-embed-text` |
    | Automatisch ophalen | Ja, indien niet lokaal aanwezig |
    | Standaard inline-gelijktijdigheid | 1 (andere providers gebruiken standaard een hogere waarde; verhoog deze met `nonBatchConcurrency` als de host dit aankan) |

    Embeddings tijdens zoekopdrachten gebruiken ophaalvoorvoegsels voor modellen die deze vereisen of aanbevelen: `nomic-embed-text`, `qwen3-embedding` en `mxbai-embed-large`. Documentbatches blijven onbewerkt, zodat bestaande indexen geen formaatmigratie nodig hebben.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Houd voor een externe embeddinghost de authenticatie beperkt tot die host:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Streamingconfiguratie">
    Ollama gebruikt standaard de **native API** (`/api/chat`), die streaming en toolaanroepen samen ondersteunt — er is geen speciale configuratie nodig.

    Voor native verzoeken wordt de denkbesturing rechtstreeks doorgestuurd: `/think off` en `openclaw agent --thinking off` verzenden `think: false` op het hoogste niveau, tenzij expliciet `params.think`/`params.thinking` is geconfigureerd; `/think low|medium|high` verzendt de overeenkomende inspanningswaarde; `/think max` wordt toegewezen aan Ollama's hoogste inspanningsniveau, `think: "high"`.

    <Tip>
    Zie voor het OpenAI-compatibele eindpunt in plaats daarvan ‘Oudere OpenAI-compatibele modus’ hierboven — streaming en toolaanroepen werken daar mogelijk niet samen.
    </Tip>

  </Accordion>
</AccordionGroup>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="WSL2-crashlus (herhaald opnieuw opstarten)">
    Op WSL2 met NVIDIA/CUDA maakt het officiële Linux-installatieprogramma van Ollama een systemd-eenheid `ollama.service` met `Restart=always`. Als die service automatisch start en tijdens het opstarten van WSL2 een GPU-ondersteund model laadt, kan Ollama tijdens het laden hostgeheugen vastzetten; de geheugenterugwinning van Hyper-V kan die pagina's niet altijd terugwinnen, waardoor Windows de WSL2-VM kan beëindigen, systemd Ollama opnieuw start en de lus zich herhaalt.

    Aanwijzingen: WSL2 wordt herhaaldelijk opnieuw gestart of beëindigd, hoog CPU-gebruik in `app.slice` of `ollama.service` direct na het starten van WSL2 en SIGTERM van systemd in plaats van de Linux OOM-killer.

    OpenClaw registreert tijdens het opstarten een waarschuwing wanneer het WSL2 detecteert, `ollama.service` is ingeschakeld met `Restart=always` en CUDA-markeringen zichtbaar zijn.

    Oplossing:

    ```bash
    sudo systemctl disable ollama
    ```

    Voeg aan de Windows-zijde het volgende toe aan `%USERPROFILE%\.wslconfig` en voer daarna `wsl --shutdown` uit:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Of verkort de keep-alive-duur/start Ollama alleen handmatig wanneer dat nodig is:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Zie [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama wordt niet gedetecteerd">
    Controleer of Ollama actief is, `OLLAMA_API_KEY` (of een authenticatieprofiel) is ingesteld en `models.providers.ollama` **niet** expliciet is gedefinieerd:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Geen modellen beschikbaar">
    Haal het model lokaal op of definieer het expliciet in `models.providers.ollama`:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Verbinding geweigerd">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Externe host werkt met curl, maar niet met OpenClaw">
    Controleer dit vanaf dezelfde machine en runtime waarop de Gateway wordt uitgevoerd:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Veelvoorkomende oorzaken:

    - `baseUrl` verwijst naar `localhost`, maar de Gateway wordt uitgevoerd in Docker of op een andere host.
    - De URL gebruikt `/v1`, waardoor OpenAI-compatibel gedrag wordt geselecteerd in plaats van native Ollama.
    - De externe host vereist wijzigingen aan de firewall of LAN-binding.
    - Het model bevindt zich in de daemon op uw laptop, maar niet in de externe daemon.

  </Accordion>

  <Accordion title="Model geeft tool-JSON als tekst weer">
    Gewoonlijk bevindt de provider zich in de OpenAI-compatibele modus of kan het model niet met toolschema's omgaan. Geef de voorkeur aan de native modus:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Als een klein lokaal model nog steeds niet met toolschema's werkt, stel dan `compat.supportsTools: false` in voor die modelvermelding en test opnieuw.

  </Accordion>

  <Accordion title="Kimi of GLM retourneert onleesbare symbolen">
    Gehoste Kimi-/GLM-antwoorden die uit lange reeksen niet-taalkundige symbolen bestaan, worden behandeld als een mislukte provideraanroep in plaats van een geslaagd antwoord. Daardoor wordt de normale verwerking voor opnieuw proberen, terugvallen en fouten toegepast, in plaats van beschadigde tekst in de sessie op te slaan.

    Als dit opnieuw gebeurt, leg dan de modelnaam, het huidige sessiebestand en vast of de uitvoering `Cloud + Local` of `Cloud only` gebruikte. Probeer vervolgens een nieuwe sessie en een terugvalmodel:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Koud lokaal model krijgt een time-out">
    Grote lokale modellen kunnen bij de eerste keer laden veel tijd nodig hebben. Beperk de time-out tot de Ollama-provider en houd het model desgewenst tussen beurten geladen:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Als de host zelf langzaam verbindingen accepteert, verlengt `timeoutSeconds` ook de beveiligde verbindingstime-out voor deze provider.

  </Accordion>

  <Accordion title="Model met grote context is te traag of heeft onvoldoende geheugen">
    Veel modellen geven grotere contexten op dan uw hardware probleemloos kan uitvoeren. Native Ollama gebruikt zijn eigen standaardwaarde voor de runtime, tenzij `params.num_ctx` is ingesteld. Beperk zowel het budget van OpenClaw als de verzoekcontext van Ollama voor een voorspelbare latentie tot het eerste token:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Verlaag `contextWindow` als OpenClaw te veel promptinhoud verzendt. Verlaag `params.num_ctx` als de runtimecontext van Ollama te groot is voor de machine. Verlaag `maxTokens` als het genereren te lang duurt.

  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Problemen oplossen](/nl/help/troubleshooting) en [Veelgestelde vragen](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/nl/providers/ollama-cloud" icon="cloud">
    Configuratie uitsluitend voor de cloud met de specifieke `ollama-cloud`-provider.
  </Card>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelverwijzingen en failovergedrag.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/models" icon="brain">
    Modellen kiezen en configureren.
  </Card>
  <Card title="Ollama-zoekopdrachten op internet" href="/nl/tools/ollama-search" icon="magnifying-glass">
    Volledige configuratie- en gedragsdetails voor door Ollama aangedreven zoekopdrachten op internet.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
</CardGroup>
