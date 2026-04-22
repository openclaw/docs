---
read_when:
    - Ollama aracılığıyla OpenClaw'ı bulut veya yerel modellerle çalıştırmak istiyorsunuz
    - Ollama kurulumu ve yapılandırma rehberliğine ihtiyacınız var
    - Görsel anlama için Ollama vision modelleri istiyorsunuz
summary: OpenClaw'ı Ollama ile çalıştırın (bulut ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw, barındırılan bulut modelleri ve yerel/kendi barındırdığınız Ollama sunucuları için Ollama'nın yerel API'si (`/api/chat`) ile bütünleşir. Ollama'yı üç modda kullanabilirsiniz: erişilebilir bir Ollama host üzerinden `Cloud + Local`, `https://ollama.com` karşısında `Cloud only` veya erişilebilir bir Ollama host karşısında `Local only`.

<Warning>
**Uzak Ollama kullanıcıları**: OpenClaw ile `/v1` OpenAI uyumlu URL'yi (`http://host:11434/v1`) kullanmayın. Bu, araç çağırmayı bozar ve modeller ham araç JSON'unu düz metin olarak çıkarabilir. Bunun yerine yerel Ollama API URL'sini kullanın: `baseUrl: "http://host:11434"` (`/v1` yok).
</Warning>

## Başlarken

Tercih ettiğiniz kurulum yöntemini ve modu seçin.

<Tabs>
  <Tab title="Onboarding (önerilen)">
    **Şunun için en iyisi:** çalışan bir Ollama bulut veya yerel kuruluma en hızlı yol.

    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard
        ```

        Sağlayıcı listesinden **Ollama** seçin.
      </Step>
      <Step title="Modunuzu seçin">
        - **Cloud + Local** — yerel Ollama host'u ve bu host üzerinden yönlendirilen bulut modelleri
        - **Cloud only** — `https://ollama.com` üzerinden barındırılan Ollama modelleri
        - **Local only** — yalnızca yerel modeller
      </Step>
      <Step title="Bir model seçin">
        `Cloud only`, `OLLAMA_API_KEY` ister ve barındırılan bulut varsayılanlarını önerir. `Cloud + Local` ve `Local only`, bir Ollama base URL'si ister, kullanılabilir modelleri keşfeder ve seçilen yerel model henüz mevcut değilse otomatik olarak çeker. `Cloud + Local` ayrıca o Ollama host'unun bulut erişimi için oturum açıp açmadığını da denetler.
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
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

    İsteğe bağlı olarak özel bir base URL veya model belirleyin:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Elle kurulum">
    **Şunun için en iyisi:** bulut veya yerel kurulum üzerinde tam denetim.

    <Steps>
      <Step title="Bulut veya yereli seçin">
        - **Cloud + Local**: Ollama'yı kurun, `ollama signin` ile oturum açın ve bulut isteklerini bu host üzerinden yönlendirin
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
        `Cloud only` için gerçek `OLLAMA_API_KEY` anahtarınızı kullanın. Host destekli kurulumlarda herhangi bir yer tutucu değer çalışır:

        ```bash
        # Bulut
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Yalnızca yerel
        export OLLAMA_API_KEY="ollama-local"

        # Veya config dosyanızda yapılandırın
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Modelinizi inceleyin ve ayarlayın">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Veya varsayılanı config içinde ayarlayın:

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
    `Cloud + Local`, hem yerel hem de bulut modeller için denetim noktası olarak erişilebilir bir Ollama host'u kullanır. Bu, Ollama'nın tercih ettiği hibrit akıştır.

    Kurulum sırasında **Cloud + Local** kullanın. OpenClaw, Ollama base URL'sini ister, o hosttan yerel modelleri keşfeder ve host'un `ollama signin` ile bulut erişimi için oturum açıp açmadığını denetler. Host oturum açmışsa OpenClaw, `kimi-k2.5:cloud`, `minimax-m2.7:cloud` ve `glm-5.1:cloud` gibi barındırılan bulut varsayılanlarını da önerir.

    Host henüz oturum açmamışsa OpenClaw, siz `ollama signin` çalıştırana kadar kurulumu yalnızca yerel olarak tutar.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only`, Ollama'nın `https://ollama.com` üzerindeki barındırılan API'sine karşı çalışır.

    Kurulum sırasında **Cloud only** kullanın. OpenClaw, `OLLAMA_API_KEY` ister, `baseUrl: "https://ollama.com"` ayarlar ve barındırılan bulut model listesini tohumlar. Bu yol bir yerel Ollama sunucusu veya `ollama signin` gerektirmez.

    `openclaw onboard` sırasında gösterilen bulut model listesi, `https://ollama.com/api/tags` adresinden canlı olarak doldurulur ve 500 giriş ile sınırlandırılır; böylece seçici statik bir tohum yerine mevcut barındırılan kataloğu yansıtır. Kurulum sırasında `ollama.com` erişilemezse veya model döndürmezse OpenClaw, onboarding'in yine tamamlanabilmesi için önceki sabit kodlanmış önerilere geri döner.

  </Tab>

  <Tab title="Local only">
    Yalnızca yerel modda OpenClaw, yapılandırılmış Ollama örneğinden modelleri keşfeder. Bu yol yerel veya kendi barındırdığınız Ollama sunucuları içindir.

    OpenClaw şu anda yerel varsayılan olarak `gemma4` önerir.

  </Tab>
</Tabs>

## Model keşfi (örtük sağlayıcı)

`OLLAMA_API_KEY` (veya bir auth profili) ayarladığınızda ve **`models.providers.ollama` tanımlamadığınızda**, OpenClaw modelleri `http://127.0.0.1:11434` adresindeki yerel Ollama örneğinden keşfeder.

| Davranış             | Ayrıntı                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalog sorgusu      | `/api/tags` sorgulanır                                                                                                                                                 |
| Yetenek algılama     | `contextWindow` değerini okumak ve yetenekleri (vision dahil) algılamak için best-effort `/api/show` aramaları kullanır                                              |
| Vision modelleri     | `/api/show` tarafından bildirilen `vision` yeteneğine sahip modeller, görsel destekli (`input: ["text", "image"]`) olarak işaretlenir; böylece OpenClaw görselleri isteme otomatik enjekte eder |
| Reasoning algılama   | `reasoning`, model adı sezgisiyle işaretlenir (`r1`, `reasoning`, `think`)                                                                                            |
| Token sınırları      | `maxTokens`, OpenClaw tarafından kullanılan varsayılan Ollama maksimum token sınırına ayarlanır                                                                        |
| Maliyetler           | Tüm maliyetler `0` olarak ayarlanır                                                                                                                                     |

Bu, kataloğu yerel Ollama örneğiyle uyumlu tutarken manuel model girişlerinden kaçınır.

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

Paketle gelen Ollama plugin'i, Ollama'yı görsel destekli bir medya anlama sağlayıcısı olarak kaydeder. Bu, OpenClaw'ın açık görsel açıklama isteklerini ve yapılandırılmış görsel model varsayılanlarını yerel veya barındırılan Ollama vision modelleri üzerinden yönlendirmesini sağlar.

Yerel vision için görselleri destekleyen bir model çekin:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Sonra infer CLI ile doğrulayın:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` tam bir `<provider/model>` ref'i olmalıdır. Ayarlandığında `openclaw infer image describe`, model yerel vision desteklediği için açıklamayı atlamak yerine o modeli doğrudan çalıştırır.

Gelen medya için Ollama'yı varsayılan görsel anlama modeli yapmak üzere `agents.defaults.imageModel` yapılandırın:

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

`models.providers.ollama.models` değerini elle tanımlarsanız vision modellerini görsel girdi desteğiyle işaretleyin:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw, görsel destekli olarak işaretlenmemiş modeller için görsel açıklama isteklerini reddeder. Örtük keşifte OpenClaw bunu, `/api/show` bir vision yeteneği bildirdiğinde Ollama'dan okur.

## Yapılandırma

<Tabs>
  <Tab title="Temel (örtük keşif)">
    En basit yalnızca yerel etkinleştirme yolu ortam değişkeni kullanmaktır:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` ayarlıysa sağlayıcı girdisinde `apiKey` alanını atlayabilirsiniz; OpenClaw bunu kullanılabilirlik denetimleri için doldurur.
    </Tip>

  </Tab>

  <Tab title="Açık (elle modeller)">
    Barındırılan bulut kurulumu istediğinizde, Ollama başka bir host/bağlantı noktasında çalıştığında, belirli bağlam pencerelerini veya model listelerini zorlamak istediğinizde ya da tamamen manuel model tanımları istediğinizde açık yapılandırmayı kullanın.

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

  <Tab title="Özel base URL">
    Ollama farklı bir host veya bağlantı noktasında çalışıyorsa (açık yapılandırma otomatik keşfi devre dışı bırakır, bu yüzden modelleri elle tanımlayın):

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
    URL'ye `/v1` eklemeyin. `/v1` yolu OpenAI uyumlu modu kullanır; burada araç çağırma güvenilir değildir. Yol son eki olmayan temel Ollama URL'sini kullanın.
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

| Özellik    | Ayrıntı                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Host        | Yapılandırılmış Ollama host'unuzu kullanır (`models.providers.ollama.baseUrl` ayarlıysa onu, aksi halde `http://127.0.0.1:11434`) |
| Kimlik doğrulama | Anahtar gerektirmez                                                                                           |
| Gereksinim | Ollama çalışıyor olmalı ve `ollama signin` ile oturum açılmış olmalı                                                |

Kurulum sırasında **Ollama Web Search** seçin `openclaw onboard` veya `openclaw configure --section web`, ya da şunu ayarlayın:

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
Tam kurulum ve davranış ayrıntıları için [Ollama Web Search](/tr/tools/ollama-search) bölümüne bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Eski OpenAI uyumlu mod">
    <Warning>
    **Araç çağırma, OpenAI uyumlu modda güvenilir değildir.** Bu modu yalnızca bir proxy için OpenAI biçimine ihtiyacınız varsa ve yerel araç çağırma davranışına bağlı değilseniz kullanın.
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

    Bu mod aynı anda akış ve araç çağırmayı desteklemeyebilir. Model config içinde `params: { streaming: false }` ile akışı devre dışı bırakmanız gerekebilir.

    `api: "openai-completions"` Ollama ile kullanıldığında OpenClaw varsayılan olarak `options.num_ctx` enjekte eder; böylece Ollama sessizce 4096 bağlam penceresine geri düşmez. Proxy/upstream bilinmeyen `options` alanlarını reddediyorsa bu davranışı devre dışı bırakın:

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
    Otomatik keşfedilen modeller için OpenClaw, mevcut olduğunda Ollama tarafından bildirilen bağlam penceresini kullanır; aksi halde OpenClaw tarafından kullanılan varsayılan Ollama bağlam penceresine geri döner.

    Açık sağlayıcı config'inde `contextWindow` ve `maxTokens` değerlerini geçersiz kılabilirsiniz:

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

  <Accordion title="Reasoning modelleri">
    OpenClaw, varsayılan olarak `deepseek-r1`, `reasoning` veya `think` gibi ada sahip modelleri reasoning yetenekli olarak değerlendirir.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Ek yapılandırma gerekmez -- OpenClaw bunları otomatik olarak işaretler.

  </Accordion>

  <Accordion title="Model maliyetleri">
    Ollama ücretsizdir ve yerelde çalışır, bu nedenle tüm model maliyetleri $0 olarak ayarlanır. Bu hem otomatik keşfedilen hem de elle tanımlanan modeller için geçerlidir.
  </Accordion>

  <Accordion title="Bellek embedding'leri">
    Paketle gelen Ollama plugin'i,
    [bellek araması](/tr/concepts/memory) için bir bellek embedding sağlayıcısı kaydeder. Yapılandırılmış Ollama base URL'sini
    ve API anahtarını kullanır.

    | Özellik       | Değer              |
    | ------------- | ------------------ |
    | Varsayılan model | `nomic-embed-text`  |
    | Otomatik çekme | Evet — embedding modeli yerelde mevcut değilse otomatik olarak çekilir |

    Ollama'yı bellek araması embedding sağlayıcısı olarak seçmek için:

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
    OpenClaw'ın Ollama bütünleşimi varsayılan olarak **yerel Ollama API'sini** (`/api/chat`) kullanır; bu, aynı anda hem akışı hem de araç çağırmayı tam olarak destekler. Özel bir yapılandırma gerekmez.

    <Tip>
    OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa yukarıdaki "Eski OpenAI uyumlu mod" bölümüne bakın. Bu modda akış ve araç çağırma aynı anda çalışmayabilir.
    </Tip>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Ollama algılanmadı">
    Ollama'nın çalıştığından, `OLLAMA_API_KEY` (veya bir auth profili) ayarladığınızdan ve **açık bir `models.providers.ollama` girdisi tanımlamadığınızdan** emin olun:

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
    ollama list  # Yüklü olanları görün
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Veya başka bir model
    ```

  </Accordion>

  <Accordion title="Bağlantı reddedildi">
    Ollama'nın doğru bağlantı noktasında çalıştığını denetleyin:

    ```bash
    # Ollama'nın çalışıp çalışmadığını denetleyin
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
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model ref'lerine ve failover davranışına genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modeller nasıl seçilir ve yapılandırılır.
  </Card>
  <Card title="Ollama Web Search" href="/tr/tools/ollama-search" icon="magnifying-glass">
    Ollama destekli web araması için tam kurulum ve davranış ayrıntıları.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam config referansı.
  </Card>
</CardGroup>
