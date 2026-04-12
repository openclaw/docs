---
read_when:
    - OpenClaw’ı Ollama üzerinden cloud veya yerel modellerle çalıştırmak istiyorsunuz
    - Ollama kurulumu ve yapılandırma rehberine ihtiyacınız var
summary: OpenClaw’ı Ollama ile çalıştırın (cloud ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-04-12T23:31:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec796241b884ca16ec7077df4f3f1910e2850487bb3ea94f8fdb37c77e02b219
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama, makinenizde açık kaynak modelleri çalıştırmayı kolaylaştıran yerel bir LLM çalışma zamanıdır. OpenClaw, Ollama’nın yerel API’siyle (`/api/chat`) bütünleşir, akışı ve araç çağırmayı destekler ve `OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ile açıkça bir `models.providers.ollama` girdisi tanımlamadığınızda yerel Ollama modellerini otomatik keşfedebilir.

<Warning>
**Uzak Ollama kullanıcıları**: OpenClaw ile `/v1` OpenAI uyumlu URL’yi (`http://host:11434/v1`) kullanmayın. Bu, araç çağırmayı bozar ve modeller düz metin olarak ham araç JSON’u üretebilir. Bunun yerine yerel Ollama API URL’sini kullanın: `baseUrl: "http://host:11434"` (`/v1` olmadan).
</Warning>

## Başlarken

Tercih ettiğiniz kurulum yöntemini ve modu seçin.

<Tabs>
  <Tab title="Onboarding (önerilir)">
    **En uygunu:** otomatik model keşfiyle çalışan bir Ollama kurulumu için en hızlı yol.

    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard
        ```

        Provider listesinden **Ollama** seçin.
      </Step>
      <Step title="Modunuzu seçin">
        - **Cloud + Local** — cloud barındırılan modeller ve yerel modeller birlikte
        - **Local** — yalnızca yerel modeller

        **Cloud + Local** seçerseniz ve ollama.com üzerinde oturum açmamışsanız, onboarding tarayıcıda bir oturum açma akışı açar.
      </Step>
      <Step title="Bir model seçin">
        Onboarding, kullanılabilir modelleri keşfeder ve varsayılanlar önerir. Seçilen model yerelde mevcut değilse otomatik olarak çeker.
      </Step>
      <Step title="Modelin kullanılabildiğini doğrulayın">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Etkileşimsiz mod

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    İsteğe bağlı olarak özel bir base URL veya model belirtebilirsiniz:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Elle kurulum">
    **En uygunu:** kurulum, model çekme ve yapılandırma üzerinde tam kontrol.

    <Steps>
      <Step title="Ollama'yı kurun">
        [ollama.com/download](https://ollama.com/download) adresinden indirin.
      </Step>
      <Step title="Yerel bir model çekin">
        ```bash
        ollama pull gemma4
        # veya
        ollama pull gpt-oss:20b
        # veya
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Cloud modeller için oturum açın (isteğe bağlı)">
        Cloud modelleri de istiyorsanız:

        ```bash
        ollama signin
        ```
      </Step>
      <Step title="OpenClaw için Ollama'yı etkinleştirin">
        API anahtarı için herhangi bir değer ayarlayın (Ollama gerçek bir anahtar gerektirmez):

        ```bash
        # Ortam değişkeni ayarlayın
        export OLLAMA_API_KEY="ollama-local"

        # Veya yapılandırma dosyanızda ayarlayın
        openclaw config set models.providers.ollama.apiKey "ollama-local"
        ```
      </Step>
      <Step title="Modelinizi inceleyin ve ayarlayın">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Veya varsayılanı yapılandırmada ayarlayın:

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

## Cloud modeller

<Tabs>
  <Tab title="Cloud + Local">
    Cloud modeller, yerel modellerinizin yanında cloud barındırılan modelleri çalıştırmanıza olanak tanır. Örnekler arasında `kimi-k2.5:cloud`, `minimax-m2.7:cloud` ve `glm-5.1:cloud` bulunur -- bunlar yerel bir `ollama pull` gerektirmez.

    Kurulum sırasında **Cloud + Local** modunu seçin. Sihirbaz, oturum açıp açmadığınızı denetler ve gerektiğinde tarayıcıda bir oturum açma akışı açar. Kimlik doğrulama doğrulanamazsa sihirbaz yerel model varsayılanlarına geri döner.

    Doğrudan [ollama.com/signin](https://ollama.com/signin) adresinden de oturum açabilirsiniz.

    OpenClaw şu anda şu cloud varsayılanlarını önerir: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`.

  </Tab>

  <Tab title="Yalnızca yerel">
    Yalnızca yerel modda OpenClaw, modelleri yerel Ollama örneğinden keşfeder. Cloud oturum açma gerekmez.

    OpenClaw şu anda yerel varsayılan olarak `gemma4` önerir.

  </Tab>
</Tabs>

## Model keşfi (örtük provider)

`OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ayarladığınızda ve **`models.providers.ollama` tanımlamadığınızda**, OpenClaw modelleri `http://127.0.0.1:11434` adresindeki yerel Ollama örneğinden keşfeder.

| Davranış             | Ayrıntı                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Katalog sorgusu      | `/api/tags` sorgular                                                                                                                                                     |
| Yetenek algılama     | `contextWindow` değerini okumak ve yetenekleri (görsel dahil) algılamak için en iyi çaba ile `/api/show` aramaları kullanır                                            |
| Görsel modeller      | `/api/show` tarafından bildirilen `vision` yeteneğine sahip modeller, görsel destekli (`input: ["text", "image"]`) olarak işaretlenir; böylece OpenClaw görselleri prompt’a otomatik enjekte eder |
| Akıl yürütme algılama | `reasoning` özelliğini bir model adı sezgisiyle (`r1`, `reasoning`, `think`) işaretler                                                                                 |
| Token sınırları      | `maxTokens` değerini, OpenClaw’ın kullandığı varsayılan Ollama maksimum token sınırına ayarlar                                                                          |
| Maliyetler           | Tüm maliyetleri `0` olarak ayarlar                                                                                                                                       |

Bu, kataloğu yerel Ollama örneğiyle uyumlu tutarken manuel model girdilerinden kaçınmanızı sağlar.

```bash
# Hangi modellerin kullanılabildiğini görün
ollama list
openclaw models list
```

Yeni bir model eklemek için onu Ollama ile çekmeniz yeterlidir:

```bash
ollama pull mistral
```

Yeni model otomatik olarak keşfedilecek ve kullanılabilir olacaktır.

<Note>
`models.providers.ollama` değerini açıkça ayarlarsanız otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir. Aşağıdaki açık yapılandırma bölümüne bakın.
</Note>

## Yapılandırma

<Tabs>
  <Tab title="Temel (örtük keşif)">
    Ollama’yı etkinleştirmenin en basit yolu ortam değişkenidir:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` ayarlanmışsa provider girdisinde `apiKey` alanını atlayabilirsiniz; OpenClaw bunu kullanılabilirlik kontrolleri için doldurur.
    </Tip>

  </Tab>

  <Tab title="Açık (elle modeller)">
    Ollama başka bir host/port üzerinde çalışıyorsa, belirli bağlam pencerelerini veya model listelerini zorlamak istiyorsanız ya da tamamen manuel model tanımları istiyorsanız açık yapılandırma kullanın.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            apiKey: "ollama-local",
            api: "ollama",
            models: [
              {
                id: "gpt-oss:20b",
                name: "GPT-OSS 20B",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8192,
                maxTokens: 8192 * 10
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Özel base URL">
    Ollama farklı bir host veya portta çalışıyorsa (açık yapılandırma otomatik keşfi devre dışı bırakır, bu nedenle modelleri elle tanımlayın):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 yok - yerel Ollama API URL'sini kullanın
            api: "ollama", // Yerel araç çağırma davranışını garanti etmek için açıkça ayarlayın
          },
        },
      },
    }
    ```

    <Warning>
    URL’ye `/v1` eklemeyin. `/v1` yolu, araç çağırmanın güvenilir olmadığı OpenAI uyumlu modu kullanır. Yol son eki olmayan temel Ollama URL’sini kullanın.
    </Warning>

  </Tab>
</Tabs>

### Model seçimi

Yapılandırıldıktan sonra tüm Ollama modelleriniz kullanılabilir olur:

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

## Ollama Web Search

OpenClaw, paketli bir `web_search` provider olarak **Ollama Web Search** destekler.

| Özellik     | Ayrıntı                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Host        | Yapılandırılmış Ollama host’unuzu kullanır (`models.providers.ollama.baseUrl` ayarlıysa onu, aksi halde `http://127.0.0.1:11434`) |
| Kimlik doğrulama | Anahtarsız                                                                                                   |
| Gereksinim  | Ollama çalışıyor olmalı ve `ollama signin` ile oturum açılmış olmalı                                               |

`openclaw onboard` veya `openclaw configure --section web` sırasında **Ollama Web Search** seçin ya da şunu ayarlayın:

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

<Note>
Tam kurulum ve davranış ayrıntıları için bkz. [Ollama Web Search](/tr/tools/ollama-search).
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Eski OpenAI uyumlu mod">
    <Warning>
    **Araç çağırma, OpenAI uyumlu modda güvenilir değildir.** Bu modu yalnızca bir proxy için OpenAI biçimine ihtiyacınız varsa ve yerel araç çağırma davranışına bağımlı değilseniz kullanın.
    </Warning>

    Bunun yerine OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa (örneğin yalnızca OpenAI biçimini destekleyen bir proxy arkasında), `api: "openai-completions"` değerini açıkça ayarlayın:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // varsayılan: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Bu mod, akışı ve araç çağırmayı aynı anda desteklemeyebilir. Model yapılandırmasında `params: { streaming: false }` ile akışı devre dışı bırakmanız gerekebilir.

    `api: "openai-completions"` Ollama ile kullanıldığında OpenClaw varsayılan olarak `options.num_ctx` enjekte eder; böylece Ollama sessizce 4096 bağlam penceresine geri dönmez. Proxy/yukarı akış bilinmeyen `options` alanlarını reddediyorsa bu davranışı devre dışı bırakın:

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

  <Accordion title="Bağlam pencereleri">
    Otomatik keşfedilen modeller için OpenClaw, mevcutsa Ollama tarafından bildirilen bağlam penceresini kullanır; aksi halde OpenClaw’ın kullandığı varsayılan Ollama bağlam penceresine geri döner.

    Açık provider yapılandırmasında `contextWindow` ve `maxTokens` değerlerini geçersiz kılabilirsiniz:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Akıl yürütme modelleri">
    OpenClaw, `deepseek-r1`, `reasoning` veya `think` gibi adlara sahip modelleri varsayılan olarak akıl yürütme yetenekli kabul eder.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Ek yapılandırma gerekmez -- OpenClaw bunları otomatik olarak işaretler.

  </Accordion>

  <Accordion title="Model maliyetleri">
    Ollama ücretsizdir ve yerelde çalışır; bu nedenle tüm model maliyetleri $0 olarak ayarlanır. Bu hem otomatik keşfedilen hem de elle tanımlanan modeller için geçerlidir.
  </Accordion>

  <Accordion title="Bellek embedding'leri">
    Paketli Ollama Plugin’i,
    [memory search](/tr/concepts/memory) için bir bellek embedding provider’ı kaydeder. Yapılandırılmış Ollama base URL’sini
    ve API anahtarını kullanır.

    | Özellik       | Değer               |
    | ------------- | ------------------- |
    | Varsayılan model | `nomic-embed-text`  |
    | Otomatik çekme   | Evet — embedding modeli yerelde yoksa otomatik olarak çekilir |

    Ollama’yı memory search embedding provider’ı olarak seçmek için:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Akış yapılandırması">
    OpenClaw’ın Ollama bütünleşmesi varsayılan olarak **yerel Ollama API’sini** (`/api/chat`) kullanır; bu API aynı anda hem akışı hem de araç çağırmayı tam olarak destekler. Özel bir yapılandırma gerekmez.

    <Tip>
    OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa yukarıdaki "Eski OpenAI uyumlu mod" bölümüne bakın. Bu modda akış ve araç çağırma aynı anda çalışmayabilir.
    </Tip>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Ollama algılanmadı">
    Ollama’nın çalıştığından, `OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ayarladığınızdan ve açık bir `models.providers.ollama` girdisi tanımlamadığınızdan **emin olun**:

    ```bash
    ollama serve
    ```

    API’nin erişilebilir olduğunu doğrulayın:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Kullanılabilir model yok">
    Modeliniz listelenmiyorsa, modeli ya yerelde çekin ya da `models.providers.ollama` içinde açıkça tanımlayın.

    ```bash
    ollama list  # Nelerin kurulu olduğunu görün
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Veya başka bir model
    ```

  </Accordion>

  <Accordion title="Bağlantı reddedildi">
    Ollama’nın doğru portta çalıştığını kontrol edin:

    ```bash
    # Ollama'nın çalışıp çalışmadığını kontrol edin
    ps aux | grep ollama

    # Veya Ollama'yı yeniden başlatın
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun Giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model provider'ları" href="/tr/concepts/model-providers" icon="layers">
    Tüm provider’lara, model başvurularına ve failover davranışına genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modelleri nasıl seçeceğiniz ve yapılandıracağınız.
  </Card>
  <Card title="Ollama Web Search" href="/tr/tools/ollama-search" icon="magnifying-glass">
    Ollama destekli web araması için tam kurulum ve davranış ayrıntıları.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
</CardGroup>
