---
read_when:
    - OpenClaw'ı Ollama üzerinden bulut veya yerel modellerle çalıştırmak istiyorsunuz
    - Ollama kurulumu ve yapılandırma yönlendirmesine ihtiyacınız var
    - Görsel anlama için Ollama vision modelleri istiyorsunuz
summary: OpenClaw'ı Ollama ile çalıştırın (bulut ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-04-24T09:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw, Ollama'nın yerel API'siyle (`/api/chat`) barındırılan bulut modelleri ve yerel/kendi barındırdığınız Ollama sunucuları için entegre olur. Ollama'yı üç kipte kullanabilirsiniz: erişilebilir bir Ollama ana bilgisayarı üzerinden `Cloud + Local`, `https://ollama.com` karşısında `Cloud only` veya erişilebilir bir Ollama ana bilgisayarı karşısında `Local only`.

<Warning>
**Uzak Ollama kullanıcıları**: OpenClaw ile `/v1` OpenAI uyumlu URL'sini (`http://host:11434/v1`) kullanmayın. Bu, araç çağrımını bozar ve modeller ham araç JSON'unu düz metin olarak çıkarabilir. Bunun yerine yerel Ollama API URL'sini kullanın: `baseUrl: "http://host:11434"` (`/v1` olmadan).
</Warning>

## Başlarken

Tercih ettiğiniz kurulum yöntemini ve kipi seçin.

<Tabs>
  <Tab title="Onboarding (önerilen)">
    **Şunun için en uygunu:** çalışan bir Ollama bulut veya yerel kurulumuna en hızlı yol.

    <Steps>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard
        ```

        Sağlayıcı listesinden **Ollama** seçin.
      </Step>
      <Step title="Kipinizi seçin">
        - **Cloud + Local** — yerel Ollama ana bilgisayarı artı bu ana bilgisayar üzerinden yönlendirilen bulut modelleri
        - **Cloud only** — `https://ollama.com` üzerinden barındırılan Ollama modelleri
        - **Local only** — yalnızca yerel modeller
      </Step>
      <Step title="Bir model seçin">
        `Cloud only`, `OLLAMA_API_KEY` ister ve barındırılan bulut varsayılanlarını önerir. `Cloud + Local` ve `Local only`, bir Ollama temel URL'si ister, kullanılabilir modelleri keşfeder ve seçilen yerel model henüz mevcut değilse otomatik olarak çeker. `Cloud + Local` ayrıca bu Ollama ana bilgisayarının bulut erişimi için oturum açmış olup olmadığını da kontrol eder.
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Etkileşimsiz kip

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    İsteğe bağlı olarak özel bir temel URL veya model belirtin:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Elle kurulum">
    **Şunun için en uygunu:** bulut veya yerel kurulum üzerinde tam denetim.

    <Steps>
      <Step title="Bulut veya yerel seçin">
        - **Cloud + Local**: Ollama'yı kurun, `ollama signin` ile oturum açın ve bulut isteklerini bu ana bilgisayar üzerinden yönlendirin
        - **Cloud only**: `https://ollama.com` adresini bir `OLLAMA_API_KEY` ile kullanın
        - **Local only**: Ollama'yı [ollama.com/download](https://ollama.com/download) adresinden kurun
      </Step>
      <Step title="Yerel bir model çekin (yalnızca yerel)">
        ```bash
        ollama pull gemma4
        # veya
        ollama pull gpt-oss:20b
        # veya
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw için Ollama'yı etkinleştirin">
        `Cloud only` için gerçek `OLLAMA_API_KEY` değerinizi kullanın. Ana bilgisayar destekli kurulumlar için herhangi bir yer tutucu değer çalışır:

        ```bash
        # Bulut
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Yalnızca yerel
        export OLLAMA_API_KEY="ollama-local"

        # Veya yapılandırma dosyanızda yapılandırın
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
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

## Bulut modelleri

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local`, hem yerel hem de bulut modelleri için denetim noktası olarak erişilebilir bir Ollama ana bilgisayarı kullanır. Bu, Ollama'nın tercih ettiği hibrit akıştır.

    Kurulum sırasında **Cloud + Local** kullanın. OpenClaw, Ollama temel URL'sini ister, o ana bilgisayardaki yerel modelleri keşfeder ve ana bilgisayarın `ollama signin` ile bulut erişimi için oturum açıp açmadığını kontrol eder. Ana bilgisayar oturum açmışsa OpenClaw ayrıca `kimi-k2.5:cloud`, `minimax-m2.7:cloud` ve `glm-5.1:cloud` gibi barındırılan bulut varsayılanlarını da önerir.

    Ana bilgisayar henüz oturum açmamışsa, `ollama signin` çalıştırana kadar OpenClaw kurulumu yalnızca yerel olarak tutar.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only`, Ollama'nın `https://ollama.com` adresindeki barındırılan API'si karşısında çalışır.

    Kurulum sırasında **Cloud only** kullanın. OpenClaw `OLLAMA_API_KEY` ister, `baseUrl: "https://ollama.com"` ayarlar ve barındırılan bulut model listesini tohumlar. Bu yol **yerel bir Ollama sunucusu veya** `ollama signin` gerektirmez.

    `openclaw onboard` sırasında gösterilen bulut model listesi, `https://ollama.com/api/tags` üzerinden canlı olarak doldurulur ve 500 girdide sınırlandırılır; böylece seçici sabit bir tohum yerine geçerli barındırılan kataloğu yansıtır. Kurulum sırasında `ollama.com` erişilemezse veya hiç model döndürmezse OpenClaw, onboarding yine de tamamlansın diye önceki sabit kodlanmış önerilere geri düşer.

  </Tab>

  <Tab title="Local only">
    Yalnızca yerel kipte OpenClaw, yapılandırılmış Ollama örneğinden modelleri keşfeder. Bu yol yerel veya kendi barındırdığınız Ollama sunucuları içindir.

    OpenClaw şu anda yerel varsayılan olarak `gemma4` önerir.

  </Tab>
</Tabs>

## Model keşfi (örtük sağlayıcı)

`OLLAMA_API_KEY` (veya bir auth profili) ayarladığınızda ve **`models.providers.ollama` tanımlamadığınızda**, OpenClaw modelleri `http://127.0.0.1:11434` adresindeki yerel Ollama örneğinden keşfeder.

| Davranış             | Ayrıntı                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalog sorgusu      | `/api/tags` sorgulanır                                                                                                                                             |
| Yetenek algılama     | `contextWindow` okumak ve yetenekleri (vision dâhil) algılamak için en iyi çaba `/api/show` sorguları kullanır                                                  |
| Vision modelleri     | `/api/show` tarafından `vision` yeteneği bildirilen modeller görsel yetenekli olarak işaretlenir (`input: ["text", "image"]`), böylece OpenClaw görselleri isteme otomatik enjekte eder |
| Akıl yürütme algılama | `reasoning`, model adı sezgiselliğiyle işaretlenir (`r1`, `reasoning`, `think`)                                                                                 |
| Belirteç sınırları   | `maxTokens`, OpenClaw'ın kullandığı varsayılan Ollama azami belirteç sınırına ayarlanır                                                                          |
| Maliyetler           | Tüm maliyetler `0` olarak ayarlanır                                                                                                                               |

Bu, kataloğu yerel Ollama örneğiyle uyumlu tutarken elle model girdisi gereksinimini ortadan kaldırır.

```bash
# Hangi modellerin kullanılabilir olduğunu görün
ollama list
openclaw models list
```

Yeni bir model eklemek için onu Ollama ile çekmeniz yeterlidir:

```bash
ollama pull mistral
```

Yeni model otomatik olarak keşfedilir ve kullanıma açılır.

<Note>
`models.providers.ollama` değerini açıkça ayarlarsanız otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir. Aşağıdaki açık yapılandırma bölümüne bakın.
</Note>

## Vision ve görsel açıklama

Paketle gelen Ollama Plugin'i, Ollama'yı görsel yetenekli bir medya-anlama sağlayıcısı olarak kaydeder. Bu, OpenClaw'ın açık görsel açıklama isteklerini ve yapılandırılmış varsayılan görsel modelini yerel veya barındırılan Ollama vision modelleri üzerinden yönlendirmesine olanak verir.

Yerel vision için görsel destekleyen bir model çekin:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Ardından infer CLI ile doğrulayın:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model`, tam bir `<provider/model>` başvurusu olmalıdır. Ayarlandığında `openclaw infer image describe`, model yerel vision desteklediği için açıklamayı atlamak yerine bu modeli doğrudan çalıştırır.

Gelen medya için Ollama'yı varsayılan görsel-anlama modeli yapmak üzere `agents.defaults.imageModel` yapılandırın:

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

`models.providers.ollama.models` değerini elle tanımlıyorsanız vision modellerini görsel girdi desteği ile işaretleyin:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw, görsel yetenekli olarak işaretlenmemiş modeller için görsel açıklama isteklerini reddeder. Örtük keşifle OpenClaw, `/api/show` vision yeteneği bildirdiğinde bunu Ollama'dan okur.

## Yapılandırma

<Tabs>
  <Tab title="Temel (örtük keşif)">
    En basit yalnızca yerel etkinleştirme yolu ortam değişkeni üzerinden yapılır:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` ayarlıysa sağlayıcı girdisinde `apiKey` alanını atlayabilirsiniz; OpenClaw bunu kullanılabilirlik denetimleri için doldurur.
    </Tip>

  </Tab>

  <Tab title="Açık (elle modeller)">
    Barındırılan bulut kurulumu istediğinizde, Ollama başka bir ana bilgisayarda/portta çalıştığında, belirli bağlam pencerelerini veya model listelerini zorlamak istediğinizde ya da tamamen elle model tanımları istediğinizde açık yapılandırma kullanın.

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

  <Tab title="Özel temel URL">
    Ollama farklı bir ana bilgisayarda veya portta çalışıyorsa (açık yapılandırma otomatik keşfi kapatır, bu yüzden modelleri elle tanımlayın):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 yok - yerel Ollama API URL'sini kullanın
            api: "ollama", // yerel araç çağırma davranışını garanti etmek için açıkça ayarlayın
          },
        },
      },
    }
    ```

    <Warning>
    URL'ye `/v1` eklemeyin. `/v1` yolu OpenAI uyumlu kip kullanır; burada araç çağırma güvenilir değildir. Yol son eki olmadan temel Ollama URL'sini kullanın.
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

OpenClaw, paketle gelen bir `web_search` sağlayıcısı olarak **Ollama Web Search** desteği sunar.

| Özellik    | Ayrıntı                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Host       | Yapılandırılmış Ollama ana bilgisayarınızı kullanır (`models.providers.ollama.baseUrl` ayarlıysa onu, aksi hâlde `http://127.0.0.1:11434`) |
| Kimlik doğrulama | Anahtarsız                                                                                                  |
| Gereksinim | Ollama çalışıyor olmalı ve `ollama signin` ile oturum açılmış olmalıdır                                          |

Kurulum sırasında `openclaw onboard` veya `openclaw configure --section web` içinde **Ollama Web Search** seçin ya da şunu ayarlayın:

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
  <Accordion title="Eski OpenAI uyumlu kip">
    <Warning>
    **Araç çağırma, OpenAI uyumlu kipte güvenilir değildir.** Bu kipi yalnızca bir proxy için OpenAI biçimine ihtiyaç duyuyorsanız ve yerel araç çağırma davranışına bağımlı değilseniz kullanın.
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

    Bu kip aynı anda akış ve araç çağırmayı desteklemeyebilir. Model yapılandırmasında `params: { streaming: false }` ile akışı kapatmanız gerekebilir.

    Ollama ile `api: "openai-completions"` kullanıldığında OpenClaw, Ollama'nın sessizce 4096 bağlam penceresine geri düşmemesi için varsayılan olarak `options.num_ctx` enjekte eder. Proxy/yukarı akış bilinmeyen `options` alanlarını reddediyorsa bu davranışı devre dışı bırakın:

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
    Otomatik keşfedilen modeller için OpenClaw, Ollama tarafından bildirilen bağlam penceresini kullanır; bu yoksa OpenClaw'ın kullandığı varsayılan Ollama bağlam penceresine geri düşer.

    Açık sağlayıcı yapılandırmasında `contextWindow` ve `maxTokens` değerlerini geçersiz kılabilirsiniz:

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
    OpenClaw varsayılan olarak `deepseek-r1`, `reasoning` veya `think` gibi adlara sahip modelleri akıl yürütme yetenekli kabul eder.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Ek yapılandırma gerekmez -- OpenClaw bunları otomatik olarak işaretler.

  </Accordion>

  <Accordion title="Model maliyetleri">
    Ollama ücretsizdir ve yerelde çalışır; bu nedenle tüm model maliyetleri $0 olarak ayarlanır. Bu, hem otomatik keşfedilen hem de elle tanımlanmış modeller için geçerlidir.
  </Accordion>

  <Accordion title="Bellek embeddings">
    Paketle gelen Ollama Plugin'i, [memory search](/tr/concepts/memory) için bir bellek embedding sağlayıcısı kaydeder. Yapılandırılmış Ollama base URL'sini ve API anahtarını kullanır.

    | Özellik        | Değer              |
    | -------------- | ------------------ |
    | Varsayılan model | `nomic-embed-text` |
    | Auto-pull      | Evet — embedding modeli yerelde yoksa otomatik olarak çekilir |

    Ollama'yı bellek arama embedding sağlayıcısı olarak seçmek için:

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
    OpenClaw'ın Ollama entegrasyonu varsayılan olarak **yerel Ollama API**'sini (`/api/chat`) kullanır; bu API aynı anda hem akışı hem de araç çağırmayı tam olarak destekler. Özel bir yapılandırma gerekmez.

    Yerel `/api/chat` istekleri için OpenClaw, thinking denetimini de doğrudan Ollama'ya iletir: `/think off` ve `openclaw agent --thinking off`, üst düzey `think: false` gönderirken; `off` dışındaki thinking düzeyleri `think: true` gönderir.

    <Tip>
    OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa yukarıdaki "Eski OpenAI uyumlu kip" bölümüne bakın. Bu kipte akış ve araç çağırma aynı anda çalışmayabilir.
    </Tip>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Ollama algılanmıyor">
    Ollama'nın çalıştığından, `OLLAMA_API_KEY` (veya bir auth profili) ayarladığınızdan ve açık bir `models.providers.ollama` girdisi tanımlamadığınızdan emin olun:

    ```bash
    ollama serve
    ```

    API'nin erişilebilir olduğunu doğrulayın:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Kullanılabilir model yok">
    Modeliniz listelenmiyorsa modeli yerelde çekin veya `models.providers.ollama` içinde açıkça tanımlayın.

    ```bash
    ollama list  # Kurulu olanları görün
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Veya başka bir model
    ```

  </Accordion>

  <Accordion title="Bağlantı reddedildi">
    Ollama'nın doğru portta çalıştığını kontrol edin:

    ```bash
    # Ollama'nın çalışıp çalışmadığını kontrol edin
    ps aux | grep ollama

    # Veya Ollama'yı yeniden başlatın
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılar, model başvuruları ve devretme davranışı için genel bakış.
  </Card>
  <Card title="Model selection" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="Ollama Web Search" href="/tr/tools/ollama-search" icon="magnifying-glass">
    Ollama destekli web arama için tam kurulum ve davranış ayrıntıları.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
</CardGroup>
