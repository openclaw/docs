---
read_when:
    - Je wilt OpenClaw uitvoeren met cloud- of lokale modellen via Ollama
    - Je hebt hulp nodig bij het instellen en configureren van Ollama
    - Je wilt Ollama-visionmodellen voor beeldbegrip
summary: Voer OpenClaw uit met Ollama (cloud- en lokale modellen)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T08:17:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw integreert met Ollama's native API (`/api/chat`) voor gehoste cloudmodellen en lokale/zelfgehoste Ollama-servers. Je kunt Ollama in drie modi gebruiken: `Cloud + Local` via een bereikbare Ollama-host, `Cloud only` tegen `https://ollama.com`, of `Local only` tegen een bereikbare Ollama-host.

OpenClaw registreert ook `ollama-cloud` als een volwaardige gehoste provider-id voor
direct gebruik van Ollama Cloud. Gebruik refs zoals `ollama-cloud/kimi-k2.5:cloud` wanneer je
cloud-only-routering wilt zonder de lokale `ollama`-provider-id te delen.

Zie [Ollama Cloud](/nl/providers/ollama-cloud) voor de specifieke installatiepagina voor alleen de cloud.

<Warning>
**Gebruikers van externe Ollama**: Gebruik de `/v1` OpenAI-compatibele URL (`http://host:11434/v1`) niet met OpenClaw. Dit verbreekt toolaanroepen en modellen kunnen ruwe tool-JSON als platte tekst uitvoeren. Gebruik in plaats daarvan de native Ollama-API-URL: `baseUrl: "http://host:11434"` (geen `/v1`).
</Warning>

De providerconfiguratie van Ollama gebruikt `baseUrl` als canonieke sleutel. OpenClaw accepteert ook `baseURL` voor compatibiliteit met voorbeelden in OpenAI SDK-stijl, maar nieuwe configuratie moet de voorkeur geven aan `baseUrl`.

## Auth-regels

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Lokale en LAN-Ollama-hosts hebben geen echt bearer-token nodig. OpenClaw gebruikt de lokale `ollama-local`-markering alleen voor loopback-, privatenetwerk-, `.local`- en kale-hostnaam-Ollama-basis-URL's.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Externe publieke hosts en Ollama Cloud (`https://ollama.com`) vereisen echte referenties via `OLLAMA_API_KEY`, een auth-profiel of de `apiKey` van de provider. Geef voor direct gehost gebruik de voorkeur aan provider `ollama-cloud`.
  </Accordion>
  <Accordion title="Custom provider ids">
    Aangepaste provider-id's die `api: "ollama"` instellen, volgen dezelfde regels. Een `ollama-remote`-provider die bijvoorbeeld naar een private LAN-Ollama-host wijst, kan `apiKey: "ollama-local"` gebruiken en subagenten lossen die markering op via de Ollama-providerhook in plaats van deze als ontbrekende referentie te behandelen. Geheugenzoekopdrachten kunnen ook `agents.defaults.memorySearch.provider` instellen op die aangepaste provider-id, zodat embeddings het bijpassende Ollama-eindpunt gebruiken.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` slaat de referentie voor een provider-id op. Zet eindpuntinstellingen (`baseUrl`, `api`, model-id's, headers, time-outs) in `models.providers.<id>`. Oudere platte auth-profielbestanden zoals `{ "ollama-windows": { "apiKey": "ollama-local" } }` zijn geen runtime-indeling; voer `openclaw doctor --fix` uit om ze met een back-up te herschrijven naar het canonieke `ollama-windows:default` API-sleutelprofiel. `baseUrl` in dat bestand is compatibiliteitsruis en moet naar providerconfiguratie worden verplaatst.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Wanneer Ollama wordt gebruikt voor geheugen-embeddings, wordt bearer-auth beperkt tot de host waar deze is gedeclareerd:

    - Een sleutel op providerniveau wordt alleen naar de Ollama-host van die provider verzonden.
    - `agents.*.memorySearch.remote.apiKey` wordt alleen naar de externe embedding-host ervan verzonden.
    - Een pure `OLLAMA_API_KEY`-env-waarde wordt behandeld als de Ollama Cloud-conventie en standaard niet naar lokale of zelfgehoste hosts verzonden.

  </Accordion>
</AccordionGroup>

## Aan de slag

Kies je gewenste installatiemethode en modus.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Beste voor:** de snelste weg naar een werkende Ollama-cloud- of lokale installatie.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Selecteer **Ollama** in de providerlijst.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — lokale Ollama-host plus cloudmodellen die via die host worden gerouteerd
        - **Cloud only** — gehoste Ollama-modellen via `https://ollama.com`
        - **Local only** — alleen lokale modellen

      </Step>
      <Step title="Select a model">
        `Cloud only` vraagt om `OLLAMA_API_KEY` en stelt gehoste cloudstandaarden voor. `Cloud + Local` en `Local only` vragen om een Ollama-basis-URL, ontdekken beschikbare modellen en halen het geselecteerde lokale model automatisch op als het nog niet beschikbaar is. Wanneer Ollama een geïnstalleerde `:latest`-tag meldt, zoals `gemma4:latest`, toont de installatie dat geïnstalleerde model één keer in plaats van zowel `gemma4` als `gemma4:latest` te tonen of de kale alias opnieuw op te halen. `Cloud + Local` controleert ook of die Ollama-host is aangemeld voor cloudtoegang.
      </Step>
      <Step title="Verify the model is available">
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

  <Tab title="Manual setup">
    **Beste voor:** volledige controle over cloud- of lokale installatie.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: installeer Ollama, meld je aan met `ollama signin` en routeer cloudaanvragen via die host
        - **Cloud only**: gebruik `https://ollama.com` met een `OLLAMA_API_KEY`
        - **Local only**: installeer Ollama vanaf [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        Gebruik voor `Cloud only` je echte `OLLAMA_API_KEY`. Voor host-ondersteunde installaties werkt elke placeholderwaarde:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Of stel de standaard in de configuratie in:

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

    Gebruik **Cloud + Local** tijdens de installatie. OpenClaw vraagt om de Ollama-basis-URL, ontdekt lokale modellen vanaf die host en controleert met `ollama signin` of de host is aangemeld voor cloudtoegang. Wanneer de host is aangemeld, stelt OpenClaw ook gehoste cloudstandaarden voor, zoals `kimi-k2.5:cloud`, `minimax-m2.7:cloud` en `glm-5.1:cloud`.

    Als de host nog niet is aangemeld, houdt OpenClaw de installatie local-only totdat je `ollama signin` uitvoert.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` draait tegen Ollama's gehoste API op `https://ollama.com`.

    Gebruik **Cloud only** tijdens de installatie. OpenClaw vraagt om `OLLAMA_API_KEY`, stelt `baseUrl: "https://ollama.com"` in en vult de gehoste cloudmodellijst vooraf. Dit pad vereist **geen** lokale Ollama-server of `ollama signin`.

    De cloudmodellijst die tijdens `openclaw onboard` wordt getoond, wordt live gevuld vanaf `https://ollama.com/api/tags`, met een maximum van 500 vermeldingen, zodat de kiezer de huidige gehoste catalogus weerspiegelt in plaats van een statische startlijst. Als `ollama.com` onbereikbaar is of tijdens de installatie geen modellen retourneert, valt OpenClaw terug op de eerdere hardgecodeerde suggesties zodat onboarding toch wordt voltooid.

    Je kunt de volwaardige cloudprovider ook direct configureren:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    In de local-only-modus ontdekt OpenClaw modellen vanaf de geconfigureerde Ollama-instantie. Dit pad is bedoeld voor lokale of zelfgehoste Ollama-servers.

    OpenClaw stelt momenteel `gemma4` voor als lokale standaard.

  </Tab>
</Tabs>

## Modeldetectie (impliciete provider)

Wanneer je `OLLAMA_API_KEY` (of een auth-profiel) instelt en **geen** `models.providers.ollama` of andere aangepaste externe provider met `api: "ollama"` definieert, ontdekt OpenClaw modellen vanaf de lokale Ollama-instantie op `http://127.0.0.1:11434`.

| Gedrag               | Detail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalogusquery       | Bevraagt `/api/tags`                                                                                                                                                 |
| Detectie van mogelijkheden | Gebruikt best-effort `/api/show`-lookups om `contextWindow`, uitgebreide `num_ctx`-Modelfile-parameters en mogelijkheden inclusief vision/tools te lezen       |
| Vision-modellen      | Modellen met een door `/api/show` gemelde `vision`-mogelijkheid worden gemarkeerd als geschikt voor afbeeldingen (`input: ["text", "image"]`), zodat OpenClaw automatisch afbeeldingen in de prompt injecteert |
| Redeneringsdetectie  | Gebruikt `/api/show`-mogelijkheden wanneer beschikbaar, inclusief `thinking`; valt terug op een modelnaamheuristiek (`r1`, `reasoning`, `think`) wanneer Ollama mogelijkheden weglaat |
| Tokenlimieten        | Stelt `maxTokens` in op de standaard Ollama-maximumtokenlimiet die door OpenClaw wordt gebruikt                                                                       |
| Kosten               | Stelt alle kosten in op `0`                                                                                                                                          |

Dit voorkomt handmatige modelvermeldingen terwijl de catalogus afgestemd blijft op de lokale Ollama-instantie. Je kunt een volledige ref gebruiken, zoals `ollama/<pulled-model>:latest`, in lokale `infer model run`; OpenClaw lost dat geïnstalleerde model op uit Ollama's livecatalogus zonder een handgeschreven `models.json`-vermelding te vereisen.

Voor aangemelde Ollama-hosts kunnen sommige `:cloud`-modellen bruikbaar zijn via `/api/chat`
en `/api/show` voordat ze in `/api/tags` verschijnen. Wanneer je expliciet een
volledige `ollama/<model>:cloud`-ref selecteert, valideert OpenClaw dat exacte ontbrekende model met
`/api/show` en voegt het alleen aan de runtimecatalogus toe als Ollama modelmetadata
bevestigt. Typefouten mislukken nog steeds als onbekende modellen in plaats van automatisch te worden aangemaakt.

```bash
# See what models are available
ollama list
openclaw models list
```

Gebruik voor een gerichte rooktest voor tekstgeneratie die het volledige agenttoolsurface vermijdt
lokale `infer model run` met een volledige Ollama-modelref:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Dat pad gebruikt nog steeds OpenClaw's geconfigureerde provider, auth en native Ollama-
transport, maar start geen chat-agentbeurt en laadt geen MCP-/toolcontext. Als
dit slaagt terwijl normale agentantwoorden mislukken, onderzoek dan vervolgens de capaciteit van het model voor agent-
prompts/tools.

Voeg voor een gerichte rooktest voor een vision-model op hetzelfde slanke pad een of meer
afbeeldingsbestanden toe aan `infer model run`. Dit stuurt de prompt en afbeelding rechtstreeks naar
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

`model run --file` accepteert bestanden die als `image/*` worden gedetecteerd, inclusief gangbare PNG-,
JPEG- en WebP-invoer. Niet-afbeeldingsbestanden worden geweigerd voordat Ollama wordt aangeroepen.
Gebruik voor spraakherkenning in plaats daarvan `openclaw infer audio transcribe`.

Wanneer je een gesprek met `/model ollama/<model>` overschakelt, behandelt OpenClaw
dat als een exacte gebruikersselectie. Als de geconfigureerde Ollama `baseUrl`
onbereikbaar is, mislukt het volgende antwoord met de providerfout in plaats van stilzwijgend
te antwoorden vanuit een ander geconfigureerd fallbackmodel.

Geïsoleerde Cron-taken voeren één extra lokale veiligheidscontrole uit voordat ze de agentbeurt
starten. Als het geselecteerde model verwijst naar een lokale, privénetwerk- of `.local`
Ollama-provider en `/api/tags` onbereikbaar is, registreert OpenClaw die Cron-uitvoering
als `skipped` met de geselecteerde `ollama/<model>` in de fouttekst. De endpoint-
preflight wordt 5 minuten gecachet, zodat meerdere Cron-taken die naar dezelfde
gestopte Ollama-daemon wijzen niet allemaal mislukte modelrequests starten.

Verifieer live het lokale tekstpad, het native streampad en embeddings tegen
lokale Ollama met:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Voor Ollama Cloud API-sleutel-smoketests wijs je de live test naar `https://ollama.com`
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

De cloud-smoke voert tekst, native streaming en webzoekopdrachten uit. Embeddings worden
standaard overgeslagen voor `https://ollama.com`, omdat Ollama Cloud API-sleutels mogelijk
geen toegang tot `/api/embed` autoriseren. Stel `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` in wanneer je expliciet wilt
dat de live test mislukt als de geconfigureerde cloudsleutel het embed-endpoint niet kan gebruiken.

Om een nieuw model toe te voegen, pull je het gewoon met Ollama:

```bash
ollama pull mistral
```

Het nieuwe model wordt automatisch ontdekt en is beschikbaar voor gebruik.

<Note>
Als je `models.providers.ollama` expliciet instelt, of een aangepaste externe provider configureert zoals `models.providers.ollama-cloud` met `api: "ollama"`, wordt automatische ontdekking overgeslagen en moet je modellen handmatig definiëren. Aangepaste loopback-providers zoals `http://127.0.0.2:11434` worden nog steeds als lokaal behandeld. Zie de sectie voor expliciete configuratie hieronder.
</Note>

## Visie en afbeeldingsbeschrijving

De gebundelde Ollama-Plugin registreert Ollama als een provider voor mediabegrip met afbeeldingsmogelijkheden. Hierdoor kan OpenClaw expliciete verzoeken voor afbeeldingsbeschrijving en geconfigureerde standaardwaarden voor afbeeldingsmodellen routeren via lokale of gehoste Ollama-visiemodellen.

Voor lokale visie pull je een model dat afbeeldingen ondersteunt:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Verifieer daarna met de infer-CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` moet een volledige `<provider/model>`-ref zijn. Wanneer dit is ingesteld, probeert `openclaw infer image describe` eerst dat model in plaats van beschrijving over te slaan omdat het model native visie ondersteunt. Als de modelaanroep mislukt, kan OpenClaw doorgaan via geconfigureerde `agents.defaults.imageModel.fallbacks`; voorbereidingsfouten voor bestanden of URL's mislukken nog steeds vóór fallbackpogingen.

Gebruik `infer image describe` wanneer je de providerflow voor afbeeldingsbegrip van OpenClaw, geconfigureerde `agents.defaults.imageModel` en de uitvoervorm voor afbeeldingsbeschrijvingen wilt. Gebruik `infer model run --file` wanneer je een ruwe multimodale modelprobe wilt met een aangepaste prompt en één of meer afbeeldingen.

Configureer `agents.defaults.imageModel` om Ollama het standaardmodel voor afbeeldingsbegrip voor inkomende media te maken:

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

Geef de voorkeur aan de volledige `ollama/<model>`-ref. Als hetzelfde model onder `models.providers.ollama.models` staat met `input: ["text", "image"]` en geen andere geconfigureerde afbeeldingsprovider die kale model-ID aanbiedt, normaliseert OpenClaw ook een kale `imageModel`-ref zoals `qwen2.5vl:7b` naar `ollama/qwen2.5vl:7b`. Als meer dan één geconfigureerde afbeeldingsprovider dezelfde kale ID heeft, gebruik dan expliciet het providerprefix.

Langzame lokale visiemodellen kunnen een langere time-out voor afbeeldingsbegrip nodig hebben dan cloudmodellen. Ze kunnen ook crashen of stoppen wanneer Ollama probeert de volledige geadverteerde visiecontext toe te wijzen op beperkte hardware. Stel een capaciteitstime-out in en beperk `num_ctx` op de modelvermelding wanneer je alleen een normale beurt voor afbeeldingsbeschrijving nodig hebt:

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

Deze time-out geldt voor inkomend afbeeldingsbegrip en voor de expliciete `image`-tool die de agent tijdens een beurt kan aanroepen. `models.providers.ollama.timeoutSeconds` op providerniveau blijft de onderliggende Ollama HTTP-requestbewaking voor normale modelaanroepen regelen.

Verifieer de expliciete afbeeldingstool live tegen lokale Ollama met:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Als je `models.providers.ollama.models` handmatig definieert, markeer visiemodellen dan met ondersteuning voor afbeeldingsinvoer:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw weigert verzoeken voor afbeeldingsbeschrijving voor modellen die niet als afbeeldingsgeschikt zijn gemarkeerd. Bij impliciete ontdekking leest OpenClaw dit uit Ollama wanneer `/api/show` een visiemogelijkheid rapporteert.

## Configuratie

<Tabs>
  <Tab title="Basis (impliciete ontdekking)">
    Het eenvoudigste activeringspad voor alleen lokaal gebruik loopt via een omgevingsvariabele:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Als `OLLAMA_API_KEY` is ingesteld, kun je `apiKey` in de providervermelding weglaten en vult OpenClaw deze in voor beschikbaarheidscontroles.
    </Tip>

  </Tab>

  <Tab title="Expliciet (handmatige modellen)">
    Gebruik expliciete configuratie wanneer je een gehoste cloudconfiguratie wilt, Ollama op een andere host/poort draait, je specifieke contextvensters of modellijsten wilt afdwingen, of je volledig handmatige modeldefinities wilt.

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

Gebruik deze als startpunten en vervang model-ID's door de exacte namen uit `ollama list` of `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Lokaal model met automatische ontdekking">
    Gebruik dit wanneer Ollama op dezelfde machine als de Gateway draait en je wilt dat OpenClaw de geïnstalleerde modellen automatisch ontdekt.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Dit pad houdt de configuratie minimaal. Voeg geen `models.providers.ollama`-blok toe tenzij je modellen handmatig wilt definiëren.

  </Accordion>

  <Accordion title="LAN-Ollama-host met handmatige modellen">
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

    `contextWindow` is het contextbudget aan de OpenClaw-kant. `params.num_ctx` wordt voor het request naar Ollama verzonden. Houd ze op elkaar afgestemd wanneer je hardware de volledig geadverteerde context van het model niet kan uitvoeren.

  </Accordion>

  <Accordion title="Alleen Ollama Cloud">
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

  <Accordion title="Cloud plus lokaal via een aangemelde daemon">
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

  <Accordion title="Meerdere Ollama-hosts">
    Gebruik aangepaste provider-ID's wanneer je meer dan één Ollama-server hebt. Elke provider krijgt zijn eigen host, modellen, authenticatie, time-out en modelverwijzingen.

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

    Wanneer OpenClaw de aanvraag verzendt, wordt de actieve providerprefix verwijderd, zodat `ollama-large/qwen3.5:27b` Ollama bereikt als `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Slank profiel voor lokaal model">
    Sommige lokale modellen kunnen eenvoudige prompts beantwoorden, maar hebben moeite met het volledige oppervlak van agenttools. Begin met het beperken van tools en context voordat je globale runtime-instellingen wijzigt.

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

    Gebruik `compat.supportsTools: false` alleen wanneer het model of de server betrouwbaar faalt op toolschema's. Het ruilt agentmogelijkheden in voor stabiliteit.
    `localModelLean` verwijdert de browser-, cron- en berichttools uit het directe agentoppervlak en plaatst grotere catalogi standaard achter gestructureerde Tool Search-bedieningselementen, behalve wanneer een run directe semantiek voor berichtbezorging moet behouden, maar het wijzigt de runtimecontext of denkmodus van Ollama niet. Combineer het met expliciete `params.num_ctx` en `params.thinking: false` voor kleine Qwen-achtige denkmodellen die in een lus raken of hun antwoordbudget besteden aan verborgen redenering.

  </Accordion>
</AccordionGroup>

### Modelselectie

Zodra ze zijn geconfigureerd, zijn al je Ollama-modellen beschikbaar:

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

Aangepaste Ollama-provider-ID's worden ook ondersteund. Wanneer een modelverwijzing de actieve
providerprefix gebruikt, zoals `ollama-spark/qwen3:32b`, verwijdert OpenClaw alleen die
prefix voordat Ollama wordt aangeroepen, zodat de server `qwen3:32b` ontvangt.

Geef voor trage lokale modellen de voorkeur aan providergebonden aanvraagafstemming voordat je de
time-out voor de volledige agentruntime verhoogt:

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

`timeoutSeconds` is van toepassing op de HTTP-aanvraag voor het model, inclusief het opzetten van de verbinding,
headers, bodystreaming en de totale bewaakte-fetch-afbreking. `params.keep_alive`
wordt doorgestuurd naar Ollama als top-level `keep_alive` bij native `/api/chat`-aanvragen;
stel dit per model in wanneer de laadtijd van de eerste beurt de bottleneck is.

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

OpenClaw ondersteunt **Ollama Web Search** als gebundelde `web_search`-provider.

| Eigenschap  | Detail                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Gebruikt je geconfigureerde Ollama-host (`models.providers.ollama.baseUrl` wanneer ingesteld, anders `http://127.0.0.1:11434`); `https://ollama.com` gebruikt de gehoste API rechtstreeks |
| Authenticatie | Zonder sleutel voor aangemelde lokale Ollama-hosts; `OLLAMA_API_KEY` of geconfigureerde providerauthenticatie voor directe `https://ollama.com`-zoekopdrachten of hosts met authenticatiebescherming |
| Vereiste | Lokale/zelfgehoste hosts moeten actief zijn en aangemeld zijn met `ollama signin`; directe gehoste zoekopdrachten vereisen `baseUrl: "https://ollama.com"` plus een echte Ollama-API-sleutel |

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

Voor directe gehoste zoekopdrachten via Ollama Cloud:

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
  <Accordion title="Verouderde OpenAI-compatibele modus">
    <Warning>
    **Toolaanroepen zijn niet betrouwbaar in OpenAI-compatibele modus.** Gebruik deze modus alleen als je OpenAI-indeling nodig hebt voor een proxy en niet afhankelijk bent van native gedrag voor toolaanroepen.
    </Warning>

    Als je in plaats daarvan het OpenAI-compatibele endpoint moet gebruiken (bijvoorbeeld achter een proxy die alleen OpenAI-indeling ondersteunt), stel dan `api: "openai-completions"` expliciet in:

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

    Deze modus ondersteunt mogelijk streaming en toolaanroepen niet tegelijk. Mogelijk moet je streaming uitschakelen met `params: { streaming: false }` in de modelconfiguratie.

    Wanneer `api: "openai-completions"` wordt gebruikt met Ollama, injecteert OpenClaw standaard `options.num_ctx`, zodat Ollama niet stil terugvalt naar een contextvenster van 4096. Als je proxy/upstream onbekende `options`-velden weigert, schakel dit gedrag dan uit:

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
    Voor automatisch ontdekte modellen gebruikt OpenClaw het door Ollama gerapporteerde contextvenster wanneer beschikbaar, inclusief grotere `PARAMETER num_ctx`-waarden uit aangepaste Modelfiles. Anders valt het terug op het standaard Ollama-contextvenster dat door OpenClaw wordt gebruikt.

    Je kunt standaardwaarden voor `contextWindow`, `contextTokens` en `maxTokens` op providerniveau instellen voor elk model onder die Ollama-provider, en ze vervolgens per model overschrijven wanneer nodig. `contextWindow` is het prompt- en Compaction-budget van OpenClaw. Native Ollama-aanvragen laten `options.num_ctx` oningesteld tenzij je expliciet `params.num_ctx` configureert, zodat Ollama zijn eigen model-, `OLLAMA_CONTEXT_LENGTH`- of VRAM-gebaseerde standaard kan toepassen. Om de runtimecontext per aanvraag van Ollama te begrenzen of af te dwingen zonder een Modelfile opnieuw te bouwen, stel je `params.num_ctx` in; ongeldige, nul-, negatieve en niet-eindige waarden worden genegeerd. Als je een oudere configuratie hebt geüpgraded die alleen `contextWindow` of `maxTokens` gebruikte om een native Ollama-aanvraagcontext af te dwingen, voer dan `openclaw doctor --fix` uit om die expliciete provider- of modelbudgetten naar `params.num_ctx` te kopiëren. De OpenAI-compatibele Ollama-adapter injecteert standaard nog steeds `options.num_ctx` vanuit de geconfigureerde `params.num_ctx` of `contextWindow`; schakel dat uit met `injectNumCtxForOpenAICompat: false` als je upstream `options` weigert.

    Native Ollama-modelvermeldingen accepteren ook de algemene Ollama-runtimeopties onder `params`, waaronder `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` en `use_mmap`. OpenClaw stuurt alleen Ollama-aanvraagsleutels door, zodat OpenClaw-runtimeparameters zoals `streaming` niet naar Ollama uitlekken. Gebruik `params.think` of `params.thinking` om top-level Ollama `think` te verzenden; `false` schakelt denken op API-niveau uit voor Qwen-achtige denkmodellen.

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

    Per model werkt `agents.defaults.models["ollama/<model>"].params.num_ctx` ook. Als beide zijn geconfigureerd, wint de expliciete providermodelvermelding van de agentstandaard.

  </Accordion>

  <Accordion title="Denkbesturing">
    Voor native Ollama-modellen stuurt OpenClaw denkbesturing door zoals Ollama die verwacht: top-level `think`, niet `options.think`. Automatisch ontdekte modellen waarvan het `/api/show`-antwoord de mogelijkheid `thinking` bevat, tonen `/think low`, `/think medium`, `/think high` en `/think max`; niet-denkende modellen tonen alleen `/think off`.

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

    Per model kan `params.think` of `params.thinking` Ollama API-denken uitschakelen of afdwingen voor een specifiek geconfigureerd model. OpenClaw behoudt die expliciete modelparameters wanneer de actieve run alleen de impliciete standaard `off` heeft; runtimeopdrachten die niet `off` zijn, zoals `/think medium`, overschrijven de actieve run nog steeds.

  </Accordion>

  <Accordion title="Redeneermodellen">
    OpenClaw behandelt modellen met namen zoals `deepseek-r1`, `reasoning` of `think` standaard als redeneergeschikt.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Er is geen aanvullende configuratie nodig. OpenClaw markeert ze automatisch.

  </Accordion>

  <Accordion title="Model costs">
    Ollama is gratis en draait lokaal, dus alle modelkosten zijn ingesteld op $0. Dit geldt voor zowel automatisch ontdekte als handmatig gedefinieerde modellen.
  </Accordion>

  <Accordion title="Memory embeddings">
    De meegeleverde Ollama-plugin registreert een provider voor memory embeddings voor
    [geheugenzoekopdrachten](/nl/concepts/memory). Deze gebruikt de geconfigureerde Ollama-basis-URL
    en API-sleutel, roept Ollama's huidige `/api/embed`-endpoint aan, en bundelt
    waar mogelijk meerdere geheugenfragmenten in één `input`-request.

    Wanneer `proxy.enabled=true`, gebruiken Ollama-memory-embeddingrequests naar de exacte
    host-local loopback-origin die is afgeleid van de geconfigureerde `baseUrl`
    het bewaakte directe pad van OpenClaw in plaats van de beheerde forward proxy. De
    geconfigureerde hostnaam moet zelf `localhost` of een loopback-IP-literal zijn;
    DNS-namen die alleen naar loopback resolven gebruiken nog steeds het beheerde proxypad.
    LAN-, tailnet-, private-network- en publieke Ollama-hosts blijven ook op het
    beheerde proxypad. Redirects naar een andere host of poort erven geen vertrouwen.
    Operators kunnen nog steeds de globale instelling `proxy.loopbackMode: "proxy"` instellen om
    loopbackverkeer via de proxy te sturen, of `proxy.loopbackMode: "block"`
    om loopbackverbindingen te weigeren voordat een verbinding wordt geopend; zie
    [Beheerde proxy](/nl/security/network-proxy#gateway-loopback-mode) voor het
    procesbrede effect van deze instelling.

    | Eigenschap     | Waarde              |
    | ------------- | ------------------- |
    | Standaardmodel | `nomic-embed-text`  |
    | Auto-pull     | Ja — het embeddingmodel wordt automatisch opgehaald als het lokaal niet aanwezig is |

    Embeddings tijdens queries gebruiken retrieval-prefixen voor modellen die ze vereisen of aanbevelen, waaronder `nomic-embed-text`, `qwen3-embedding` en `mxbai-embed-large`. Geheugendocumentbatches blijven onbewerkt, zodat bestaande indexen geen formaatmigratie nodig hebben.

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
    OpenClaw's Ollama-integratie gebruikt standaard de **native Ollama API** (`/api/chat`), die streaming en toolaanroepen tegelijk volledig ondersteunt. Er is geen speciale configuratie nodig.

    Voor native `/api/chat`-requests stuurt OpenClaw ook thinking-besturing rechtstreeks door naar Ollama: `/think off` en `openclaw agent --thinking off` sturen top-level `think: false`, tenzij een expliciete modelwaarde `params.think`/`params.thinking` is geconfigureerd, terwijl `/think low|medium|high` de overeenkomende top-level `think`-inspanningsstring sturen. `/think max` wordt gekoppeld aan Ollama's hoogste native inspanning, `think: "high"`.

    <Tip>
    Als je het OpenAI-compatibele endpoint moet gebruiken, zie dan de sectie "Legacy OpenAI-compatible mode" hierboven. Streaming en toolaanroepen werken in die modus mogelijk niet tegelijk.
    </Tip>

  </Accordion>
</AccordionGroup>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    Op WSL2 met NVIDIA/CUDA maakt de officiële Ollama Linux-installer een `ollama.service` systemd-unit met `Restart=always`. Als die service automatisch start en tijdens het opstarten van WSL2 een GPU-ondersteund model laadt, kan Ollama hostgeheugen vastpinnen terwijl het model laadt. Hyper-V-geheugenterugwinning kan die vastgepinde pagina's niet altijd terugwinnen, waardoor Windows de WSL2-VM kan beëindigen, systemd Ollama opnieuw start, en de lus zich herhaalt.

    Veelvoorkomend bewijs:

    - herhaalde WSL2-herstarts of beëindigingen vanaf de Windows-kant
    - hoge CPU in `app.slice` of `ollama.service` kort na het starten van WSL2
    - SIGTERM van systemd in plaats van een Linux OOM-killergebeurtenis

    OpenClaw logt een opstartwaarschuwing wanneer het WSL2 detecteert, `ollama.service` is ingeschakeld met `Restart=always`, en zichtbare CUDA-markeringen aanwezig zijn.

    Mitigatie:

    ```bash
    sudo systemctl disable ollama
    ```

    Voeg dit toe aan `%USERPROFILE%\.wslconfig` aan de Windows-kant en voer daarna `wsl --shutdown` uit:

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
    Zorg dat Ollama draait, dat je `OLLAMA_API_KEY` hebt ingesteld (of een authprofiel), en dat je **geen** expliciete `models.providers.ollama`-entry hebt gedefinieerd:

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
    - De URL gebruikt `/v1`, wat OpenAI-compatibel gedrag selecteert in plaats van native Ollama.
    - De externe host heeft firewall- of LAN-bindingswijzigingen nodig aan de Ollama-kant.
    - Het model is aanwezig op de daemon van je laptop, maar niet op de externe daemon.

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    Dit betekent meestal dat de provider OpenAI-compatibele modus gebruikt of dat het model geen toolschema's kan verwerken.

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

    Als een klein lokaal model nog steeds faalt op toolschema's, stel dan `compat.supportsTools: false` in op die modelentry en test opnieuw.

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    Gehoste Kimi/GLM-antwoorden die bestaan uit lange, niet-linguïstische symboolreeksen worden behandeld als mislukte provideruitvoer in plaats van als een succesvol assistentantwoord. Daardoor kunnen normale retry-, fallback- of foutafhandeling overnemen zonder de beschadigde tekst in de sessie op te slaan.

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

    Als de host zelf traag is met het accepteren van verbindingen, verlengt `timeoutSeconds` ook de bewaakte Undici-connecttimeout voor deze provider.

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    Veel Ollama-modellen adverteren contexten die groter zijn dan je hardware comfortabel kan draaien. Native Ollama gebruikt Ollama's eigen standaard runtimecontext, tenzij je `params.num_ctx` instelt. Beperk zowel OpenClaw's budget als Ollama's requestcontext wanneer je voorspelbare first-token-latency wilt:

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
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model providers" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelverwijzingen en failovergedrag.
  </Card>
  <Card title="Model selection" href="/nl/concepts/models" icon="brain">
    Hoe je modellen kiest en configureert.
  </Card>
  <Card title="Ollama Web Search" href="/nl/tools/ollama-search" icon="magnifying-glass">
    Volledige setup- en gedragsdetails voor door Ollama aangedreven webzoekopdrachten.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
</CardGroup>
