---
read_when:
    - Je wilt OpenClaw uitvoeren met cloud- of lokale modellen via Ollama
    - Je hebt hulp nodig bij het instellen en configureren van Ollama
    - Je wilt Ollama-visionmodellen voor beeldbegrip
summary: Voer OpenClaw uit met Ollama (cloud- en lokale modellen)
title: Ollama
x-i18n:
    generated_at: "2026-06-27T18:13:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw integreert met Ollama's native API (`/api/chat`) voor gehoste cloudmodellen en lokale/zelfgehoste Ollama-servers. Je kunt Ollama in drie modi gebruiken: `Cloud + Local` via een bereikbare Ollama-host, `Cloud only` tegen `https://ollama.com`, of `Local only` tegen een bereikbare Ollama-host.

OpenClaw registreert ook `ollama-cloud` als een eersteklas gehoste provider-id voor
direct gebruik van Ollama Cloud. Gebruik referenties zoals `ollama-cloud/kimi-k2.5:cloud` wanneer je
cloud-only routering wilt zonder de lokale `ollama` provider-id te delen.

Zie [Ollama Cloud](/nl/providers/ollama-cloud) voor de speciale installatiepagina voor alleen cloud.

<Warning>
**Gebruikers van externe Ollama**: Gebruik de `/v1` OpenAI-compatibele URL (`http://host:11434/v1`) niet met OpenClaw. Dit breekt toolaanroepen en modellen kunnen ruwe tool-JSON als platte tekst uitvoeren. Gebruik in plaats daarvan de native Ollama API-URL: `baseUrl: "http://host:11434"` (geen `/v1`).
</Warning>

Ollama-providerconfiguratie gebruikt `baseUrl` als canonieke sleutel. OpenClaw accepteert ook `baseURL` voor compatibiliteit met voorbeelden in OpenAI SDK-stijl, maar nieuwe configuratie moet bij voorkeur `baseUrl` gebruiken.

## Auth-regels

<AccordionGroup>
  <Accordion title="Lokale en LAN-hosts">
    Lokale en LAN-Ollama-hosts hebben geen echt bearer-token nodig. OpenClaw gebruikt de lokale `ollama-local` marker alleen voor loopback-, privénetwerk-, `.local`- en bare-hostname Ollama-basis-URL's.
  </Accordion>
  <Accordion title="Externe en Ollama Cloud-hosts">
    Externe openbare hosts en Ollama Cloud (`https://ollama.com`) vereisen een echte referentie via `OLLAMA_API_KEY`, een auth-profiel of de `apiKey` van de provider. Gebruik voor direct gehost gebruik bij voorkeur provider `ollama-cloud`.
  </Accordion>
  <Accordion title="Aangepaste provider-id's">
    Aangepaste provider-id's die `api: "ollama"` instellen, volgen dezelfde regels. Een `ollama-remote` provider die bijvoorbeeld naar een private LAN-Ollama-host verwijst, kan `apiKey: "ollama-local"` gebruiken, en subagenten lossen die marker op via de Ollama-providerhook in plaats van deze als ontbrekende referentie te behandelen. Geheugenzoekopdrachten kunnen ook `agents.defaults.memorySearch.provider` instellen op die aangepaste provider-id, zodat embeddings het overeenkomende Ollama-eindpunt gebruiken.
  </Accordion>
  <Accordion title="Auth-profielen">
    `auth-profiles.json` slaat de referentie voor een provider-id op. Zet eindpuntinstellingen (`baseUrl`, `api`, model-id's, headers, time-outs) in `models.providers.<id>`. Oudere platte auth-profielbestanden zoals `{ "ollama-windows": { "apiKey": "ollama-local" } }` zijn geen runtime-indeling; voer `openclaw doctor --fix` uit om ze met een back-up te herschrijven naar het canonieke `ollama-windows:default` API-sleutelprofiel. `baseUrl` in dat bestand is compatibiliteitsruis en moet naar providerconfiguratie worden verplaatst.
  </Accordion>
  <Accordion title="Bereik van geheugen-embeddings">
    Wanneer Ollama wordt gebruikt voor geheugen-embeddings, is bearer-auth beperkt tot de host waarop deze is gedeclareerd:

    - Een sleutel op providerniveau wordt alleen naar de Ollama-host van die provider verzonden.
    - `agents.*.memorySearch.remote.apiKey` wordt alleen naar de externe embeddinghost verzonden.
    - Een pure `OLLAMA_API_KEY` env-waarde wordt behandeld als de Ollama Cloud-conventie en standaard niet naar lokale of zelfgehoste hosts verzonden.

  </Accordion>
</AccordionGroup>

## Aan de slag

Kies je gewenste installatiemethode en modus.

<Tabs>
  <Tab title="Onboarding (aanbevolen)">
    **Beste voor:** de snelste weg naar een werkende Ollama-cloud- of lokale installatie.

    <Steps>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard
        ```

        Selecteer **Ollama** uit de providerlijst.
      </Step>
      <Step title="Kies je modus">
        - **Cloud + Local** — lokale Ollama-host plus cloudmodellen die via die host worden gerouteerd
        - **Cloud only** — gehoste Ollama-modellen via `https://ollama.com`
        - **Local only** — alleen lokale modellen

      </Step>
      <Step title="Selecteer een model">
        `Cloud only` vraagt om `OLLAMA_API_KEY` en stelt gehoste cloudstandaarden voor. `Cloud + Local` en `Local only` vragen om een Ollama-basis-URL, ontdekken beschikbare modellen en trekken het geselecteerde lokale model automatisch binnen als het nog niet beschikbaar is. Wanneer Ollama een geïnstalleerde `:latest` tag zoals `gemma4:latest` meldt, toont de installatie dat geïnstalleerde model één keer in plaats van zowel `gemma4` als `gemma4:latest` te tonen of de kale alias opnieuw binnen te trekken. `Cloud + Local` controleert ook of die Ollama-host is aangemeld voor cloudtoegang.
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Niet-interactieve modus

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Geef optioneel een aangepaste basis-URL of model op:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Handmatige installatie">
    **Beste voor:** volledige controle over cloud- of lokale installatie.

    <Steps>
      <Step title="Kies cloud of lokaal">
        - **Cloud + Local**: installeer Ollama, meld je aan met `ollama signin` en routeer cloudverzoeken via die host
        - **Cloud only**: gebruik `https://ollama.com` met een `OLLAMA_API_KEY`
        - **Local only**: installeer Ollama vanaf [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Een lokaal model ophalen (alleen lokaal)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Ollama inschakelen voor OpenClaw">
        Gebruik voor `Cloud only` je echte `OLLAMA_API_KEY`. Voor host-ondersteunde installaties werkt elke tijdelijke waarde:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspecteer en stel je model in">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Of stel de standaard in configuratie in:

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

## Cloudmodellen

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` gebruikt een bereikbare Ollama-host als controlepunt voor zowel lokale als cloudmodellen. Dit is Ollama's voorkeursflow voor hybride gebruik.

    Gebruik **Cloud + Local** tijdens de installatie. OpenClaw vraagt om de Ollama-basis-URL, ontdekt lokale modellen van die host en controleert of de host is aangemeld voor cloudtoegang met `ollama signin`. Wanneer de host is aangemeld, stelt OpenClaw ook gehoste cloudstandaarden voor, zoals `kimi-k2.5:cloud`, `minimax-m2.7:cloud` en `glm-5.1:cloud`.

    Als de host nog niet is aangemeld, houdt OpenClaw de installatie local-only totdat je `ollama signin` uitvoert.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` draait tegen Ollama's gehoste API op `https://ollama.com`.

    Gebruik **Cloud only** tijdens de installatie. OpenClaw vraagt om `OLLAMA_API_KEY`, stelt `baseUrl: "https://ollama.com"` in en vult de lijst met gehoste cloudmodellen vooraf. Dit pad vereist **geen** lokale Ollama-server of `ollama signin`.

    De cloudmodellenlijst die tijdens `openclaw onboard` wordt getoond, wordt live gevuld vanuit `https://ollama.com/api/tags`, met een limiet van 500 vermeldingen, zodat de picker de huidige gehoste catalogus weerspiegelt in plaats van een statische seed. Als `ollama.com` onbereikbaar is of tijdens de installatie geen modellen retourneert, valt OpenClaw terug op de vorige hardcoded suggesties zodat onboarding toch wordt voltooid.

    Je kunt de eersteklas cloudprovider ook direct configureren:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    In local-only modus ontdekt OpenClaw modellen van de geconfigureerde Ollama-instantie. Dit pad is bedoeld voor lokale of zelfgehoste Ollama-servers.

    OpenClaw stelt momenteel `gemma4` voor als lokale standaard.

  </Tab>
</Tabs>

## Modeldetectie (impliciete provider)

Wanneer je `OLLAMA_API_KEY` (of een auth-profiel) instelt en **geen** `models.providers.ollama` of een andere aangepaste externe provider met `api: "ollama"` definieert, ontdekt OpenClaw modellen van de lokale Ollama-instantie op `http://127.0.0.1:11434`.

| Gedrag              | Detail                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalogusquery      | Queryt `/api/tags`                                                                                                                                                   |
| Detectie van mogelijkheden | Gebruikt best-effort `/api/show` lookups om `contextWindow`, uitgebreide `num_ctx` Modelfile-parameters en mogelijkheden inclusief vision/tools te lezen                       |
| Vision-modellen     | Modellen met een `vision` mogelijkheid die door `/api/show` wordt gerapporteerd, worden gemarkeerd als afbeeldingsgeschikt (`input: ["text", "image"]`), zodat OpenClaw automatisch afbeeldingen in de prompt injecteert  |
| Reasoning-detectie  | Gebruikt `/api/show` mogelijkheden wanneer beschikbaar, inclusief `thinking`; valt terug op een heuristiek op basis van modelnaam (`r1`, `reasoning`, `think`) wanneer Ollama mogelijkheden weglaat |
| Tokenlimieten       | Stelt `maxTokens` in op de standaard Ollama max-tokenlimiet die door OpenClaw wordt gebruikt                                                                                                |
| Kosten              | Stelt alle kosten in op `0`                                                                                                                                                |

Dit voorkomt handmatige modelvermeldingen terwijl de catalogus afgestemd blijft op de lokale Ollama-instantie. Je kunt een volledige referentie gebruiken, zoals `ollama/<pulled-model>:latest`, in lokale `infer model run`; OpenClaw lost dat geïnstalleerde model op vanuit Ollama's live catalogus zonder dat een handgeschreven `models.json`-vermelding nodig is.

Voor aangemelde Ollama-hosts kunnen sommige `:cloud` modellen bruikbaar zijn via `/api/chat`
en `/api/show` voordat ze in `/api/tags` verschijnen. Wanneer je expliciet een
volledige `ollama/<model>:cloud` referentie selecteert, valideert OpenClaw dat exacte ontbrekende model met
`/api/show` en voegt het alleen toe aan de runtimecatalogus als Ollama modelmetadata
bevestigt. Typfouten blijven falen als onbekende modellen in plaats van automatisch te worden aangemaakt.

```bash
# See what models are available
ollama list
openclaw models list
```

Voor een smalle rooktest voor tekstgeneratie die het volledige agent-toolsurface vermijdt,
gebruik je lokale `infer model run` met een volledige Ollama-modelreferentie:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Dat pad gebruikt nog steeds OpenClaw's geconfigureerde provider, auth en native Ollama-
transport, maar start geen chat-agent-turn en laadt geen MCP/toolcontext. Als
dit slaagt terwijl normale agentantwoorden falen, los dan vervolgens problemen op met de agent-
prompt-/toolcapaciteit van het model.

Voor een smalle rooktest voor vision-modellen op hetzelfde slanke pad voeg je een of meer
afbeeldingsbestanden toe aan `infer model run`. Dit verzendt de prompt en afbeelding rechtstreeks naar
het geselecteerde Ollama-vision-model zonder chattools, geheugen of eerdere
sessiecontext te laden:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` accepteert bestanden die als `image/*` worden herkend, waaronder gangbare PNG-,
JPEG- en WebP-invoer. Niet-afbeeldingsbestanden worden geweigerd voordat Ollama wordt aangeroepen.
Gebruik voor spraakherkenning in plaats daarvan `openclaw infer audio transcribe`.

Wanneer je een gesprek met `/model ollama/<model>` omschakelt, behandelt OpenClaw
dat als een exacte gebruikersselectie. Als de geconfigureerde Ollama `baseUrl`
onbereikbaar is, mislukt het volgende antwoord met de providerfout in plaats van stilzwijgend
te antwoorden vanuit een ander geconfigureerd fallbackmodel.

Geisoleerde cronjobs voeren een extra lokale veiligheidscontrole uit voordat ze de agentbeurt
starten. Als het geselecteerde model wordt omgezet naar een lokale, prive-netwerk- of `.local`-
Ollama-provider en `/api/tags` onbereikbaar is, registreert OpenClaw die cronrun
als `skipped` met de geselecteerde `ollama/<model>` in de fouttekst. De endpoint-
preflight wordt 5 minuten gecachet, zodat meerdere cronjobs die naar dezelfde
gestopte Ollama-daemon wijzen niet allemaal mislukte modelverzoeken starten.

Controleer live het lokale tekstpad, het native streampad en embeddings tegen
lokale Ollama met:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Voor rooktests met Ollama Cloud API-sleutels wijs je de livetest naar `https://ollama.com`
en kies je een gehost model uit de huidige catalogus:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

De cloud-rooktest voert tekst, native stream en webzoekopdrachten uit. Embeddings worden
standaard overgeslagen voor `https://ollama.com`, omdat Ollama Cloud API-sleutels mogelijk geen toegang geven tot
`/api/embed`. Stel `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` in wanneer je expliciet wilt
dat de livetest mislukt als de geconfigureerde cloudsleutel het embed-endpoint niet kan gebruiken.

Om een nieuw model toe te voegen, haal je het simpelweg op met Ollama:

```bash
ollama pull mistral
```

Het nieuwe model wordt automatisch ontdekt en beschikbaar voor gebruik.

<Note>
Als je `models.providers.ollama` expliciet instelt, of een aangepaste externe provider configureert zoals `models.providers.ollama-cloud` met `api: "ollama"`, wordt automatische ontdekking overgeslagen en moet je modellen handmatig definieren. Aangepaste loopbackproviders zoals `http://127.0.0.2:11434` worden nog steeds als lokaal behandeld. Zie de sectie over expliciete configuratie hieronder.
</Note>

## Vision en afbeeldingsbeschrijving

De gebundelde Ollama-Plugin registreert Ollama als een media-understandingprovider met afbeeldingsmogelijkheden. Hiermee kan OpenClaw expliciete afbeeldingsbeschrijvingsverzoeken en geconfigureerde standaardwaarden voor afbeeldingsmodellen routeren via lokale of gehoste Ollama-visionmodellen.

Voor lokale vision haal je een model op dat afbeeldingen ondersteunt:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Controleer daarna met de infer-CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` moet een volledige `<provider/model>`-verwijzing zijn. Wanneer deze is ingesteld, voert `openclaw infer image describe` dat model rechtstreeks uit in plaats van de beschrijving over te slaan omdat het model native vision ondersteunt.

Gebruik `infer image describe` wanneer je OpenClaw's afbeeldingsbegrip-providerflow, geconfigureerde `agents.defaults.imageModel` en uitvoervorm voor afbeeldingsbeschrijvingen wilt. Gebruik `infer model run --file` wanneer je een ruwe multimodale modelprobe wilt met een aangepaste prompt en een of meer afbeeldingen.

Om Ollama het standaardmodel voor afbeeldingsbegrip voor binnenkomende media te maken, configureer je `agents.defaults.imageModel`:

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

Geef de voorkeur aan de volledige `ollama/<model>`-verwijzing. Als hetzelfde model onder `models.providers.ollama.models` staat met `input: ["text", "image"]` en geen andere geconfigureerde afbeeldingsprovider die kale model-ID aanbiedt, normaliseert OpenClaw ook een kale `imageModel`-verwijzing zoals `qwen2.5vl:7b` naar `ollama/qwen2.5vl:7b`. Als meer dan een geconfigureerde afbeeldingsprovider dezelfde kale ID heeft, gebruik dan expliciet het providerprefix.

Langzame lokale visionmodellen kunnen een langere time-out voor afbeeldingsbegrip nodig hebben dan cloudmodellen. Ze kunnen ook crashen of stoppen wanneer Ollama probeert de volledige geadverteerde vision-context toe te wijzen op beperkte hardware. Stel een capability-time-out in en beperk `num_ctx` op de modelvermelding wanneer je alleen een normale beurt voor afbeeldingsbeschrijving nodig hebt:

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

Deze time-out geldt voor inkomend afbeeldingsbegrip en voor de expliciete `image`-tool die de agent tijdens een beurt kan aanroepen. `models.providers.ollama.timeoutSeconds` op providerniveau blijft de onderliggende Ollama HTTP-verzoekbewaking voor normale modelaanroepen regelen.

Controleer live de expliciete afbeeldingstool tegen lokale Ollama met:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Als je `models.providers.ollama.models` handmatig definieert, markeer visionmodellen dan met ondersteuning voor afbeeldingsinvoer:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw weigert afbeeldingsbeschrijvingsverzoeken voor modellen die niet als afbeeldingsgeschikt zijn gemarkeerd. Bij impliciete ontdekking leest OpenClaw dit uit Ollama wanneer `/api/show` een vision-capability rapporteert.

## Configuratie

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Het eenvoudigste activeringspad voor alleen lokaal gebruik loopt via een omgevingsvariabele:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Als `OLLAMA_API_KEY` is ingesteld, kun je `apiKey` in de providervermelding weglaten en vult OpenClaw deze in voor beschikbaarheidscontroles.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Gebruik expliciete configuratie wanneer je een gehoste cloudopstelling wilt, Ollama op een andere host/poort draait, je specifieke contextvensters of modellijsten wilt afdwingen, of je volledig handmatige modeldefinities wilt.

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

  <Tab title="Custom base URL">
    Als Ollama op een andere host of poort draait (expliciete configuratie schakelt automatische ontdekking uit, dus definieer modellen handmatig):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Voeg geen `/v1` toe aan de URL. Het `/v1`-pad gebruikt OpenAI-compatibele modus, waarin toolaanroepen niet betrouwbaar zijn. Gebruik de basis-URL van Ollama zonder padsuffix.
    </Warning>

  </Tab>
</Tabs>

## Veelgebruikte recepten

Gebruik deze als startpunt en vervang model-ID's door de exacte namen uit `ollama list` of `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Gebruik dit wanneer Ollama op dezelfde machine draait als de Gateway en je wilt dat OpenClaw de geinstalleerde modellen automatisch ontdekt.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Dit pad houdt de configuratie minimaal. Voeg geen `models.providers.ollama`-blok toe tenzij je modellen handmatig wilt definieren.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    Gebruik native Ollama-URL's voor LAN-hosts. Voeg geen `/v1` toe.

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

    `contextWindow` is het contextbudget aan OpenClaw-zijde. `params.num_ctx` wordt voor het verzoek naar Ollama gestuurd. Houd ze op elkaar afgestemd wanneer je hardware de volledige geadverteerde context van het model niet kan uitvoeren.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Gebruik dit wanneer je geen lokale daemon draait en gehoste Ollama-modellen rechtstreeks wilt gebruiken.

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

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    Gebruik dit wanneer een lokale of LAN-Ollama-daemon is aangemeld met `ollama signin` en zowel lokale modellen als `:cloud`-modellen moet bedienen.

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
    Gebruik aangepaste provider-ID's wanneer je meer dan een Ollama-server hebt. Elke provider krijgt zijn eigen host, modellen, authenticatie, time-out en modelverwijzingen.

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

    Wanneer OpenClaw de aanvraag verzendt, wordt het actieve providerprefix verwijderd, zodat `ollama-large/qwen3.5:27b` Ollama bereikt als `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Sommige lokale modellen kunnen eenvoudige prompts beantwoorden, maar hebben moeite met het volledige agent-tooloppervlak. Begin met het beperken van tools en context voordat je globale runtime-instellingen wijzigt.

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

    Gebruik `compat.supportsTools: false` alleen wanneer het model of de server betrouwbaar faalt op toolschema's. Dit ruilt agent-capaciteit in voor stabiliteit.
    `localModelLean` verwijdert de browser-, Cron- en berichttools uit het directe agent-oppervlak en plaatst grotere catalogi standaard achter gestructureerde Tool Search-bedieningselementen, behalve wanneer een run directe semantiek voor berichtbezorging moet behouden, maar het verandert de runtimecontext of denkmodus van Ollama niet. Combineer dit met expliciete `params.num_ctx` en `params.thinking: false` voor kleine Qwen-achtige denkmodellen die in een lus terechtkomen of hun responsbudget besteden aan verborgen redenering.

  </Accordion>
</AccordionGroup>

### Modelselectie

Na configuratie zijn al je Ollama-modellen beschikbaar:

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

Aangepaste Ollama-provider-id's worden ook ondersteund. Wanneer een modelverwijzing het actieve
providerprefix gebruikt, zoals `ollama-spark/qwen3:32b`, verwijdert OpenClaw alleen dat
prefix voordat Ollama wordt aangeroepen, zodat de server `qwen3:32b` ontvangt.

Voor trage lokale modellen geef je de voorkeur aan providergerichte aanvraagafstemming voordat je de
timeout van de hele agent-runtime verhoogt:

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

`timeoutSeconds` is van toepassing op het HTTP-verzoek aan het model, inclusief het opzetten van de verbinding,
headers, body-streaming en de totale bewaakte fetch-afbreking. `params.keep_alive`
wordt doorgestuurd naar Ollama als top-level `keep_alive` bij native `/api/chat`-verzoeken;
stel dit per model in wanneer de laadtijd van de eerste beurt het knelpunt is.

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

Vervang voor externe hosts `127.0.0.1` door de host die in `baseUrl` wordt gebruikt. Als `curl` werkt maar OpenClaw niet, controleer dan of de Gateway op een andere machine, container of serviceaccount draait.

## Ollama Web Search

OpenClaw ondersteunt **Ollama Web Search** als een gebundelde `web_search`-provider.

| Eigenschap  | Detail                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Host        | Gebruikt je geconfigureerde Ollama-host (`models.providers.ollama.baseUrl` wanneer ingesteld, anders `http://127.0.0.1:11434`); `https://ollama.com` gebruikt de gehoste API rechtstreeks             |
| Auth        | Zonder sleutel voor aangemelde lokale Ollama-hosts; `OLLAMA_API_KEY` of geconfigureerde provider-auth voor rechtstreeks zoeken via `https://ollama.com` of hosts die door auth zijn beschermd           |
| Vereiste    | Lokale/zelfgehoste hosts moeten actief zijn en zijn aangemeld met `ollama signin`; rechtstreeks gehost zoeken vereist `baseUrl: "https://ollama.com"` plus een echte Ollama API-sleutel                 |

Kies **Ollama Web Search** tijdens `openclaw onboard` of `openclaw configure --section web`, of stel in:

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

Voor een aangemelde lokale daemon gebruikt OpenClaw de `/api/experimental/web_search`-proxy van de daemon. Voor `https://ollama.com` roept het rechtstreeks het gehoste `/api/web_search`-endpoint aan.

  <Note>
  Zie [Ollama Web Search](/nl/tools/ollama-search) voor de volledige installatie- en gedragsdetails.
  </Note>

  ## Geavanceerde configuratie

  <AccordionGroup>
  <Accordion title="Legacy OpenAI-compatibele modus">
    <Warning>
    **Toolaanroepen zijn niet betrouwbaar in OpenAI-compatibele modus.** Gebruik deze modus alleen als je de OpenAI-indeling nodig hebt voor een proxy en niet afhankelijk bent van native gedrag voor toolaanroepen.
    </Warning>

    Als je in plaats daarvan het OpenAI-compatibele eindpunt moet gebruiken (bijvoorbeeld achter een proxy die alleen de OpenAI-indeling ondersteunt), stel dan expliciet `api: "openai-completions"` in:

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

    Deze modus ondersteunt mogelijk niet tegelijk streaming en toolaanroepen. Mogelijk moet je streaming uitschakelen met `params: { streaming: false }` in de modelconfiguratie.

    Wanneer `api: "openai-completions"` met Ollama wordt gebruikt, injecteert OpenClaw standaard `options.num_ctx`, zodat Ollama niet stilzwijgend terugvalt op een contextvenster van 4096. Als je proxy/upstream onbekende `options`-velden weigert, schakel dit gedrag dan uit:

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

  <Accordion title="Contextvensters">
    Voor automatisch ontdekte modellen gebruikt OpenClaw het contextvenster dat door Ollama wordt gerapporteerd wanneer dat beschikbaar is, inclusief grotere `PARAMETER num_ctx`-waarden uit aangepaste Modelfiles. Anders valt het terug op het standaard Ollama-contextvenster dat door OpenClaw wordt gebruikt.

    Je kunt standaardwaarden op providerniveau instellen voor `contextWindow`, `contextTokens` en `maxTokens` voor elk model onder die Ollama-provider, en ze vervolgens per model overschrijven wanneer dat nodig is. `contextWindow` is het prompt- en Compaction-budget van OpenClaw. Native Ollama-verzoeken laten `options.num_ctx` oningesteld tenzij je expliciet `params.num_ctx` configureert, zodat Ollama zijn eigen model-, `OLLAMA_CONTEXT_LENGTH`- of VRAM-gebaseerde standaard kan toepassen. Stel `params.num_ctx` in om de runtimecontext per verzoek van Ollama te begrenzen of af te dwingen zonder een Modelfile opnieuw te bouwen; ongeldige, nul-, negatieve en niet-eindige waarden worden genegeerd. Als je een oudere configuratie hebt geüpgraded die alleen `contextWindow` of `maxTokens` gebruikte om een native Ollama-verzoekcontext af te dwingen, voer dan `openclaw doctor --fix` uit om die expliciete provider- of modelbudgetten naar `params.num_ctx` te kopiëren. De OpenAI-compatibele Ollama-adapter injecteert nog steeds standaard `options.num_ctx` vanuit de geconfigureerde `params.num_ctx` of `contextWindow`; schakel dat uit met `injectNumCtxForOpenAICompat: false` als je upstream `options` weigert.

    Native Ollama-modelvermeldingen accepteren ook de algemene Ollama-runtimeopties onder `params`, waaronder `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` en `use_mmap`. OpenClaw stuurt alleen Ollama-verzoeksleutels door, zodat OpenClaw-runtimeparameters zoals `streaming` niet naar Ollama lekken. Gebruik `params.think` of `params.thinking` om top-level Ollama `think` te verzenden; `false` schakelt denken op API-niveau uit voor Qwen-achtige denkmodellen.

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

    Per-model `agents.defaults.models["ollama/<model>"].params.num_ctx` werkt ook. Als beide zijn geconfigureerd, wint de expliciete providermodelvermelding van de agentstandaard.

  </Accordion>

  <Accordion title="Denkbesturing">
    Voor native Ollama-modellen stuurt OpenClaw denkbesturing door zoals Ollama die verwacht: top-level `think`, niet `options.think`. Automatisch ontdekte modellen waarvan de `/api/show`-respons de `thinking`-capability bevat, tonen `/think low`, `/think medium`, `/think high` en `/think max`; niet-denkende modellen tonen alleen `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Je kunt ook een modelstandaard instellen:

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

    Per-model `params.think` of `params.thinking` kan Ollama API-denken uitschakelen of afdwingen voor een specifiek geconfigureerd model. OpenClaw behoudt die expliciete modelparameters wanneer de actieve run alleen de impliciete standaard `off` heeft; runtimecommando's die niet off zijn, zoals `/think medium`, overschrijven nog steeds de actieve run.

  </Accordion>

  <Accordion title="Redeneermodellen">
    OpenClaw behandelt modellen met namen zoals `deepseek-r1`, `reasoning` of `think` standaard als redeneercapabel.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Er is geen aanvullende configuratie nodig. OpenClaw markeert ze automatisch.

  </Accordion>

  <Accordion title="Modelkosten">
    Ollama is gratis en draait lokaal, dus alle modelkosten zijn ingesteld op $0. Dit geldt voor zowel automatisch ontdekte als handmatig gedefinieerde modellen.
  </Accordion>

  <Accordion title="Memory embeddings">
    De meegeleverde Ollama-plugin registreert een provider voor geheugenembeddings voor
    [geheugenzoekopdrachten](/nl/concepts/memory). Deze gebruikt de geconfigureerde Ollama-basis-URL
    en API-sleutel, roept Ollama's huidige `/api/embed`-endpoint aan, en bundelt
    meerdere geheugenfragmenten waar mogelijk in één `input`-request.

    Wanneer `proxy.enabled=true`, gebruiken Ollama-geheugenembeddingrequests naar de exacte
    host-local loopback-origin die is afgeleid van de geconfigureerde `baseUrl`
    het bewaakte directe pad van OpenClaw in plaats van de beheerde doorstuurproxy. De
    geconfigureerde hostnaam moet zelf `localhost` of een letterlijk loopback-IP-adres zijn;
    DNS-namen die alleen naar loopback resolveren, gebruiken nog steeds het beheerde proxypad.
    LAN-, tailnet-, privé-netwerk- en openbare Ollama-hosts blijven ook op het
    beheerde proxypad. Omleidingen naar een andere host of poort erven geen vertrouwen.
    Operators kunnen nog steeds de globale instelling `proxy.loopbackMode: "proxy"` instellen om
    loopbackverkeer via de proxy te sturen, of `proxy.loopbackMode: "block"`
    om loopbackverbindingen te weigeren voordat een verbinding wordt geopend; zie
    [Beheerde proxy](/nl/security/network-proxy#gateway-loopback-mode) voor het
    procesbrede effect van deze instelling.

    | Eigenschap    | Waarde              |
    | ------------- | ------------------- |
    | Standaardmodel | `nomic-embed-text` |
    | Automatisch ophalen | Ja — het embeddingmodel wordt automatisch opgehaald als het lokaal niet aanwezig is |

    Embeddings tijdens queries gebruiken retrievalvoorvoegsels voor modellen die deze vereisen of aanbevelen, waaronder `nomic-embed-text`, `qwen3-embedding` en `mxbai-embed-large`. Geheugendocumentbatches blijven ongewijzigd, zodat bestaande indexen geen formaatmigratie nodig hebben.

    Om Ollama te selecteren als embeddingprovider voor geheugenzoekopdrachten:

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

    Houd authenticatie voor een externe embeddinghost beperkt tot die host:

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

  <Accordion title="Streaming configuration">
    De Ollama-integratie van OpenClaw gebruikt standaard de **native Ollama-API** (`/api/chat`), die streaming en tool calling tegelijk volledig ondersteunt. Er is geen speciale configuratie nodig.

    Voor native `/api/chat`-requests geeft OpenClaw denkbesturing ook rechtstreeks door aan Ollama: `/think off` en `openclaw agent --thinking off` sturen `think: false` op topniveau, tenzij er een expliciete modelwaarde `params.think`/`params.thinking` is geconfigureerd, terwijl `/think low|medium|high` de bijbehorende inspanningsreeks voor `think` op topniveau sturen. `/think max` wordt gekoppeld aan Ollama's hoogste native inspanning, `think: "high"`.

    <Tip>
    Als je het OpenAI-compatibele endpoint moet gebruiken, zie dan de sectie "Legacy OpenAI-compatible mode" hierboven. Streaming en tool calling werken in die modus mogelijk niet tegelijk.
    </Tip>

  </Accordion>
</AccordionGroup>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    Op WSL2 met NVIDIA/CUDA maakt het officiële Ollama Linux-installatieprogramma een `ollama.service` systemd-unit met `Restart=always`. Als die service automatisch start en tijdens het opstarten van WSL2 een GPU-ondersteund model laadt, kan Ollama hostgeheugen vasthouden terwijl het model wordt geladen. Hyper-V-geheugenterugwinning kan die vastgezette pagina's niet altijd terugwinnen, waardoor Windows de WSL2-VM kan beëindigen, systemd Ollama opnieuw start, en de lus zich herhaalt.

    Veelvoorkomend bewijs:

    - herhaalde WSL2-herstarts of beëindigingen vanaf de Windows-kant
    - hoge CPU in `app.slice` of `ollama.service` kort na het starten van WSL2
    - SIGTERM van systemd in plaats van een Linux OOM-killergebeurtenis

    OpenClaw logt een opstartwaarschuwing wanneer het WSL2 detecteert, `ollama.service` is ingeschakeld met `Restart=always`, en zichtbare CUDA-markeringen aanwezig zijn.

    Mitigatie:

    ```bash
    sudo systemctl disable ollama
    ```

    Voeg dit aan de Windows-kant toe aan `%USERPROFILE%\.wslconfig` en voer daarna `wsl --shutdown` uit:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Stel een kortere keep-alive in de Ollama-serviceomgeving in, of start Ollama alleen handmatig wanneer je het nodig hebt:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Zie [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama not detected">
    Zorg dat Ollama draait, dat je `OLLAMA_API_KEY` hebt ingesteld (of een auth-profiel), en dat je **geen** expliciete `models.providers.ollama`-vermelding hebt gedefinieerd:

    ```bash
    ollama serve
    ```

    Controleer of de API toegankelijk is:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    Als je model niet wordt vermeld, haal het model dan lokaal op of definieer het expliciet in `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    Controleer of Ollama op de juiste poort draait:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host works with curl but not OpenClaw">
    Controleer dit vanaf dezelfde machine en runtime waarop de Gateway draait:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Veelvoorkomende oorzaken:

    - `baseUrl` wijst naar `localhost`, maar de Gateway draait in Docker of op een andere host.
    - De URL gebruikt `/v1`, waardoor OpenAI-compatibel gedrag wordt geselecteerd in plaats van native Ollama.
    - De externe host heeft firewall- of LAN-bindingswijzigingen nodig aan de Ollama-kant.
    - Het model is aanwezig op de daemon van je laptop, maar niet op de externe daemon.

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    Dit betekent meestal dat de provider de OpenAI-compatibele modus gebruikt of dat het model geen toolschema's kan verwerken.

    Geef de voorkeur aan native Ollama-modus:

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

    Als een klein lokaal model nog steeds faalt op toolschema's, stel dan `compat.supportsTools: false` in voor die modelvermelding en test opnieuw.

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    Gehoste Kimi/GLM-antwoorden die lang zijn en bestaan uit niet-talige symboolreeksen, worden behandeld als mislukte provideroutput in plaats van als een succesvol assistentantwoord. Daardoor kunnen normale retry-, fallback- of foutafhandeling het overnemen zonder de beschadigde tekst in de sessie op te slaan.

    Als dit herhaaldelijk gebeurt, leg dan de ruwe modelnaam vast, het huidige sessiebestand, en of de run `Cloud + Local` of `Cloud only` gebruikte. Probeer daarna een nieuwe sessie en een fallbackmodel:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    Grote lokale modellen kunnen een lange eerste laadtijd nodig hebben voordat streaming begint. Houd de timeout beperkt tot de Ollama-provider, en vraag Ollama eventueel om het model tussen beurten geladen te houden:

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

    Als de host zelf traag verbindingen accepteert, verlengt `timeoutSeconds` ook de bewaakte Undici-verbindingstimeout voor deze provider.

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    Veel Ollama-modellen adverteren contexten die groter zijn dan je hardware comfortabel kan draaien. Native Ollama gebruikt Ollama's eigen standaard runtimecontext, tenzij je `params.num_ctx` instelt. Beperk zowel het budget van OpenClaw als de requestcontext van Ollama wanneer je voorspelbare latentie tot het eerste token wilt:

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

    Verlaag eerst `contextWindow` als OpenClaw te veel prompt verstuurt. Verlaag `params.num_ctx` als Ollama een runtimecontext laadt die te groot is voor de machine. Verlaag `maxTokens` als generatie te lang duurt.

  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Problemen oplossen](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model providers" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelrefs en failovergedrag.
  </Card>
  <Card title="Model selection" href="/nl/concepts/models" icon="brain">
    Modellen kiezen en configureren.
  </Card>
  <Card title="Ollama Web Search" href="/nl/tools/ollama-search" icon="magnifying-glass">
    Volledige setup- en gedragsdetails voor webzoekopdrachten aangedreven door Ollama.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
</CardGroup>
