---
read_when:
    - OpenClaw'ı Ollama aracılığıyla bulut veya yerel modellerle çalıştırmak istiyorsunuz
    - Ollama kurulumu ve yapılandırma rehberliğine ihtiyacınız var
    - Görüntü anlama için Ollama görme modelleri istiyorsunuz
summary: OpenClaw'u Ollama ile çalıştırın (bulut ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-06-28T01:11:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw, barındırılan bulut modelleri ve yerel/kendi barındırdığınız Ollama sunucuları için Ollama'nın yerel API'siyle (`/api/chat`) entegre olur. Ollama'yı üç modda kullanabilirsiniz: erişilebilir bir Ollama ana makinesi üzerinden `Cloud + Local`, `https://ollama.com` karşısında `Cloud only` veya erişilebilir bir Ollama ana makinesi karşısında `Local only`.

OpenClaw ayrıca doğrudan Ollama Cloud kullanımı için birinci sınıf barındırılan sağlayıcı kimliği olarak `ollama-cloud` kaydeder. Yerel `ollama` sağlayıcı kimliğini paylaşmadan yalnızca buluta yönlendirme istediğinizde `ollama-cloud/kimi-k2.5:cloud` gibi referanslar kullanın.

Özel yalnızca bulut kurulum sayfası için bkz. [Ollama Cloud](/tr/providers/ollama-cloud).

<Warning>
**Uzak Ollama kullanıcıları**: OpenClaw ile `/v1` OpenAI uyumlu URL'yi (`http://host:11434/v1`) kullanmayın. Bu, araç çağırmayı bozar ve modeller ham araç JSON'unu düz metin olarak çıkarabilir. Bunun yerine yerel Ollama API URL'sini kullanın: `baseUrl: "http://host:11434"` (`/v1` yok).
</Warning>

Ollama sağlayıcı yapılandırması, kurallı anahtar olarak `baseUrl` kullanır. OpenClaw, OpenAI SDK tarzı örneklerle uyumluluk için `baseURL` değerini de kabul eder, ancak yeni yapılandırma `baseUrl` değerini tercih etmelidir.

## Kimlik doğrulama kuralları

<AccordionGroup>
  <Accordion title="Yerel ve LAN ana makineleri">
    Yerel ve LAN Ollama ana makinelerinin gerçek bir bearer token'a ihtiyacı yoktur. OpenClaw, yerel `ollama-local` işaretçisini yalnızca loopback, özel ağ, `.local` ve çıplak ana makine adlı Ollama temel URL'leri için kullanır.
  </Accordion>
  <Accordion title="Uzak ve Ollama Cloud ana makineleri">
    Uzak genel ana makineler ve Ollama Cloud (`https://ollama.com`), `OLLAMA_API_KEY`, bir kimlik doğrulama profili veya sağlayıcının `apiKey` değeri üzerinden gerçek bir kimlik bilgisi gerektirir. Doğrudan barındırılan kullanım için sağlayıcı `ollama-cloud` değerini tercih edin.
  </Accordion>
  <Accordion title="Özel sağlayıcı kimlikleri">
    `api: "ollama"` ayarlayan özel sağlayıcı kimlikleri aynı kuralları izler. Örneğin, özel bir LAN Ollama ana makinesini işaret eden bir `ollama-remote` sağlayıcısı `apiKey: "ollama-local"` kullanabilir ve alt ajanlar, bu işaretçiyi eksik kimlik bilgisi olarak ele almak yerine Ollama sağlayıcı hook'u üzerinden çözer. Bellek araması da `agents.defaults.memorySearch.provider` değerini bu özel sağlayıcı kimliğine ayarlayabilir; böylece embedding'ler eşleşen Ollama uç noktasını kullanır.
  </Accordion>
  <Accordion title="Kimlik doğrulama profilleri">
    `auth-profiles.json`, bir sağlayıcı kimliği için kimlik bilgisini saklar. Uç nokta ayarlarını (`baseUrl`, `api`, model kimlikleri, başlıklar, zaman aşımları) `models.providers.<id>` içine koyun. `{ "ollama-windows": { "apiKey": "ollama-local" } }` gibi eski düz kimlik doğrulama profili dosyaları çalışma zamanı biçimi değildir; bunları yedekle birlikte kurallı `ollama-windows:default` API anahtarı profiline yeniden yazmak için `openclaw doctor --fix` çalıştırın. Bu dosyadaki `baseUrl` uyumluluk gürültüsüdür ve sağlayıcı yapılandırmasına taşınmalıdır.
  </Accordion>
  <Accordion title="Bellek embedding kapsamı">
    Ollama bellek embedding'leri için kullanıldığında, bearer kimlik doğrulaması bildirildiği ana makineyle sınırlandırılır:

    - Sağlayıcı düzeyindeki anahtar yalnızca o sağlayıcının Ollama ana makinesine gönderilir.
    - `agents.*.memorySearch.remote.apiKey` yalnızca kendi uzak embedding ana makinesine gönderilir.
    - Saf bir `OLLAMA_API_KEY` ortam değeri, Ollama Cloud geleneği olarak ele alınır; varsayılan olarak yerel veya kendi barındırılan ana makinelere gönderilmez.

  </Accordion>
</AccordionGroup>

## Başlarken

Tercih ettiğiniz kurulum yöntemini ve modunu seçin.

<Tabs>
  <Tab title="İlk kurulum (önerilir)">
    **En uygun olduğu durum:** çalışan bir Ollama bulut veya yerel kurulumuna giden en hızlı yol.

    <Steps>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard
        ```

        Sağlayıcı listesinden **Ollama** seçin.
      </Step>
      <Step title="Modunuzu seçin">
        - **Bulut + Yerel** — yerel Ollama ana makinesi ve bu ana makine üzerinden yönlendirilen bulut modelleri
        - **Yalnızca bulut** — `https://ollama.com` üzerinden barındırılan Ollama modelleri
        - **Yalnızca yerel** — yalnızca yerel modeller

      </Step>
      <Step title="Bir model seçin">
        `Cloud only`, `OLLAMA_API_KEY` ister ve barındırılan bulut varsayılanlarını önerir. `Cloud + Local` ve `Local only`, bir Ollama temel URL'si ister, kullanılabilir modelleri keşfeder ve seçilen yerel model henüz kullanılabilir değilse otomatik olarak çeker. Ollama, `gemma4:latest` gibi kurulu bir `:latest` etiketi bildirdiğinde, kurulum hem `gemma4` hem de `gemma4:latest` göstermek veya çıplak takma adı yeniden çekmek yerine bu kurulu modeli bir kez gösterir. `Cloud + Local` ayrıca bu Ollama ana makinesinin bulut erişimi için oturum açmış olup olmadığını kontrol eder.
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

    İsteğe bağlı olarak özel bir temel URL veya model belirtin:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manuel kurulum">
    **En uygun olduğu durum:** bulut veya yerel kurulum üzerinde tam kontrol.

    <Steps>
      <Step title="Bulut veya yerel seçin">
        - **Bulut + Yerel**: Ollama'yı kurun, `ollama signin` ile oturum açın ve bulut isteklerini bu ana makine üzerinden yönlendirin
        - **Yalnızca bulut**: `OLLAMA_API_KEY` ile `https://ollama.com` kullanın
        - **Yalnızca yerel**: Ollama'yı [ollama.com/download](https://ollama.com/download) adresinden kurun

      </Step>
      <Step title="Yerel bir model çekin (yalnızca yerel)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw için Ollama'yı etkinleştirin">
        `Cloud only` için gerçek `OLLAMA_API_KEY` değerinizi kullanın. Ana makine destekli kurulumlar için herhangi bir yer tutucu değer çalışır:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Modelinizi inceleyin ve ayarlayın">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Veya yapılandırmada varsayılanı ayarlayın:

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
  <Tab title="Bulut + Yerel">
    `Cloud + Local`, hem yerel hem de bulut modelleri için denetim noktası olarak erişilebilir bir Ollama ana makinesi kullanır. Bu, Ollama'nın tercih ettiği hibrit akıştır.

    Kurulum sırasında **Bulut + Yerel** kullanın. OpenClaw, Ollama temel URL'sini ister, o ana makineden yerel modelleri keşfeder ve ana makinenin `ollama signin` ile bulut erişimi için oturum açmış olup olmadığını kontrol eder. Ana makine oturum açmışsa OpenClaw ayrıca `kimi-k2.5:cloud`, `minimax-m2.7:cloud` ve `glm-5.1:cloud` gibi barındırılan bulut varsayılanlarını önerir.

    Ana makine henüz oturum açmamışsa, OpenClaw siz `ollama signin` çalıştırana kadar kurulumu yalnızca yerel tutar.

  </Tab>

  <Tab title="Yalnızca bulut">
    `Cloud only`, `https://ollama.com` adresindeki Ollama'nın barındırılan API'sine karşı çalışır.

    Kurulum sırasında **Yalnızca bulut** kullanın. OpenClaw, `OLLAMA_API_KEY` ister, `baseUrl: "https://ollama.com"` ayarlar ve barındırılan bulut model listesini başlangıç verisi olarak ekler. Bu yol, yerel bir Ollama sunucusu veya `ollama signin` gerektirmez.

    `openclaw onboard` sırasında gösterilen bulut model listesi canlı olarak `https://ollama.com/api/tags` üzerinden doldurulur ve 500 girişle sınırlandırılır; böylece seçici, statik bir başlangıç listesi yerine güncel barındırılan kataloğu yansıtır. `ollama.com` erişilemezse veya kurulum sırasında hiç model döndürmezse, OpenClaw önceki sabit kodlanmış önerilere geri döner; böylece ilk kurulum yine tamamlanır.

    Birinci sınıf bulut sağlayıcısını doğrudan da yapılandırabilirsiniz:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Yalnızca yerel">
    Yalnızca yerel modda, OpenClaw modelleri yapılandırılmış Ollama örneğinden keşfeder. Bu yol, yerel veya kendi barındırılan Ollama sunucuları içindir.

    OpenClaw şu anda yerel varsayılan olarak `gemma4` önerir.

  </Tab>
</Tabs>

## Model keşfi (örtük sağlayıcı)

`OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ayarladığınızda ve `models.providers.ollama` ya da `api: "ollama"` içeren başka bir özel uzak sağlayıcı tanımlamadığınızda, OpenClaw modelleri `http://127.0.0.1:11434` adresindeki yerel Ollama örneğinden keşfeder.

| Davranış             | Ayrıntı                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalog sorgusu      | `/api/tags` sorgular                                                                                                                                                 |
| Yetenek algılama     | `contextWindow`, genişletilmiş `num_ctx` Modelfile parametreleri ve görme/araçlar dahil yetenekleri okumak için en iyi çaba `/api/show` aramalarını kullanır        |
| Görme modelleri      | `/api/show` tarafından bildirilen `vision` yeteneğine sahip modeller, görüntü yetenekli (`input: ["text", "image"]`) olarak işaretlenir; bu nedenle OpenClaw görüntüleri isteme otomatik olarak ekler |
| Akıl yürütme algılama | Kullanılabilir olduğunda `thinking` dahil `/api/show` yeteneklerini kullanır; Ollama yetenekleri atladığında model adı sezgisel yöntemine (`r1`, `reasoning`, `think`) geri döner |
| Token sınırları      | `maxTokens` değerini OpenClaw tarafından kullanılan varsayılan Ollama maksimum token üst sınırına ayarlar                                                            |
| Maliyetler           | Tüm maliyetleri `0` olarak ayarlar                                                                                                                                   |

Bu, kataloğu yerel Ollama örneğiyle hizalı tutarken manuel model girişlerinden kaçınır. Yerel `infer model run` içinde `ollama/<pulled-model>:latest` gibi tam bir referans kullanabilirsiniz; OpenClaw bu kurulu modeli, el yazımı bir `models.json` girdisi gerektirmeden Ollama'nın canlı kataloğundan çözer.

Oturum açılmış Ollama ana makineleri için bazı `:cloud` modelleri `/api/tags` içinde görünmeden önce `/api/chat` ve `/api/show` üzerinden kullanılabilir olabilir. Tam bir `ollama/<model>:cloud` referansını açıkça seçtiğinizde, OpenClaw eksik olan bu tam modeli `/api/show` ile doğrular ve yalnızca Ollama model metadata'sını onaylarsa çalışma zamanı kataloğuna ekler. Yazım hataları, otomatik oluşturulmak yerine bilinmeyen model olarak başarısız olmaya devam eder.

```bash
# See what models are available
ollama list
openclaw models list
```

Tam ajan araç yüzeyinden kaçınan dar bir metin üretimi smoke testi için, tam bir Ollama model referansıyla yerel `infer model run` kullanın:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Bu yol yine de OpenClaw'ın yapılandırılmış sağlayıcısını, kimlik doğrulamasını ve yerel Ollama aktarımını kullanır, ancak bir sohbet ajanı turu başlatmaz veya MCP/araç bağlamı yüklemez. Bu başarılı olurken normal ajan yanıtları başarısız oluyorsa, sonraki adımda modelin ajan istemi/araç kapasitesini sorun giderin.

Aynı sade yolda dar bir görme modeli smoke testi için `infer model run` komutuna bir veya daha fazla görüntü dosyası ekleyin. Bu, sohbet araçlarını, belleği veya önceki oturum bağlamını yüklemeden istemi ve görüntüyü doğrudan seçilen Ollama görme modeline gönderir:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file`, yaygın PNG, JPEG ve WebP girdileri dahil olmak üzere `image/*` olarak algılanan dosyaları kabul eder. Görüntü olmayan dosyalar Ollama çağrılmadan önce reddedilir. Konuşma tanıma için bunun yerine `openclaw infer audio transcribe` kullanın.

Bir konuşmayı `/model ollama/<model>` ile değiştirdiğinizde, OpenClaw bunu tam bir kullanıcı seçimi olarak ele alır. Yapılandırılmış Ollama `baseUrl` erişilemez durumdaysa, sonraki yanıt başka bir yapılandırılmış yedek modelden sessizce yanıtlamak yerine provider hatasıyla başarısız olur.

Yalıtılmış cron işleri, agent dönüşünü başlatmadan önce bir ek yerel güvenlik denetimi yapar. Seçilen model yerel, özel ağ ya da `.local` Ollama provider'ına çözümlenirse ve `/api/tags` erişilemezse, OpenClaw bu cron çalıştırmasını hata metninde seçilen `ollama/<model>` ile `skipped` olarak kaydeder. Endpoint ön denetimi 5 dakika önbelleğe alınır; bu yüzden aynı durdurulmuş Ollama daemon'una yönlendirilmiş birden fazla cron işi, hepsi başarısız model istekleri başlatmaz.

Yerel metin yolunu, native stream yolunu ve embeddings'i yerel Ollama'ya karşı canlı doğrulamak için:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud API anahtarı smoke testleri için canlı testi `https://ollama.com` adresine yönlendirin ve mevcut katalogdan barındırılan bir model seçin:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Cloud smoke testi metin, native stream ve web search çalıştırır. `https://ollama.com` için embeddings'i varsayılan olarak atlar, çünkü Ollama Cloud API anahtarları `/api/embed` için yetki vermeyebilir. Yapılandırılmış cloud anahtarı embed endpoint'ini kullanamıyorsa canlı testin açıkça başarısız olmasını istediğinizde `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` ayarlayın.

Yeni bir model eklemek için modeli Ollama ile çekmeniz yeterlidir:

```bash
ollama pull mistral
```

Yeni model otomatik olarak keşfedilecek ve kullanıma hazır olacaktır.

<Note>
`models.providers.ollama` değerini açıkça ayarlarsanız veya `api: "ollama"` ile `models.providers.ollama-cloud` gibi özel bir uzak provider yapılandırırsanız, otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir. `http://127.0.0.2:11434` gibi loopback özel provider'lar hâlâ yerel olarak ele alınır. Aşağıdaki açık yapılandırma bölümüne bakın.
</Note>

## Vision ve görüntü açıklaması

Birlikte gelen Ollama Plugin'i, Ollama'yı görüntü yetenekli bir medya anlama provider'ı olarak kaydeder. Bu, OpenClaw'ın açık görüntü açıklama isteklerini ve yapılandırılmış görüntü modeli varsayılanlarını yerel ya da barındırılan Ollama vision modelleri üzerinden yönlendirmesini sağlar.

Yerel vision için görüntüleri destekleyen bir model çekin:

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

`--model` tam bir `<provider/model>` ref olmalıdır. Ayarlandığında, `openclaw infer image describe` model native vision desteklediği için açıklamayı atlamak yerine bu modeli doğrudan çalıştırır.

OpenClaw'ın görüntü anlama provider akışını, yapılandırılmış `agents.defaults.imageModel` değerini ve görüntü açıklama çıktı şeklini istediğinizde `infer image describe` kullanın. Özel bir prompt ve bir ya da daha fazla görüntüyle ham bir multimodal model yoklaması istediğinizde `infer model run --file` kullanın.

Ollama'yı gelen medya için varsayılan görüntü anlama modeli yapmak üzere `agents.defaults.imageModel` yapılandırın:

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

Tam `ollama/<model>` ref'ini tercih edin. Aynı model `models.providers.ollama.models` altında `input: ["text", "image"]` ile listelenmişse ve yapılandırılmış başka hiçbir görüntü provider'ı bu yalın model kimliğini sunmuyorsa, OpenClaw `qwen2.5vl:7b` gibi yalın bir `imageModel` ref'ini de `ollama/qwen2.5vl:7b` olarak normalleştirir. Birden fazla yapılandırılmış görüntü provider'ı aynı yalın kimliğe sahipse, provider önekini açıkça kullanın.

Yavaş yerel vision modelleri, cloud modellerden daha uzun bir görüntü anlama zaman aşımına ihtiyaç duyabilir. Ollama kısıtlı donanımda tam ilan edilen vision context'ini ayırmaya çalıştığında çökebilir veya durabilirler. Yalnızca normal bir görüntü açıklama dönüşüne ihtiyacınız olduğunda bir capability zaman aşımı ayarlayın ve model girdisinde `num_ctx` değerini sınırlayın:

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

Bu zaman aşımı, gelen görüntü anlamaya ve agent'ın bir dönüş sırasında çağırabileceği açık `image` tool'una uygulanır. Provider düzeyindeki `models.providers.ollama.timeoutSeconds`, normal model çağrıları için alttaki Ollama HTTP isteği korumasını denetlemeye devam eder.

Açık image tool'u yerel Ollama'ya karşı canlı doğrulamak için:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` değerini elle tanımlarsanız, vision modellerini görüntü girdisi desteğiyle işaretleyin:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw, görüntü yetenekli olarak işaretlenmemiş modeller için görüntü açıklama isteklerini reddeder. Örtük keşifte OpenClaw bunu, `/api/show` bir vision capability bildirdiğinde Ollama'dan okur.

## Yapılandırma

<Tabs>
  <Tab title="Temel (örtük keşif)">
    En basit yalnızca yerel etkinleştirme yolu ortam değişkeni üzerindendir:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` ayarlanmışsa, provider girdisinde `apiKey` değerini atlayabilirsiniz; OpenClaw kullanılabilirlik denetimleri için bunu doldurur.
    </Tip>

  </Tab>

  <Tab title="Açık (elle modeller)">
    Barındırılan cloud kurulumu istediğinizde, Ollama başka bir host/port üzerinde çalıştığında, belirli context window'ları veya model listelerini zorlamak istediğinizde ya da tamamen elle model tanımları istediğinizde açık yapılandırma kullanın.

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
    Ollama farklı bir host veya port üzerinde çalışıyorsa (açık yapılandırma otomatik keşfi devre dışı bırakır, bu yüzden modelleri elle tanımlayın):

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
    URL'ye `/v1` eklemeyin. `/v1` yolu OpenAI uyumlu modu kullanır; burada tool calling güvenilir değildir. Yol soneki olmadan temel Ollama URL'sini kullanın.
    </Warning>

  </Tab>
</Tabs>

## Yaygın tarifler

Bunları başlangıç noktası olarak kullanın ve model kimliklerini `ollama list` veya `openclaw models list --provider ollama` çıktısındaki tam adlarla değiştirin.

<AccordionGroup>
  <Accordion title="Otomatik keşifli yerel model">
    Ollama Gateway ile aynı makinede çalıştığında ve OpenClaw'ın yüklü modelleri otomatik olarak keşfetmesini istediğinizde bunu kullanın.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Bu yol yapılandırmayı en az düzeyde tutar. Modelleri elle tanımlamak istemediğiniz sürece `models.providers.ollama` bloğu eklemeyin.

  </Accordion>

  <Accordion title="Elle modellerle LAN Ollama host'u">
    LAN host'ları için native Ollama URL'leri kullanın. `/v1` eklemeyin.

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

    `contextWindow`, OpenClaw tarafındaki context bütçesidir. `params.num_ctx`, istek için Ollama'ya gönderilir. Donanımınız modelin tam ilan edilen context'ini çalıştıramadığında bunları uyumlu tutun.

  </Accordion>

  <Accordion title="Yalnızca Ollama Cloud">
    Yerel daemon çalıştırmadığınızda ve barındırılan Ollama modellerini doğrudan istediğinizde bunu kullanın.

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

  <Accordion title="Oturum açılmış daemon üzerinden cloud artı yerel">
    Yerel veya LAN Ollama daemon'u `ollama signin` ile oturum açmışsa ve hem yerel modelleri hem de `:cloud` modellerini sunması gerekiyorsa bunu kullanın.

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

  <Accordion title="Birden fazla Ollama host'u">
    Birden fazla Ollama sunucunuz olduğunda özel provider kimlikleri kullanın. Her provider kendi host'unu, modellerini, auth'unu, zaman aşımını ve model ref'lerini alır.

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

    OpenClaw isteği gönderdiğinde, etkin sağlayıcı ön eki çıkarılır; böylece `ollama-large/qwen3.5:27b`, Ollama'ya `qwen3.5:27b` olarak ulaşır.

  </Accordion>

  <Accordion title="Lean local model profile">
    Bazı yerel modeller basit istemleri yanıtlayabilir ancak tam ajan araç yüzeyiyle zorlanabilir. Genel çalışma zamanı ayarlarını değiştirmeden önce araçları ve bağlamı sınırlayarak başlayın.

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

    `compat.supportsTools: false` yalnızca model veya sunucu araç şemalarında güvenilir biçimde başarısız olduğunda kullanın. Bu, kararlılık karşılığında ajan yetkinliğinden ödün verir.
    `localModelLean`, doğrudan ajan yüzeyinden tarayıcı, cron ve mesaj araçlarını kaldırır ve daha büyük katalogları, bir çalıştırmanın doğrudan mesaj teslimi semantiğini koruması gerekmediği durumlarda yapılandırılmış Araç Arama denetimlerinin arkasında varsayılan hale getirir; ancak Ollama'nın çalışma zamanı bağlamını veya düşünme modunu değiştirmez. Döngüye giren veya yanıt bütçesini gizli akıl yürütmeye harcayan küçük Qwen tarzı düşünme modelleri için bunu açık `params.num_ctx` ve `params.thinking: false` ile birlikte kullanın.

  </Accordion>
</AccordionGroup>

### Model seçimi

Yapılandırıldıktan sonra tüm Ollama modelleriniz kullanılabilir:

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

Özel Ollama sağlayıcı kimlikleri de desteklenir. Bir model başvurusu etkin
sağlayıcı ön ekini kullandığında, örneğin `ollama-spark/qwen3:32b`, OpenClaw
Ollama'yı çağırmadan önce yalnızca bu ön eki çıkarır; böylece sunucu `qwen3:32b`
alır.

Yavaş yerel modeller için tüm ajan çalışma zamanı zaman aşımını artırmadan önce
sağlayıcı kapsamlı istek ayarlarını tercih edin:

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

`timeoutSeconds`, bağlantı kurulumu, başlıklar, gövde akışı ve toplam korumalı getirme iptali dahil olmak üzere model HTTP isteğine uygulanır. `params.keep_alive`,
yerel `/api/chat` isteklerinde üst düzey `keep_alive` olarak Ollama'ya iletilir;
ilk tur yükleme süresi darboğaz olduğunda bunu model başına ayarlayın.

### Hızlı doğrulama

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

Uzak ana makineler için `127.0.0.1` yerine `baseUrl` içinde kullanılan ana makineyi yazın. `curl` çalışıyor ancak OpenClaw çalışmıyorsa, Gateway'in farklı bir makinede, konteynerde veya hizmet hesabında çalışıp çalışmadığını kontrol edin.

## Ollama Web Arama

OpenClaw, **Ollama Web Arama** özelliğini paketlenmiş bir `web_search` sağlayıcısı olarak destekler.

| Özellik     | Ayrıntı                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ana makine  | Yapılandırılmış Ollama ana makinenizi kullanır (`models.providers.ollama.baseUrl` ayarlanmışsa o, aksi halde `http://127.0.0.1:11434`); `https://ollama.com` barındırılan API'yi doğrudan kullanır |
| Kimlik doğrulama | Oturum açılmış yerel Ollama ana makineleri için anahtarsızdır; doğrudan `https://ollama.com` araması veya kimlik doğrulama korumalı ana makineler için `OLLAMA_API_KEY` ya da yapılandırılmış sağlayıcı kimlik doğrulaması |
| Gereksinim  | Yerel/kendi kendine barındırılan ana makineler çalışıyor ve `ollama signin` ile oturum açmış olmalıdır; doğrudan barındırılan arama için `baseUrl: "https://ollama.com"` ve gerçek bir Ollama API anahtarı gerekir |

`openclaw onboard` veya `openclaw configure --section web` sırasında **Ollama Web Arama** öğesini seçin ya da şunu ayarlayın:

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

Ollama Cloud üzerinden doğrudan barındırılan arama için:

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

Oturum açılmış yerel bir daemon için OpenClaw, daemon'ın `/api/experimental/web_search` proxy'sini kullanır. `https://ollama.com` için barındırılan `/api/web_search` uç noktasını doğrudan çağırır.

  <Note>
  Tam kurulum ve davranış ayrıntıları için bkz. [Ollama Web Araması](/tr/tools/ollama-search).
  </Note>

  ## Gelişmiş yapılandırma

  <AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **OpenAI uyumlu modda araç çağırma güvenilir değildir.** Bu modu yalnızca bir proxy için OpenAI biçimine ihtiyacınız varsa ve yerel araç çağırma davranışına bağımlı değilseniz kullanın.
    </Warning>

    Bunun yerine OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa (örneğin, yalnızca OpenAI biçimini destekleyen bir proxy arkasında), `api: "openai-completions"` değerini açıkça ayarlayın:

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

    Bu mod, akış ve araç çağırmayı aynı anda desteklemeyebilir. Model yapılandırmasında `params: { streaming: false }` ile akışı devre dışı bırakmanız gerekebilir.

    Ollama ile `api: "openai-completions"` kullanıldığında OpenClaw, Ollama'nın sessizce 4096 bağlam penceresine geri düşmemesi için varsayılan olarak `options.num_ctx` ekler. Proxy'niz veya üst akışınız bilinmeyen `options` alanlarını reddediyorsa bu davranışı devre dışı bırakın:

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
    Otomatik keşfedilen modeller için OpenClaw, kullanılabilir olduğunda Ollama tarafından bildirilen bağlam penceresini kullanır; buna özel Modelfile'lardan gelen daha büyük `PARAMETER num_ctx` değerleri de dahildir. Aksi halde OpenClaw tarafından kullanılan varsayılan Ollama bağlam penceresine geri döner.

    Bu Ollama sağlayıcısı altındaki her model için sağlayıcı düzeyinde `contextWindow`, `contextTokens` ve `maxTokens` varsayılanlarını ayarlayabilir, ardından gerektiğinde bunları model bazında geçersiz kılabilirsiniz. `contextWindow`, OpenClaw'ın istem ve Compaction bütçesidir. Yerel Ollama istekleri, `params.num_ctx` değerini açıkça yapılandırmadığınız sürece `options.num_ctx` değerini ayarsız bırakır; böylece Ollama kendi modelini, `OLLAMA_CONTEXT_LENGTH` değerini veya VRAM tabanlı varsayılanını uygulayabilir. Bir Modelfile'ı yeniden oluşturmadan Ollama'nın istek başına çalışma zamanı bağlamını sınırlamak veya zorlamak için `params.num_ctx` ayarlayın; geçersiz, sıfır, negatif ve sonlu olmayan değerler yok sayılır. Yerel Ollama istek bağlamını zorlamak için yalnızca `contextWindow` veya `maxTokens` kullanan eski bir yapılandırmayı yükselttiyseniz, bu açık sağlayıcı veya model bütçelerini `params.num_ctx` içine kopyalamak için `openclaw doctor --fix` çalıştırın. OpenAI uyumlu Ollama adaptörü, yapılandırılmış `params.num_ctx` veya `contextWindow` değerinden varsayılan olarak hâlâ `options.num_ctx` ekler; üst akışınız `options` alanını reddediyorsa bunu `injectNumCtxForOpenAICompat: false` ile devre dışı bırakın.

    Yerel Ollama model girdileri, `params` altında yaygın Ollama çalışma zamanı seçeneklerini de kabul eder; bunlara `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` ve `use_mmap` dahildir. OpenClaw yalnızca Ollama istek anahtarlarını iletir, bu nedenle `streaming` gibi OpenClaw çalışma zamanı parametreleri Ollama'ya sızdırılmaz. Üst düzey Ollama `think` göndermek için `params.think` veya `params.thinking` kullanın; `false`, Qwen tarzı düşünen modeller için API düzeyinde düşünmeyi devre dışı bırakır.

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

    Model başına `agents.defaults.models["ollama/<model>"].params.num_ctx` da çalışır. Her ikisi de yapılandırılmışsa, açık sağlayıcı model girdisi ajan varsayılanına göre önceliklidir.

  </Accordion>

  <Accordion title="Thinking control">
    Yerel Ollama modelleri için OpenClaw, düşünme denetimini Ollama'nın beklediği şekilde iletir: `options.think` değil, üst düzey `think`. `/api/show` yanıtında `thinking` yeteneği bulunan otomatik keşfedilmiş modeller `/think low`, `/think medium`, `/think high` ve `/think max` seçeneklerini sunar; düşünmeyen modeller yalnızca `/think off` seçeneğini sunar.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Bir model varsayılanı da ayarlayabilirsiniz:

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

    Model başına `params.think` veya `params.thinking`, belirli bir yapılandırılmış model için Ollama API düşünmesini devre dışı bırakabilir ya da zorlayabilir. Etkin çalıştırmada yalnızca örtük varsayılan `off` olduğunda OpenClaw bu açık model parametrelerini korur; `/think medium` gibi off dışındaki çalışma zamanı komutları yine de etkin çalıştırmayı geçersiz kılar.

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw, `deepseek-r1`, `reasoning` veya `think` gibi adlara sahip modelleri varsayılan olarak akıl yürütme yeteneğine sahip kabul eder.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Ek yapılandırma gerekmez. OpenClaw bunları otomatik olarak işaretler.

  </Accordion>

  <Accordion title="Model costs">
    Ollama ücretsizdir ve yerel olarak çalışır, bu nedenle tüm model maliyetleri $0 olarak ayarlanır. Bu, hem otomatik keşfedilmiş hem de elle tanımlanmış modeller için geçerlidir.
  </Accordion>

  <Accordion title="Bellek embedding'leri">
    Paketle birlikte gelen Ollama plugin'i, [bellek araması](/tr/concepts/memory) için
    bir bellek embedding sağlayıcısı kaydeder. Yapılandırılmış Ollama temel URL'sini
    ve API anahtarını kullanır, Ollama'nın güncel `/api/embed` uç noktasını çağırır
    ve mümkün olduğunda birden çok bellek parçasını tek bir `input` isteğinde
    toplu işler.

    `proxy.enabled=true` olduğunda, yapılandırılmış `baseUrl` değerinden türetilen
    tam ana makineye özgü local loopback kaynağına yapılan Ollama bellek embedding
    istekleri, yönetilen ileri proxy yerine OpenClaw'ın korumalı doğrudan yolunu
    kullanır. Yapılandırılmış ana makine adının kendisi `localhost` veya bir loopback
    IP literali olmalıdır; yalnızca loopback'e çözümlenen DNS adları yine yönetilen
    proxy yolunu kullanır. LAN, tailnet, özel ağ ve genel Ollama ana makineleri de
    yönetilen proxy yolunda kalır. Başka bir ana makineye veya porta yönlendirmeler
    güveni devralmaz. Operatörler, loopback trafiğini proxy üzerinden göndermek için
    genel `proxy.loopbackMode: "proxy"` ayarını veya bağlantı açmadan önce loopback
    bağlantılarını reddetmek için `proxy.loopbackMode: "block"` ayarını hâlâ
    belirleyebilir; bu ayarın işlem genelindeki etkisi için
    [Yönetilen proxy](/tr/security/network-proxy#gateway-loopback-mode) bölümüne bakın.

    | Özellik      | Değer               |
    | ------------- | ------------------- |
    | Varsayılan model | `nomic-embed-text`  |
    | Otomatik çekme     | Evet — embedding modeli yerelde yoksa otomatik olarak çekilir |

    Sorgu zamanı embedding'leri, `nomic-embed-text`, `qwen3-embedding` ve `mxbai-embed-large` dahil olmak üzere bunları gerektiren veya öneren modeller için alma önekleri kullanır. Mevcut dizinlerin biçim migrasyonuna ihtiyaç duymaması için bellek belge toplu işleri ham kalır.

    Bellek araması embedding sağlayıcısı olarak Ollama'yı seçmek için:

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

    Uzak bir embedding ana makinesi için kimlik doğrulamayı o ana makineyle sınırlı tutun:

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

  <Accordion title="Akış yapılandırması">
    OpenClaw'ın Ollama entegrasyonu varsayılan olarak **yerel Ollama API'sini** (`/api/chat`) kullanır; bu API akışı ve araç çağırmayı aynı anda tam olarak destekler. Özel bir yapılandırma gerekmez.

    Yerel `/api/chat` istekleri için OpenClaw, düşünme denetimini doğrudan Ollama'ya da iletir: açık bir model `params.think`/`params.thinking` değeri yapılandırılmadığı sürece `/think off` ve `openclaw agent --thinking off` üst düzey `think: false` gönderir; `/think low|medium|high` ise eşleşen üst düzey `think` efor dizesini gönderir. `/think max`, Ollama'nın en yüksek yerel eforu olan `think: "high"` değerine eşlenir.

    <Tip>
    OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa yukarıdaki "Eski OpenAI uyumlu mod" bölümüne bakın. Bu modda akış ve araç çağırma aynı anda çalışmayabilir.
    </Tip>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="WSL2 çökme döngüsü (tekrarlanan yeniden başlatmalar)">
    NVIDIA/CUDA kullanılan WSL2'de resmi Ollama Linux yükleyicisi, `Restart=always` içeren bir `ollama.service` systemd birimi oluşturur. Bu servis otomatik başlar ve WSL2 önyüklemesi sırasında GPU destekli bir model yüklerse, model yüklenirken Ollama ana makine belleğini sabitleyebilir. Hyper-V bellek geri kazanımı bu sabitlenmiş sayfaları her zaman geri alamaz; bu yüzden Windows WSL2 sanal makinesini sonlandırabilir, systemd Ollama'yı yeniden başlatır ve döngü tekrarlanır.

    Yaygın kanıtlar:

    - Windows tarafından tekrarlanan WSL2 yeniden başlatmaları veya sonlandırmaları
    - WSL2 başlangıcından kısa süre sonra `app.slice` veya `ollama.service` içinde yüksek CPU kullanımı
    - Linux OOM-killer olayı yerine systemd'den gelen SIGTERM

    OpenClaw, WSL2'yi, `Restart=always` ile etkinleştirilmiş `ollama.service` birimini ve görünür CUDA işaretlerini algıladığında başlangıç uyarısı kaydeder.

    Azaltma:

    ```bash
    sudo systemctl disable ollama
    ```

    Bunu Windows tarafında `%USERPROFILE%\.wslconfig` dosyasına ekleyin, ardından `wsl --shutdown` çalıştırın:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama servis ortamında daha kısa bir canlı tutma süresi belirleyin veya Ollama'yı yalnızca gerektiğinde elle başlatın:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Bkz. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama algılanmadı">
    Ollama'nın çalıştığından, `OLLAMA_API_KEY` değerini (veya bir kimlik doğrulama profilini) ayarladığınızdan ve açık bir `models.providers.ollama` girdisi tanımlamadığınızdan emin olun:

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
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Bağlantı reddedildi">
    Ollama'nın doğru portta çalıştığını kontrol edin:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Uzak ana makine curl ile çalışıyor ancak OpenClaw ile çalışmıyor">
    Gateway'i çalıştıran aynı makineden ve runtime'dan doğrulayın:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Yaygın nedenler:

    - `baseUrl`, `localhost` değerini gösteriyor ancak Gateway Docker'da veya başka bir ana makinede çalışıyor.
    - URL, yerel Ollama yerine OpenAI uyumlu davranışı seçen `/v1` kullanıyor.
    - Uzak ana makinenin Ollama tarafında güvenlik duvarı veya LAN bağlama değişikliklerine ihtiyacı var.
    - Model dizüstü bilgisayarınızdaki daemon'da var ancak uzak daemon'da yok.

  </Accordion>

  <Accordion title="Model araç JSON'unu metin olarak çıktı veriyor">
    Bu genellikle sağlayıcının OpenAI uyumlu modu kullandığı veya modelin araç şemalarını işleyemediği anlamına gelir.

    Yerel Ollama modunu tercih edin:

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

    Küçük bir yerel model araç şemalarında hâlâ başarısız oluyorsa, o model girdisinde `compat.supportsTools: false` ayarlayın ve yeniden test edin.

  </Accordion>

  <Accordion title="Kimi veya GLM bozuk semboller döndürüyor">
    Uzun, dilsel olmayan sembol dizileri içeren barındırılan Kimi/GLM yanıtları, başarılı bir assistant yanıtı yerine başarısız sağlayıcı çıktısı olarak değerlendirilir. Bu, bozuk metni oturuma kalıcı olarak yazmadan normal yeniden deneme, fallback veya hata işlemeyi devreye alır.

    Bu tekrar tekrar olursa ham model adını, geçerli oturum dosyasını ve çalıştırmanın `Cloud + Local` mı yoksa `Cloud only` mı kullandığını yakalayın; ardından yeni bir oturum ve fallback model deneyin:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Soğuk yerel model zaman aşımına uğruyor">
    Büyük yerel modeller, akış başlamadan önce uzun bir ilk yüklemeye ihtiyaç duyabilir. Zaman aşımını Ollama sağlayıcısıyla sınırlı tutun ve isteğe bağlı olarak Ollama'dan modeli dönüşler arasında yüklü tutmasını isteyin:

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

    Ana makinenin kendisi bağlantıları kabul etmekte yavaşsa, `timeoutSeconds` bu sağlayıcı için korumalı Undici bağlantı zaman aşımını da uzatır.

  </Accordion>

  <Accordion title="Büyük bağlamlı model çok yavaş veya belleği tükeniyor">
    Birçok Ollama modeli, donanımınızın rahatça çalıştırabileceğinden daha büyük bağlamlar bildirir. Yerel Ollama, siz `params.num_ctx` ayarlamadığınız sürece Ollama'nın kendi runtime bağlam varsayılanını kullanır. Öngörülebilir ilk token gecikmesi istediğinizde hem OpenClaw'ın bütçesini hem de Ollama'nın istek bağlamını sınırlayın:

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

    OpenClaw çok fazla prompt gönderiyorsa önce `contextWindow` değerini düşürün. Ollama makine için çok büyük bir runtime bağlamı yüklüyorsa `params.num_ctx` değerini düşürün. Üretim çok uzun sürüyorsa `maxTokens` değerini düşürün.

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model referanslarına ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modelleri seçme ve yapılandırma yöntemi.
  </Card>
  <Card title="Ollama Web Araması" href="/tr/tools/ollama-search" icon="magnifying-glass">
    Ollama destekli web araması için tam kurulum ve davranış ayrıntıları.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma referansı.
  </Card>
</CardGroup>
