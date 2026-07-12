---
read_when:
    - OpenClaw'u Ollama üzerinden bulut veya yerel modellerle çalıştırmak istiyorsunuz
    - Ollama kurulum ve yapılandırma rehberine ihtiyacınız var
    - Görüntüleri anlamak için Ollama görsel modellerini kullanmak istiyorsunuz
summary: OpenClaw'u Ollama ile çalıştırın (bulut ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T12:40:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw, Ollama'nın OpenAI uyumlu `/v1` uç noktasıyla değil, yerel API'siyle (`/api/chat`) iletişim kurar. Üç mod desteklenir:

| Mod             | Kullandığı                                                                      |
| --------------- | ------------------------------------------------------------------------------- |
| Bulut + Yerel   | Yerel modelleri ve (oturum açılmışsa) `:cloud` modellerini sunan, erişilebilir bir Ollama ana makinesi |
| Yalnızca bulut  | Doğrudan `https://ollama.com`; yerel arka plan programı yok                     |
| Yalnızca yerel  | Erişilebilir bir Ollama ana makinesi; yalnızca yerel modeller                   |

Özel `ollama-cloud` sağlayıcı kimliğiyle yalnızca bulut kurulumu için
[Ollama Cloud](/tr/providers/ollama-cloud) bölümüne bakın. Bulut yönlendirmesini
yerel bir `ollama` sağlayıcısından ayrı tutmak istediğinizde
`ollama-cloud/<model>` başvurularını kullanın.

<Warning>
OpenAI uyumlu `/v1` URL'sini (`http://host:11434/v1`) kullanmayın. Bu, araç çağırmayı bozar ve modellerin ham araç çağrısı JSON'unu düz metin olarak üretmesine neden olabilir. Yerel URL'yi kullanın: `baseUrl: "http://host:11434"` (`/v1` olmadan).
</Warning>

Standart yapılandırma anahtarı `baseUrl`'dir. OpenAI SDK tarzı örnekler için
`baseURL` de kabul edilir ancak yeni yapılandırmalarda `baseUrl` kullanılmalıdır.

## Kimlik doğrulama kuralları

<AccordionGroup>
  <Accordion title="Yerel ve LAN ana makineleri">
    local loopback, özel ağ, `.local` ve yalnızca ana makine adından oluşan Ollama URL'leri gerçek bir taşıyıcı belirteci gerektirmez. OpenClaw bunlar için `ollama-local` işaretçisini kullanır.
  </Accordion>
  <Accordion title="Uzak ve Ollama Cloud ana makineleri">
    Genel uzak ana makineler ve `https://ollama.com` gerçek bir kimlik bilgisi gerektirir: `OLLAMA_API_KEY`, bir kimlik doğrulama profili veya sağlayıcının `apiKey` değeri. Doğrudan barındırılan kullanım için `ollama-cloud` sağlayıcısını tercih edin.
  </Accordion>
  <Accordion title="Özel sağlayıcı kimlikleri">
    `api: "ollama"` kullanan özel bir sağlayıcı aynı kurallara uyar. Örneğin, özel bir LAN ana makinesine yönlendirilmiş `ollama-remote` sağlayıcısı `apiKey: "ollama-local"` kullanabilir; alt aracılar bu işaretçiyi eksik kimlik bilgisi olarak değerlendirmek yerine Ollama sağlayıcı kancası üzerinden çözümler. `agents.defaults.memorySearch.provider` da gömmelerin bu Ollama uç noktasını kullanması için özel bir sağlayıcı kimliğine işaret edebilir.
  </Accordion>
  <Accordion title="Kimlik doğrulama profilleri">
    `auth-profiles.json`, bir sağlayıcı kimliğinin kimlik bilgisini depolar; uç nokta ayarlarını (`baseUrl`, `api`, modeller, üstbilgiler, zaman aşımları) `models.providers.<id>` içine koyun. `{ "ollama-windows": { "apiKey": "ollama-local" } }` gibi eski düz dosyalar bir çalışma zamanı biçimi değildir; `openclaw doctor --fix`, bunları yedek oluşturarak standart bir `ollama-windows:default` API anahtarı profiline dönüştürür. Bu eski dosyadaki bir `baseUrl` değeri gereksizdir ve sağlayıcı yapılandırmasına taşınmalıdır.
  </Accordion>
  <Accordion title="Bellek gömme kapsamı">
    Ollama bellek gömmeleri için taşıyıcı kimlik doğrulaması, bildirildiği ana makineyle sınırlıdır:

    - Sağlayıcı düzeyindeki bir anahtar yalnızca o sağlayıcının ana makinesine gönderilir.
    - `agents.*.memorySearch.remote.apiKey` yalnızca kendi uzak gömme ana makinesine gönderilir.
    - Tek başına kullanılan bir `OLLAMA_API_KEY` ortam değişkeni Ollama Cloud kuralı olarak değerlendirilir ve varsayılan olarak yerel/kendi barındırdığınız ana makinelere gönderilmez.

  </Accordion>
</AccordionGroup>

## Başlarken

<Tabs>
  <Tab title="İlk kurulum (önerilen)">
    <Steps>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard
        ```

        **Ollama** seçeneğini belirleyin, ardından bir mod seçin: **Bulut + Yerel**, **Yalnızca bulut** veya **Yalnızca yerel**.
      </Step>
      <Step title="Bir model seçin">
        `Yalnızca bulut`, `OLLAMA_API_KEY` değerini ister ve barındırılan bulut varsayılanlarını önerir. `Bulut + Yerel` ve `Yalnızca yerel`, bir Ollama temel URL'si ister, kullanılabilir modelleri keşfeder ve seçilen yerel model eksikse otomatik olarak indirir. `gemma4:latest` gibi kurulu bir `:latest` etiketi, `gemma4` yinelenmeden bir kez gösterilir. `Bulut + Yerel` ayrıca ana makinede bulut erişimi için oturum açılıp açılmadığını denetler.
      </Step>
      <Step title="Doğrulayın">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Etkileşimsiz:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` ve `--custom-model-id` isteğe bağlıdır; bunların belirtilmemesi, varsayılan yerel ana makineyi ve önerilen `gemma4` modelini kullanır.

  </Tab>

  <Tab title="Elle kurulum">
    <Steps>
      <Step title="Ollama'yı kurun ve başlatın">
        [ollama.com/download](https://ollama.com/download) adresinden edinin, ardından bir model indirin:

        ```bash
        ollama pull gemma4
        ```

        Karma bulut erişimi için aynı ana makinede `ollama signin` komutunu çalıştırın.
      </Step>
      <Step title="Bir kimlik bilgisi ayarlayın">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # yerel/LAN ana makinesi, herhangi bir değer çalışır
        export OLLAMA_API_KEY="your-real-key"   # yalnızca https://ollama.com
        ```

        Ya da yapılandırmada: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Modeli seçin">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Ya da yapılandırmada:

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

## Yerel bir ana makine üzerinden bulut modelleri

`Bulut + Yerel`, hem yerel hem de `:cloud` modellerini erişilebilir tek bir
Ollama ana makinesi üzerinden yönlendirir. Bu, Ollama'nın karma akışıdır ve
her ikisini de istediğinizde kurulum sırasında seçmeniz gereken moddur.

OpenClaw temel URL'yi ister, yerel modelleri keşfeder ve `ollama signin`
durumunu denetler. Oturum açıldığında barındırılan varsayılanları
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`)
önerir. Oturum açılmamışsa `ollama signin` komutunu çalıştırana kadar kurulum
yalnızca yerel olarak kalır.

Yerel bir arka plan programı olmadan yalnızca bulut erişimi için `openclaw onboard --auth-choice ollama-cloud` komutunu kullanın ve [Ollama Cloud](/tr/providers/ollama-cloud) bölümüne bakın. Bu yol `ollama signin` veya çalışan bir sunucu gerektirmez:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` sırasında gösterilen bulut model listesi,
`https://ollama.com/api/tags` adresinden canlı olarak doldurulur ve 500
girdiyle sınırlandırılır; böylece seçici güncel barındırılan kataloğu
yansıtır. Kurulum sırasında `ollama.com` erişilemez durumdaysa veya hiç model
döndürmezse OpenClaw, ilk kurulumun yine tamamlanabilmesi için sabit kodlanmış
öneri listesine geri döner.

## Model keşfi (örtük sağlayıcı)

`OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ayarlandığında ve ne
`models.providers.ollama` ne de `api: "ollama"` kullanan başka bir özel
sağlayıcı tanımlandığında, OpenClaw modelleri `http://127.0.0.1:11434`
adresinden keşfeder:

| Davranış             | Ayrıntı                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalog sorgusu      | `/api/tags`                                                                                                                                                                                                                                                                                                                             |
| Yetenek algılama     | En iyi çabayla yapılan `/api/show` çağrısı; `contextWindow`, `num_ctx` Modelfile parametrelerini ve yetenekleri (görüntü/araçlar/düşünme) okur                                                                                                                                                                                             |
| Görüntü modelleri    | `/api/show` yanıtındaki `vision` yeteneği, modeli görüntü destekli (`input: ["text", "image"]`) olarak işaretler                                                                                                                                                                                                                          |
| Akıl yürütme algılama | Kullanılabildiğinde `/api/show` yanıtındaki `thinking` yeteneğini kullanır; Ollama yetenekleri sağlamadığında ad sezgisine (`r1`, `reason`, `reasoning`, `think`) geri döner. `glm-5.2:cloud` ve `deepseek-v4-flash\|pro:cloud`, bildirilen yeteneklerden bağımsız olarak her zaman akıl yürütme modeli kabul edilir. |
| Belirteç sınırları   | `maxTokens`, varsayılan olarak OpenClaw'ın Ollama azami belirteç sınırını kullanır                                                                                                                                                                                                                                                       |
| Maliyetler           | Tüm maliyetler `0`'dır                                                                                                                                                                                                                                                                                                                  |

```bash
ollama list
openclaw models list
```

Açık bir `models` dizisiyle `models.providers.ollama` ayarlamak veya
`api: "ollama"` ve local loopback olmayan bir `baseUrl` kullanan özel bir
sağlayıcı tanımlamak otomatik keşfi devre dışı bırakır; bu durumda modeller
elle tanımlanmalıdır ([Yapılandırma](#configuration) bölümüne bakın).
Barındırılan `https://ollama.com` adresine yönlendirilmiş bir
`models.providers.ollama` girdisi de keşfi atlar çünkü Ollama Cloud modelleri
sağlayıcı tarafından yönetilir. `http://127.0.0.2:11434` gibi local loopback
özel sağlayıcılar yine yerel kabul edilir ve otomatik keşfi sürdürür.

Elle yazılmış bir `models.json` girdisi olmadan `ollama/<pulled-model>:latest`
gibi tam bir başvuru kullanabilirsiniz; OpenClaw bunu canlı olarak çözümler.
Oturum açılmış ana makinelerde, listede olmayan bir `ollama/<model>:cloud`
başvurusu seçildiğinde söz konusu model `/api/show` ile doğrulanır ve yalnızca
Ollama meta verileri onaylarsa çalışma zamanı kataloğuna eklenir; yazım
hataları yine bilinmeyen model hatası verir.

### Hızlı kontroller

Tam aracı araç yüzeyini atlayan dar kapsamlı bir metin yoklaması için:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Hafif bir görüntü modeli yoklaması için görüntü içeren `--file` seçeneğini
ekleyin (PNG/JPEG/WebP kabul edilir; görüntü olmayan dosyalar Ollama çağrılmadan
önce reddedilir; ses için `openclaw infer audio transcribe` kullanın):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

Her iki yol da sohbet araçlarını, belleği veya oturum bağlamını yüklemez.
Normal aracı yanıtları başarısız olurken bu işlem başarılı olursa sorun büyük
olasılıkla uç noktada değil, modelin araç/aracı kapasitesindedir.

`/model ollama/<model>` ile bir model seçmek kesin bir kullanıcı seçimidir:
yapılandırılmış `baseUrl` erişilemez durumdaysa sonraki yanıt, yapılandırılmış
başka bir modele sessizce geri dönmek yerine sağlayıcı hatasıyla başarısız olur.

Yalıtılmış Cron işleri, aracı turunu başlatmadan önce bir yerel güvenlik
denetimi ekler: seçilen model bir yerel/özel ağ/`.local` Ollama sağlayıcısına
çözümleniyorsa ve `/api/tags` erişilemez durumdaysa OpenClaw, hata metninde
modelle birlikte bu çalıştırmayı `skipped` olarak kaydeder. Bu uç nokta
denetimi ana makine başına 5 dakika önbelleğe alınır; böylece durdurulmuş bir
arka plan programına yönelik tekrarlanan Cron işleri başarısız isteklerin
tümünü başlatmaz.

Canlı doğrulama:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud için aynı canlı testi barındırılan uç noktaya yönlendirin (varsayılan olarak
gömmeleri atlar; bir bulut anahtarı `/api/embed` için yetki sağlamayabileceğinden
`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` ile zorlayın):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Bir model eklemek için modeli çekin; model otomatik olarak keşfedilir:

```bash
ollama pull mistral
```

## Node üzerinde yerel çıkarım

Aracılar, eşleştirilmiş bir masaüstü veya sunucu Node'undaki bir Ollama modeline
kısa bir görev devredebilir. İstem ve yanıt, mevcut kimliği doğrulanmış
Gateway/Node bağlantısından geçer; istek, Node'un kendi loopback Ollama
uç noktasında (`http://127.0.0.1:11434`) çalışır.

<Steps>
  <Step title="Node üzerinde Ollama'yı başlatın">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Node ana makinesini bağlayın">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Gateway ana makinesinde cihazı ve Node komutlarını onaylayın, ardından doğrulayın:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    İlk bağlantı veya Ollama komutlarını ekleyen bir yükseltme, Node komutu
    onayını tetikleyebilir. Node, `ollama.models` ve `ollama.chat` özelliklerini
    duyurmadan bağlanırsa `openclaw nodes pending` komutunu yeniden kontrol edin.

  </Step>
  <Step title="Bir aracıdan kullanın">
    Birlikte gelen Ollama Plugin'i, `node_inference` aracını kullanıma sunar. Aracılar
    önce `action: "discover"` çağrısını, ardından bu sonuçtaki bir Node ve modelle
    `action: "run"` çağrısını yapar (tam olarak bir uygun Node bağlıysa `run`, Node'u
    atlayabilir). Örneğin: "Node'larımdaki Ollama modellerini keşfet, ardından bu
    metni özetlemek için yüklü en hızlı modeli kullan."
  </Step>
</Steps>

Keşif, `/api/tags` verilerini okur, `/api/show` yeteneklerini denetler ve mümkün
olduğunda önceden yüklenmiş modelleri ilk sıraya koymak için `/api/ps` kullanır.
Yalnızca Ollama'nın sohbet özelliğine sahip (`completion` yeteneği) olarak
bildirdiği yerel modelleri döndürür; Ollama Cloud satırları ve yalnızca gömme
modelleri hariç tutulur. Araç çağrısı farklı bir `maxTokens` istemediği sürece
her çalıştırma model düşünmesini devre dışı bırakır ve çıktıyı varsayılan olarak
512 token ile sınırlar (kesin üst sınır 8192); bazı modeller (örneğin GPT-OSS)
düşünmenin devre dışı bırakılmasını desteklemez ve yine de akıl yürütme token'ları
üretebilir.

Ollama'yı aracılara açmadan bir Node üzerinde çalışır durumda tutmak için:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Node'u yeniden başlatın (ön plandaki bir oturum için `openclaw node restart`
komutunu kullanın veya `openclaw node run` işlemini durdurup yeniden çalıştırın).
Node, `ollama.models` ve `ollama.chat` özelliklerini duyurmayı durdurur; Ollama'nın
kendisi ve Gateway'in Ollama sağlayıcısı bundan etkilenmez. Yeniden etkinleştirmek
için değeri tekrar `true` olarak ayarlayıp yeniden başlatın; değişen komut yüzeyi,
yeniden bağlantının ardından tekrar `openclaw nodes pending` onayı gerektirebilir.

Aracı turu olmadan Node komutlarını doğrudan doğrulayın:

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

`--invoke-timeout`, Node'un komutu çalıştırmak için sahip olduğu süreyi sınırlar;
`--timeout` ise genel Gateway çağrısını sınırlar ve daha büyük olmalıdır.

Node üzerindeki yerel çıkarım her zaman Node'un kendi loopback uç noktasını
kullanır; yapılandırılmış bir uzak/bulut `models.providers.ollama.baseUrl`
değerini yeniden kullanmaz. Node komutları macOS, Linux ve Windows Node ana
makinelerinde varsayılan olarak kullanılabilir ve normal Node eşleştirme/komut
politikasına tabi olmaya devam eder.

## Görsel algılama ve görüntü açıklaması

Birlikte gelen Ollama Plugin'i, Ollama'yı görüntü destekli bir medya anlama
sağlayıcısı olarak kaydeder; böylece OpenClaw, açık görüntü açıklama isteklerini
ve yapılandırılmış görüntü modeli varsayılanlarını yerel veya barındırılan Ollama
görsel algılama modelleri üzerinden yönlendirebilir.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model`, tam bir `<provider/model>` başvurusu olmalıdır; ayarlandığında `infer image
describe`, yerel görsel algılamayı zaten destekleyen modellerde açıklamayı atlamak
yerine önce bu modeli dener. Çağrı başarısız olursa OpenClaw,
`agents.defaults.imageModel.fallbacks` üzerinden devam edebilir; dosya/URL hazırlama
hataları, geri dönüş denenmeden önce başarısız olur. OpenClaw'ın görüntü anlama akışı
ve yapılandırılmış `imageModel` için `infer image describe` komutunu; özel istemli
ham bir çok kipli yoklama için `infer model run --file` komutunu kullanın.

Ollama'yı gelen medya için varsayılan görüntü anlama sağlayıcısı yapmak üzere:

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

Tam `ollama/<model>` başvurusunu tercih edin. `qwen2.5vl:7b` gibi sağlayıcı
belirtilmemiş bir `imageModel` başvurusu, yalnızca bu model
`models.providers.ollama.models` altında `input: ["text", "image"]` ile listelenmişse
ve yapılandırılmış başka hiçbir görüntü sağlayıcısı aynı sağlayıcısız kimliği
sunmuyorsa `ollama/qwen2.5vl:7b` olarak normalleştirilir; aksi takdirde sağlayıcı
önekini açıkça kullanın.

Yavaş yerel görsel algılama modelleri, bulut modellerinden daha uzun bir görüntü
anlama zaman aşımına ihtiyaç duyabilir ve Ollama, modelin duyurulan tam görsel
bağlamını ayırmaya çalışırsa kısıtlı donanımlarda çökebilir. Bir yetenek zaman
aşımı ayarlayın ve `num_ctx` değerini sınırlayın:

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

Bu zaman aşımı, gelen görüntülerin anlaşılmasına ve açık `image` aracına uygulanır.
`models.providers.ollama.timeoutSeconds`, normal model çağrılarında temel Ollama
HTTP isteği korumasını yönetmeye devam eder.

Canlı doğrulama:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` değerini elle tanımlarsanız görsel algılama
modellerini açıkça işaretleyin:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw, görüntü destekli olarak işaretlenmemiş modellere yönelik görüntü açıklama
isteklerini reddeder. Örtük keşifte bu bilgi, `/api/show` uç noktasının görsel algılama
yeteneğinden gelir.

## Yapılandırma

<Tabs>
  <Tab title="Temel (örtük keşif)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` ayarlanmışsa sağlayıcı girdisindeki `apiKey` değerini atlayabilirsiniz; OpenClaw kullanılabilirlik kontrolleri için bu değeri doldurur.
    </Tip>

  </Tab>

  <Tab title="Açık (elle belirtilen modeller)">
    Barındırılan bulut kurulumu, varsayılan olmayan bir ana makine/bağlantı noktası,
    zorunlu bağlam pencereleri veya tamamen elle oluşturulan model listeleri için
    açık yapılandırma kullanın:

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
    Açık yapılandırma otomatik keşfi devre dışı bırakır; bu nedenle modeller
    listelenmelidir:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 yok - yerel Ollama API URL'si
            api: "ollama", // Açık: yerel araç çağırma davranışını garanti eder
            timeoutSeconds: 300, // İsteğe bağlı: soğuk yerel modeller için daha uzun bağlantı/akış bütçesi
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // İsteğe bağlı: modeli turlar arasında yüklü tutar
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    `/v1` eklemeyin. Bu yol, araç çağrısının güvenilir olmadığı OpenAI uyumlu modu seçer.
    </Warning>

  </Tab>
</Tabs>

## Yaygın tarifler

Model kimliklerini `ollama list` veya
`openclaw models list --provider ollama` komutundaki tam adlarla değiştirin.

<AccordionGroup>
  <Accordion title="Otomatik keşifli yerel model">
    Gateway ile aynı makinedeki Ollama otomatik olarak keşfedilir:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Elle model belirtmeniz gerekmiyorsa bir `models.providers.ollama` bloğu eklemeyin.

  </Accordion>

  <Accordion title="Elle belirtilen modellere sahip LAN Ollama ana makinesi">
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

    `contextWindow`, OpenClaw'ın bağlam bütçesidir; `params.num_ctx` Ollama'ya
    gönderilir. Donanım, modelin duyurulan tam bağlamını çalıştıramıyorsa bunları
    uyumlu tutun.

  </Accordion>

  <Accordion title="Yalnızca Ollama Cloud">
    Yerel arka plan programı olmadan doğrudan barındırılan modeller:

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

    Bu yapı yerine özel `ollama-cloud` sağlayıcı kimliğini kullanmak için
    [Ollama Cloud](/tr/providers/ollama-cloud) sayfasına bakın.

  </Accordion>

  <Accordion title="Oturum açılmış bir arka plan programı üzerinden bulut ve yerel kullanım">
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

  <Accordion title="Birden fazla Ollama sunucusu">
    Birden fazla Ollama sunucusu çalıştırırken özel sağlayıcı kimlikleri kullanılır; her birinin
    kendi sunucusu, modelleri, kimlik doğrulaması ve zaman aşımı vardır.

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

    OpenClaw, Ollama'yı çağırmadan önce etkin sağlayıcı önekini kaldırır (önek yoksa
    düz `ollama/` önekine geri döner); böylece `ollama-large/qwen3.5:27b`,
    Ollama'ya `qwen3.5:27b` olarak ulaşır.

  </Accordion>

  <Accordion title="Hafif yerel model profili">
    Bazı yerel modeller basit istemleri işleyebilir ancak aracın tüm
    özellikleriyle çalışmakta zorlanır. Genel çalışma zamanı ayarlarına dokunmadan önce
    araçları ve bağlamı sınırlandırın:

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

    `compat.supportsTools: false` seçeneğini yalnızca model veya sunucu, araç
    şemalarında güvenilir biçimde başarısız olduğunda kullanın; bu seçenek kararlılık karşılığında
    ajan yeteneğinden ödün verir. `localModelLean`, açıkça gerekmedikleri sürece
    ağır tarayıcı, Cron, mesaj, medya oluşturma, ses ve PDF araçlarını doğrudan
    ajan yüzeyinden kaldırır ve daha büyük katalogları Araç Araması'nın arkasına yerleştirir.
    Ollama'nın çalışma zamanı bağlamını veya düşünme modunu değiştirmez. Döngüye giren ya da
    bütçesini gizli akıl yürütmeye harcayan küçük Qwen tarzı düşünme modellerinde bunu
    `params.num_ctx` ve `params.thinking: false` ile birlikte kullanın.

  </Accordion>
</AccordionGroup>

### Model seçimi

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

Özel sağlayıcı kimlikleri de aynı şekilde çalışır: `ollama-spark/qwen3:32b`
gibi etkin sağlayıcı önekini kullanan bir başvuru için OpenClaw, Ollama'yı
çağırmadan önce bu öneki kaldırır ve `qwen3:32b` gönderir.

Yavaş yerel modellerde, tüm ajan çalışma zamanı zaman aşımını artırmadan önce
sağlayıcı kapsamlı ayarlamayı tercih edin:

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

`timeoutSeconds`, model HTTP isteğinin bağlantı kurulumunu, üstbilgilerini,
gövde akışını ve korumalı getirme işleminin toplam iptal süresini kapsar.
`params.keep_alive`, yerel `/api/chat` isteklerinde üst düzey `keep_alive`
olarak iletilir; ilk tur yükleme süresi darboğaz olduğunda bunu model başına ayarlayın.

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

Uzak sunucular için `127.0.0.1` yerine `baseUrl` sunucusunu kullanın. `curl`
çalışıyor ancak OpenClaw çalışmıyorsa Gateway'in farklı bir makinede,
kapsayıcıda veya hizmet hesabıyla çalışıp çalışmadığını kontrol edin.

## Ollama Web Araması

OpenClaw, **Ollama Web Araması** özelliğini bir `web_search` sağlayıcısı olarak paketler.

| Özellik       | Ayrıntı                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sunucu        | Ayarlandığında `models.providers.ollama.baseUrl`, aksi hâlde `http://127.0.0.1:11434`; `https://ollama.com`, barındırılan API'yi doğrudan kullanır                                                     |
| Kimlik doğrulama | Oturum açılmış yerel sunucu için anahtar gerekmez; doğrudan `https://ollama.com` araması veya kimlik doğrulama korumalı sunucular için `OLLAMA_API_KEY` ya da yapılandırılmış sağlayıcı kimlik doğrulaması |
| Gereksinim    | Yerel/kendi sunucunuzda barındırılan sunucular çalışıyor olmalı ve `ollama signin` ile oturum açılmalıdır; doğrudan barındırılan arama için `baseUrl: "https://ollama.com"` ve gerçek bir API anahtarı gerekir |

Bunu `openclaw onboard` veya `openclaw configure --section web` sırasında seçin ya da şunu ayarlayın:

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

Kendi sunucunuzda barındırılan bir sunucuda OpenClaw önce yerel
`/api/experimental/web_search` vekilini dener, ardından aynı sunucudaki
barındırılan `/api/web_search` yoluna geri döner; oturum açılmış yerel daemon
normalde yerel vekil üzerinden yanıt verir. Doğrudan `https://ollama.com`
çağrıları her zaman barındırılan `/api/web_search` uç noktasını kullanır.

<Note>
Eksiksiz kurulum ve davranış bilgileri için [Ollama Web Araması](/tr/tools/ollama-search) sayfasına bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Eski OpenAI uyumlu modu">
    <Warning>
    **Bu modda araç çağırma güvenilir değildir.** Yalnızca bir vekilin OpenAI biçimine ihtiyaç duyduğu ve yerel araç çağırmaya bağımlı olmadığınız durumlarda kullanın.
    </Warning>

    `/v1/chat/completions` arkasındaki bir vekil için
    `api: "openai-completions"` değerini açıkça ayarlayın:

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

    Bu mod, akış ve araç çağırmayı aynı anda desteklemeyebilir; modelde
    `params: { streaming: false }` ayarını kullanmanız gerekebilir.

    OpenClaw bu modda varsayılan olarak `options.num_ctx` ekler; böylece Ollama
    sessizce 4096 belirteçli bağlama geri dönmez. Vekiliniz bilinmeyen
    `options` alanlarını reddediyorsa bunu devre dışı bırakın:

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
    Otomatik keşfedilen modellerde OpenClaw, özel Modelfile dosyalarındaki daha
    büyük `PARAMETER num_ctx` değerleri dâhil olmak üzere `/api/show` tarafından
    bildirilen bağlam penceresini kullanır; aksi hâlde OpenClaw'ın varsayılan
    Ollama bağlam penceresine geri döner.

    Sağlayıcı düzeyindeki `contextWindow`, `contextTokens` ve `maxTokens`, bu
    sağlayıcı altındaki her model için varsayılanları belirler ve model bazında
    geçersiz kılınabilir. `contextWindow`, OpenClaw'ın kendi istem/Compaction
    bütçesidir. `params.num_ctx` değerini açıkça ayarlamadığınız sürece yerel
    `/api/chat` istekleri `options.num_ctx` değerini ayarlanmamış bırakır; böylece
    Ollama kendi model, `OLLAMA_CONTEXT_LENGTH` veya VRAM tabanlı varsayılanını
    uygular. Geçersiz, sıfır, negatif veya sonlu olmayan `params.num_ctx`
    değerleri yok sayılır. Eski bir yapılandırma, yerel istek bağlamını zorlamak
    için yalnızca `contextWindow`/`maxTokens` kullandıysa bunları `params.num_ctx`
    alanına kopyalamak üzere `openclaw doctor --fix` komutunu çalıştırın.
    OpenAI uyumlu bağdaştırıcı, yapılandırılan `params.num_ctx` veya
    `contextWindow` değerinden varsayılan olarak yine `options.num_ctx` ekler;
    üst sistem `options` alanını reddediyorsa
    `injectNumCtxForOpenAICompat: false` ile devre dışı bırakın.

    Yerel model girdileri ayrıca `params` altında yaygın Ollama çalışma zamanı
    seçeneklerini kabul eder ve bunları yerel `/api/chat` `options` alanı olarak
    iletir: `num_keep`, `seed`, `num_predict`, `top_k`, `top_p`, `min_p`,
    `typical_p`, `repeat_last_n`, `temperature`, `repeat_penalty`,
    `presence_penalty`, `frequency_penalty`, `stop`, `num_batch`, `num_gpu`,
    `main_gpu`, `use_mmap` ve `num_thread`. Birkaç anahtar (`format`,
    `keep_alive`, `truncate`, `shift`), iç içe `options` yerine üst düzey istek
    alanları olarak iletilir. OpenClaw yalnızca bu Ollama istek anahtarlarını
    ilettiğinden `streaming` gibi yalnızca çalışma zamanına özgü parametreler
    hiçbir zaman Ollama'ya gönderilmez. Üst düzey `think` değerini ayarlamak için
    `params.think` (veya `params.thinking`) kullanın; `false`, Qwen tarzı düşünme
    modellerinde API düzeyindeki düşünmeyi devre dışı bırakır.

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

    Model başına `agents.defaults.models["ollama/<model>"].params.num_ctx` da
    çalışır; ikisi de ayarlanmışsa açık sağlayıcı model girdisi önceliklidir.

  </Accordion>

  <Accordion title="Düşünme denetimi">
    OpenClaw, düşünme ayarını Ollama'nın beklediği şekilde iletir: `options.think`
    değil, üst düzey `think`. `/api/show` yanıtı `thinking` yeteneği bildiren
    otomatik keşfedilmiş modeller `/think low`, `/think medium`, `/think high`
    ve `/think max` seçeneklerini sunar; düşünme özelliği olmayan modeller
    yalnızca `/think off` seçeneğini sunar.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ya da bir model varsayılanı ayarlayın:

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

    Model bazında `params.think`/`params.thinking`, belirli bir model için API
    düşünmesini devre dışı bırakabilir veya zorunlu kılabilir. Etkin çalıştırmada
    yalnızca örtük `off` varsayılanı bulunduğunda OpenClaw bu açık yapılandırmayı
    korur; `/think medium` gibi kapalı olmayan bir çalışma zamanı komutu yine de
    bunu geçersiz kılar. Doğru değerli bir düşünme isteği, açıkça
    `reasoning: false` olarak işaretlenmiş bir modele asla gönderilmez;
    `think: false` isteği ise her durumda gönderilir.

  </Accordion>

  <Accordion title="Akıl yürütme modelleri">
    `deepseek-r1`, `reasoning`, `reason` veya `think` adlı modeller varsayılan
    olarak akıl yürütme yeteneğine sahip kabul edilir — ek yapılandırma gerekmez:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Model maliyetleri">
    Ollama yerel olarak çalışır ve ücretsizdir; bu nedenle hem otomatik keşfedilen
    hem de elle tanımlanan modeller için tüm model maliyetleri `0` değerindedir.
  </Accordion>

  <Accordion title="Bellek gömmeleri">
    Paketle gelen Ollama Plugin'i, [bellek araması](/tr/concepts/memory) için bir
    bellek gömme sağlayıcısı kaydeder. Yapılandırılmış Ollama temel URL'sini ve
    API anahtarını kullanır, `/api/embed` çağrısı yapar ve mümkün olduğunda birden
    fazla bellek parçasını tek bir `input` isteğinde toplar.

    `proxy.enabled=true` olduğunda, yapılandırılmış `baseUrl` değerinden türetilen
    tam ana makineye ait local loopback kaynağına yönelik gömme istekleri, yönetilen
    iletme proxy'si yerine OpenClaw'ın korumalı doğrudan yolunu kullanır.
    Yapılandırılmış ana makine adının kendisi `localhost` veya bir loopback IP
    değişmezi olmalıdır — yalnızca loopback'e çözümlenen DNS adları yine yönetilen
    proxy yolunu kullanır. LAN, tailnet, özel ağ ve genel Ollama ana makineleri her
    zaman yönetilen proxy yolunda kalır; başka bir ana makineye/bağlantı noktasına
    yapılan yönlendirmeler güveni devralmaz. `proxy.loopbackMode: "proxy"` yine de
    loopback trafiğini proxy üzerinden yönlendirir; `proxy.loopbackMode: "block"`
    ise bağlantı kurulmadan önce bunu reddeder — bkz.
    [Yönetilen proxy](/tr/security/network-proxy#gateway-loopback-mode).

    | Özellik | Değer |
    | --- | --- |
    | Varsayılan model | `nomic-embed-text` |
    | Otomatik indirme | Evet, yerel olarak mevcut değilse |
    | Varsayılan satır içi eşzamanlılık | 1 (diğer sağlayıcılarda varsayılan değer daha yüksektir; ana makine kaldırabiliyorsa `nonBatchConcurrency` ile artırın) |

    Sorgu zamanı gömmeleri, bunları gerektiren veya öneren modeller için getirme
    öneklerini kullanır: `nomic-embed-text`, `qwen3-embedding` ve
    `mxbai-embed-large`. Belge grupları ham biçimde kalır; dolayısıyla mevcut
    dizinler için biçim geçişi gerekmez.

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

    Uzak bir gömme ana makinesi için kimlik doğrulamayı o ana makineyle sınırlı
    tutun:

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
    Ollama varsayılan olarak akış ile araç çağırmayı birlikte destekleyen
    **yerel API'yi** (`/api/chat`) kullanır — özel bir yapılandırma gerekmez.

    Yerel isteklerde düşünme denetimi doğrudan iletilir: açık bir
    `params.think`/`params.thinking` yapılandırılmamışsa `/think off` ve
    `openclaw agent --thinking off`, üst düzey `think: false` gönderir;
    `/think low|medium|high` eşleşen efor dizesini gönderir; `/think max`,
    Ollama'nın en yüksek eforu olan `think: "high"` değerine eşlenir.

    <Tip>
    Bunun yerine OpenAI uyumlu uç nokta için yukarıdaki "Eski OpenAI uyumlu mod" bölümüne bakın — burada akış ve araç çağırma birlikte çalışmayabilir.
    </Tip>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="WSL2 kilitlenme döngüsü (tekrarlanan yeniden başlatmalar)">
    NVIDIA/CUDA kullanılan WSL2'de resmi Ollama Linux yükleyicisi,
    `Restart=always` ayarlı bir `ollama.service` systemd birimi oluşturur. Bu
    hizmet otomatik olarak başlar ve WSL2 önyüklemesi sırasında GPU destekli bir
    model yüklerse Ollama yükleme sırasında ana makine belleğini sabitleyebilir;
    Hyper-V bellek geri kazanımı bu sayfaları her zaman geri alamaz. Bunun
    sonucunda Windows, WSL2 sanal makinesini sonlandırabilir, systemd Ollama'yı
    yeniden başlatır ve döngü tekrarlanır.

    Kanıtlar: tekrarlanan WSL2 yeniden başlatmaları/sonlandırmaları, WSL2
    başlatıldıktan hemen sonra `app.slice` veya `ollama.service` içinde yüksek
    CPU kullanımı ve Linux OOM sonlandırıcısı yerine systemd kaynaklı SIGTERM.

    OpenClaw; WSL2'yi, `Restart=always` ile etkinleştirilmiş `ollama.service`
    hizmetini ve görünür CUDA işaretlerini algıladığında başlangıçta bir uyarı
    kaydeder.

    Geçici çözüm:

    ```bash
    sudo systemctl disable ollama
    ```

    Windows tarafında `%USERPROFILE%\.wslconfig` dosyasına şunu ekleyin,
    ardından `wsl --shutdown` komutunu çalıştırın:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Alternatif olarak canlı tutma süresini kısaltın veya Ollama'yı yalnızca
    gerektiğinde elle başlatın:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Bkz. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama algılanmıyor">
    Ollama'nın çalıştığını, `OLLAMA_API_KEY` değerinin (veya bir kimlik doğrulama
    profilinin) ayarlandığını ve `models.providers.ollama` değerinin açıkça
    tanımlanmadığını doğrulayın:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Kullanılabilir model yok">
    Modeli yerel olarak indirin veya `models.providers.ollama` içinde açıkça
    tanımlayın:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Bağlantı reddedildi">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Uzak ana makine curl ile çalışıyor ancak OpenClaw ile çalışmıyor">
    Gateway'i çalıştıran aynı makine ve çalışma zamanından doğrulayın:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Yaygın nedenler:

    - `baseUrl`, `localhost` değerini gösteriyor ancak Gateway Docker içinde veya başka bir ana makinede çalışıyor.
    - URL, yerel Ollama davranışı yerine OpenAI uyumlu davranışı seçen `/v1` yolunu kullanıyor.
    - Uzak ana makinede güvenlik duvarı veya LAN bağlama değişiklikleri gerekiyor.
    - Model dizüstü bilgisayarınızdaki arka plan programında bulunuyor ancak uzak arka plan programında bulunmuyor.

  </Accordion>

  <Accordion title="Model, araç JSON'unu metin olarak çıkarıyor">
    Genellikle sağlayıcı OpenAI uyumlu moddadır veya model araç şemalarını
    işleyemiyordur. Yerel modu tercih edin:

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

    Küçük bir yerel model araç şemalarında hâlâ başarısız oluyorsa o model
    girdisinde `compat.supportsTools: false` ayarlayın ve yeniden test edin.

  </Accordion>

  <Accordion title="Kimi veya GLM bozuk semboller döndürüyor">
    Uzun ve dilsel olmayan sembol dizilerinden oluşan barındırılan Kimi/GLM
    yanıtları başarılı yanıt olarak değil, başarısız sağlayıcı çağrısı olarak
    değerlendirilir. Böylece bozuk metin oturuma kalıcı olarak yazılmak yerine
    normal yeniden deneme/geri dönüş/hata işleme devreye girer.

    Sorun tekrarlanırsa model adını, geçerli oturum dosyasını ve çalıştırmada
    `Cloud + Local` mı yoksa `Cloud only` mı kullanıldığını kaydedin; ardından
    yeni bir oturum ve geri dönüş modeli deneyin:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Soğuk yerel model zaman aşımına uğruyor">
    Büyük yerel modellerin ilk yüklemesi uzun sürebilir. Zaman aşımını Ollama
    sağlayıcısıyla sınırlayın ve isteğe bağlı olarak modeli etkileşimler arasında
    yüklü tutun:

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

    Ana makinenin bağlantıları kabul etmesi de yavaşsa `timeoutSeconds`, bu
    sağlayıcının korumalı bağlantı zaman aşımını da uzatır.

  </Accordion>

  <Accordion title="Geniş bağlamlı model çok yavaş veya belleği tükeniyor">
    Birçok model, donanımınızın rahatça çalıştırabileceğinden daha büyük
    bağlamların desteklendiğini belirtir. `params.num_ctx` ayarlanmadığı sürece
    yerel Ollama kendi çalışma zamanı varsayılanını kullanır. Öngörülebilir ilk
    token gecikmesi için hem OpenClaw bütçesini hem de Ollama istek bağlamını
    sınırlayın:

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

    OpenClaw çok fazla istem gönderiyorsa `contextWindow` değerini düşürün.
    Ollama'nın çalışma zamanı bağlamı makine için çok büyükse `params.num_ctx`
    değerini düşürün. Üretim çok uzun sürüyorsa `maxTokens` değerini düşürün.

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/tr/providers/ollama-cloud" icon="cloud">
    Özel `ollama-cloud` sağlayıcısıyla yalnızca buluta yönelik kurulum.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model referanslarına ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="Ollama Web Araması" href="/tr/tools/ollama-search" icon="magnifying-glass">
    Ollama destekli web araması için eksiksiz kurulum ve davranış ayrıntıları.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Eksiksiz yapılandırma referansı.
  </Card>
</CardGroup>
