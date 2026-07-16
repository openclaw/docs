---
read_when:
    - OpenClaw'u Ollama üzerinden bulut veya yerel modellerle çalıştırmak istiyorsunuz
    - Ollama kurulumu ve yapılandırmasıyla ilgili rehberliğe ihtiyacınız var
    - Görüntüleri anlamak için Ollama görsel modellerini kullanmak istiyorsunuz
summary: OpenClaw'u Ollama ile çalıştırın (bulut ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-07-16T17:32:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw, OpenAI uyumlu
`/v1` uç noktasıyla değil, Ollama'nın yerel API'siyle (`/api/chat`) iletişim kurar. Üç mod desteklenir:

| Mod           | Kullandığı kaynaklar                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| Bulut + Yerel | Yerel modelleri ve (oturum açılmışsa) `:cloud` modellerini sunan, erişilebilir bir Ollama ana makinesi |
| Yalnızca bulut | Doğrudan `https://ollama.com`; yerel arka plan programı yok                                |
| Yalnızca yerel | Erişilebilir bir Ollama ana makinesi; yalnızca yerel modeller                            |

Özel `ollama-cloud` sağlayıcı kimliğiyle yalnızca bulut kurulumu için
[Ollama Cloud](/tr/providers/ollama-cloud) sayfasına bakın. Bulut yönlendirmesini yerel bir
`ollama` sağlayıcısından ayrı tutmak istediğinizde `ollama-cloud/<model>` referanslarını kullanın.

<Warning>
`/v1` OpenAI uyumlu URL'sini (`http://host:11434/v1`) kullanmayın. Bu, araç çağrısını bozar ve modeller ham araç çağrısı JSON'unu düz metin olarak üretebilir. Yerel URL'yi kullanın: `baseUrl: "http://host:11434"` (`/v1` olmadan).
</Warning>

Standart yapılandırma anahtarı `baseUrl` şeklindedir. OpenAI SDK tarzı
örnekler için `baseURL` da kabul edilir, ancak yeni yapılandırmalarda
`baseUrl` kullanılmalıdır.

## Kimlik doğrulama kuralları

<AccordionGroup>
  <Accordion title="Yerel ve LAN ana makineleri">
    Geri döngü, özel ağ, `.local` ve yalnızca ana makine adı içeren Ollama URL'leri gerçek bir bearer token gerektirmez. OpenClaw bunlar için `ollama-local` işaretçisini kullanır.
  </Accordion>
  <Accordion title="Uzak ve Ollama Cloud ana makineleri">
    Herkese açık uzak ana makineler ve `https://ollama.com` gerçek bir kimlik bilgisi gerektirir: `OLLAMA_API_KEY`, bir kimlik doğrulama profili veya sağlayıcının `apiKey` değeri. Doğrudan barındırılan kullanım için `ollama-cloud` sağlayıcısını tercih edin.
  </Accordion>
  <Accordion title="Özel sağlayıcı kimlikleri">
    `api: "ollama"` içeren özel bir sağlayıcı aynı kurallara uyar. Örneğin, özel bir LAN ana makinesine yönlendirilmiş `ollama-remote` sağlayıcısı `apiKey: "ollama-local"` kullanabilir; alt ajanlar bu işaretçiyi eksik bir kimlik bilgisi olarak değerlendirmek yerine Ollama sağlayıcı kancası üzerinden çözümler. `agents.defaults.memorySearch.provider` ayrıca özel bir sağlayıcı kimliğine yönlendirilebilir; böylece gömmeler ilgili Ollama uç noktasını kullanır.
  </Accordion>
  <Accordion title="Kimlik doğrulama profilleri">
    `auth-profiles.json`, bir sağlayıcı kimliğinin kimlik bilgisini saklar; uç nokta ayarlarını (`baseUrl`, `api`, modeller, üstbilgiler, zaman aşımları) `models.providers.<id>` içine koyun. `{ "ollama-windows": { "apiKey": "ollama-local" } }` gibi eski düz dosyalar çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları yedeğini alarak standart bir `ollama-windows:default` API anahtarı profiline dönüştürür. Bu eski dosyadaki `baseUrl` değeri gereksizdir ve sağlayıcı yapılandırmasına taşınmalıdır.
  </Accordion>
  <Accordion title="Bellek gömme kapsamı">
    Ollama bellek gömmeleri için bearer kimlik doğrulaması, bildirildiği ana makineyle sınırlıdır:

    - Sağlayıcı düzeyindeki anahtar yalnızca ilgili sağlayıcının ana makinesine gönderilir.
    - `agents.*.memorySearch.remote.apiKey` yalnızca kendi uzak gömme ana makinesine gönderilir.
    - Yalın bir `OLLAMA_API_KEY` ortam değişkeni değeri, Ollama Cloud kuralı olarak değerlendirilir ve varsayılan olarak yerel/kendi barındırılan ana makinelere gönderilmez.

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

        Yeni bir rehberli kurulumda OpenClaw önce varsayılan veya yapılandırılmış
        Ollama ana makinesini denetler. Kurulu bir model araç desteğini bildiriyorsa ortak
        CLI/macOS kurulum sıralaması modeli hemen sunar ve gerçek bir
        tamamlama işlemiyle doğrular. Bu otomatik denetim hiçbir zaman model çekmez;
        uygun bir kurulu model yoksa ilk kurulum normal Ollama seçicisiyle devam eder.
      </Step>
      <Step title="Bir model seçin">
        `Cloud only`, `OLLAMA_API_KEY` için istemde bulunur ve barındırılan bulut varsayılanlarını önerir. `Cloud + Local` ve `Local only`, Ollama temel URL'si için istemde bulunur, kullanılabilir modelleri keşfeder ve seçilen yerel model eksikse otomatik olarak çeker. `gemma4:latest` gibi kurulu bir `:latest` etiketi, `gemma4` çoğaltılmadan bir kez gösterilir. `Cloud + Local` ayrıca ana makinede bulut erişimi için oturum açılıp açılmadığını denetler.
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

    `--custom-base-url` ve `--custom-model-id` isteğe bağlıdır; bunların belirtilmemesi yerel varsayılan ana makineyi ve `gemma4` önerilen modelini kullanır.

  </Tab>

  <Tab title="Manuel kurulum">
    <Steps>
      <Step title="Ollama'yı kurup başlatın">
        [ollama.com/download](https://ollama.com/download) adresinden edinin, ardından bir model çekin:

        ```bash
        ollama pull gemma4
        ```

        Hibrit bulut erişimi için aynı ana makinede `ollama signin` komutunu çalıştırın.
      </Step>
      <Step title="Bir kimlik bilgisi ayarlayın">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # yerel/LAN ana makinesi, herhangi bir değer çalışır
        export OLLAMA_API_KEY="your-real-key"   # yalnızca https://ollama.com
        ```

        Alternatif olarak yapılandırmada: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Modeli seçin">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Alternatif olarak yapılandırmada:

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

`Cloud + Local`, hem yerel hem de `:cloud` modellerini erişilebilir tek bir
Ollama ana makinesi üzerinden yönlendirir. Bu, Ollama'nın hibrit akışıdır ve her
ikisini de istediğinizde kurulum sırasında seçmeniz gereken moddur.

OpenClaw temel URL için istemde bulunur, yerel modelleri keşfeder ve
`ollama signin` durumunu denetler. Oturum açılmışsa barındırılan varsayılanları
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`) önerir. Oturum
açılmamışsa `ollama signin` komutunu çalıştırana kadar kurulum yalnızca yerel modda kalır.

Yerel arka plan programı olmadan yalnızca bulut erişimi için `openclaw onboard --auth-choice ollama-cloud` kullanın ve [Ollama Cloud](/tr/providers/ollama-cloud) sayfasına bakın. Bu yol `ollama signin` veya çalışan bir sunucu gerektirmez:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` sırasında gösterilen bulut modeli listesi
`https://ollama.com/api/tags` kaynağından canlı olarak doldurulur ve 500 girişle sınırlandırılır; böylece seçici
güncel barındırılan kataloğu yansıtır. `ollama.com` erişilemez durumdaysa veya kurulum
sırasında model döndürmezse OpenClaw, ilk kurulumun yine de tamamlanabilmesi için
sabit kodlanmış öneri listesine geri döner.

## Model keşfi (örtük sağlayıcı)

`OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ayarlanmışsa ve ne
`models.providers.ollama` ne de `api: "ollama"` içeren başka bir özel sağlayıcı
tanımlanmışsa OpenClaw modelleri `http://127.0.0.1:11434` kaynağından keşfeder:

| Davranış             | Ayrıntı                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalog sorgusu      | `/api/tags`                                                                                                                                                                                                                                                                                   |
| Yetenek algılama     | En iyi çabayla yapılan `/api/show`, `contextWindow`, `num_ctx` Modelfile parametrelerini ve yetenekleri (görüntü/araçlar/düşünme) okur                                                                                                                                                                       |
| Görüntü modelleri    | `/api/show` kaynağındaki bir `vision` yeteneği, modeli görüntü işleyebilir (`input: ["text", "image"]`) olarak işaretler                                                                                                                                                                                             |
| Akıl yürütme algılama | Kullanılabilir olduğunda `/api/show` kaynağındaki `thinking` yeteneğini kullanır; Ollama yetenekleri sağlamadığında ad sezgisine (`r1`, `reason`, `reasoning`, `think`) geri döner. `glm-5.2:cloud` ve `deepseek-v4-flash\|pro:cloud`, bildirilen yeteneklerden bağımsız olarak her zaman akıl yürütme modeli kabul edilir. |
| Token sınırları      | `maxTokens`, varsayılan olarak OpenClaw'ın Ollama maksimum token sınırını kullanır                                                                                                                                                                                                                                       |
| Maliyetler           | Tüm maliyetler `0` değerindedir                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

Açık bir `models` dizisiyle `models.providers.ollama` ayarlamak veya
`api: "ollama"` ve geri döngü olmayan bir `baseUrl` içeren özel bir sağlayıcı,
otomatik keşfi devre dışı bırakır; bu durumda modeller manuel olarak tanımlanmalıdır
([Yapılandırma](#configuration) bölümüne bakın). Barındırılan `https://ollama.com`
adresine yönlendirilmiş bir `models.providers.ollama` girdisi de keşfi atlar; çünkü Ollama Cloud modelleri
sağlayıcı tarafından yönetilir. `http://127.0.0.2:11434` gibi geri döngü özel sağlayıcıları
yine yerel kabul edilir ve otomatik keşfi korur.

Elle yazılmış bir `models.json` girdisi olmadan
`ollama/<pulled-model>:latest` gibi tam bir referans kullanabilirsiniz; OpenClaw bunu canlı olarak çözümler. Oturum
açılmış ana makinelerde listelenmemiş bir `ollama/<model>:cloud` referansı seçildiğinde ilgili
model `/api/show` ile doğrulanır ve yalnızca Ollama meta verileri
onaylarsa çalışma zamanı kataloğuna eklenir; yazım hataları yine bilinmeyen model hatası verir.

### Duman testleri

Tam ajan araç yüzeyini atlayan dar kapsamlı bir metin yoklaması için:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Tam olarak şu yanıtı ver: pong" \
    --json
```

Hafif bir görüntü modeli yoklaması için bir görüntüyle birlikte `--file` ekleyin (PNG/JPEG/WebP kabul edilir;
görüntü olmayan dosyalar Ollama çağrılmadan önce reddedilir; ses için
`openclaw infer audio transcribe` kullanın):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Bu görüntüyü tek cümleyle açıklayın." \
    --file ./photo.jpg \
    --json
```

Her iki yol da sohbet araçlarını, belleği veya oturum bağlamını yüklemez. Normal
ajan yanıtları başarısız olurken bu işlem başarılı olursa sorun büyük olasılıkla
uç noktada değil, modelin araç/ajan kapasitesindedir.

`/model ollama/<model>` ile bir model seçmek kesin bir kullanıcı tercihidir:
yapılandırılmış `baseUrl` erişilemez durumdaysa sonraki yanıt, sessizce
yapılandırılmış başka bir modele geri dönmek yerine sağlayıcı hatasıyla başarısız olur.

Yalıtılmış cron işleri, agent turunu başlatmadan önce bir yerel güvenlik denetimi ekler:
seçilen model yerel/özel ağ/`.local` Ollama
sağlayıcısına çözümlenirse ve `/api/tags` erişilemez durumdaysa OpenClaw, bu çalıştırmayı
hata metninde modelle birlikte `skipped` olarak kaydeder. Bu uç nokta denetimi
ana bilgisayar başına 5 dakika önbelleğe alınır; böylece durdurulmuş bir daemon'a yönelik yinelenen cron işleri
başarısız olacak istekleri topluca başlatmaz.

Canlı doğrulama:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud için aynı canlı testi barındırılan uç noktaya yönlendirin (varsayılan olarak
gömmeleri atlar; bir bulut anahtarı `/api/embed` için yetki vermeyebileceğinden
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

Agent'lar kısa bir görevi eşleştirilmiş bir masaüstündeki veya
sunucu Node'undaki Ollama modeline devredebilir. İstem ve yanıt, mevcut kimliği doğrulanmış
Gateway/Node bağlantısından geçer; istek Node'un kendi geri döngü Ollama
uç noktasında (`http://127.0.0.1:11434`) çalışır.

<Steps>
  <Step title="Node üzerinde Ollama'yı başlatın">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Node ana bilgisayarını bağlayın">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Gateway ana bilgisayarında cihazı ve Node komutlarını onaylayın, ardından doğrulayın:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    İlk bağlantı veya Ollama komutları ekleyen bir yükseltme,
    Node komutu onayını tetikleyebilir. Node, `ollama.models` ve
    `ollama.chat` tanıtmadan bağlanırsa `openclaw nodes pending` ayarını yeniden denetleyin.

  </Step>
  <Step title="Bir agent üzerinden kullanın">
    Birlikte gelen Ollama plugin'i `node_inference` aracını sunar. Agent'lar
    önce `action: "discover"`, ardından bu sonuçtaki bir Node ve modelle
    `action: "run"` çağrısı yapar (tam olarak bir yetenekli Node bağlıysa
    `run` Node'u atlayabilir). Örneğin: "Node'larımdaki Ollama modellerini keşfet,
    ardından bu metni özetlemek için yüklenmiş en hızlı modeli kullan."
  </Step>
</Steps>

Keşif, `/api/tags` verisini okur, `/api/show` yeteneklerini denetler ve
kullanılabilir olduğunda zaten yüklenmiş modelleri ilk sıraya koymak için
`/api/ps` kullanır. Yalnızca Ollama'nın sohbet yeteneğine sahip olduğunu bildirdiği
yerel modelleri (`completion` yeteneği) döndürür — Ollama Cloud satırları ve yalnızca
gömme modelleri hariç tutulur. Her çalıştırma modelin düşünmesini devre dışı bırakır ve
araç çağrısı farklı bir `maxTokens` istemedikçe çıktıyı varsayılan olarak 512 token ile
sınırlar (kesin üst sınır 8192); bazı modeller (örneğin GPT-OSS), düşünmenin devre dışı
bırakılmasını desteklemez ve yine de akıl yürütme token'ları üretebilir.

Ollama'yı agent'lara sunmadan bir Node üzerinde çalışır durumda tutmak için:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Node'u yeniden başlatın (`openclaw node restart`; ön plandaki bir oturum içinse
`openclaw node run` işlemini durdurup yeniden çalıştırın). Node, `ollama.models` ve
`ollama.chat` tanıtımını durdurur; Ollama'nın kendisi ve Gateway'in Ollama sağlayıcısı
bundan etkilenmez. Yeniden etkinleştirmek için değeri tekrar `true` olarak ayarlayıp
yeniden başlatın; değişen bir komut yüzeyi, yeniden bağlandıktan sonra tekrar
`openclaw nodes pending` onayı gerektirebilir.

Node komutlarını bir agent turu olmadan doğrudan doğrulayın:

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

`--invoke-timeout`, Node'un komutu çalıştırabileceği süreyi sınırlar;
`--timeout` ise genel Gateway çağrısını sınırlar ve daha büyük olmalıdır.

Node üzerinde yerel çıkarım her zaman Node'un kendi geri döngü uç noktasını kullanır —
yapılandırılmış uzak/bulut `models.providers.ollama.baseUrl` değerini yeniden kullanmaz.
Node komutları macOS, Linux ve Windows Node ana bilgisayarlarında varsayılan olarak
kullanılabilir ve normal Node eşleştirme/komut politikasına tabi olmaya devam eder.

## Görüntü ve görsel açıklaması

Birlikte gelen Ollama plugin'i, Ollama'yı görüntü özellikli bir
medya anlama sağlayıcısı olarak kaydeder; böylece OpenClaw, açık görsel açıklama
isteklerini ve yapılandırılmış görsel modeli varsayılanlarını yerel veya barındırılan
Ollama görüntü modellerine yönlendirebilir.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` tam bir `<provider/model>` referansı olmalıdır; ayarlandığında
`infer image
describe`, zaten yerel görüntü desteği bulunan modeller için açıklamayı atlamak
yerine önce bu modeli dener. Çağrı başarısız olursa OpenClaw, `agents.defaults.imageModel.fallbacks` üzerinden
devam edebilir; dosya/URL hazırlama hataları, geri dönüş denenmeden önce başarısız olur.
OpenClaw'ın görsel anlama akışı ve yapılandırılmış `imageModel` için
`infer image describe`; özel istem içeren ham bir çok modlu yoklama için `infer model run
--file`
kullanın.

Ollama'yı gelen medya için varsayılan görsel anlama sağlayıcısı yapmak üzere:

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

Tam `ollama/<model>` referansını tercih edin. `qwen2.5vl:7b` gibi yalın bir
`imageModel` referansı yalnızca tam olarak bu model `models.providers.ollama.models` altında
`input: ["text", "image"]` ile listeleniyorsa ve yapılandırılmış başka hiçbir görüntü sağlayıcısı
aynı yalın kimliği sunmuyorsa `ollama/qwen2.5vl:7b` biçimine normalleştirilir; aksi takdirde
sağlayıcı önekini açıkça kullanın.

Yavaş yerel görüntü modelleri, bulut modellerinden daha uzun bir görsel anlama zaman aşımına
ihtiyaç duyabilir ve Ollama modelin tanıtılan tam görüntü bağlamını ayırmaya çalışırsa
kısıtlı donanımda çökebilir. Bir yetenek zaman aşımı ayarlayın ve
`num_ctx` değerini sınırlayın:

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

Bu zaman aşımı, gelen görsellerin anlaşılmasına ve açık
`image` aracına uygulanır. `models.providers.ollama.timeoutSeconds`, normal model çağrıları için
temeldeki Ollama HTTP isteği korumasını kontrol etmeye devam eder.

Canlı doğrulama:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` değerini elle tanımlarsanız görüntü modellerini
açıkça işaretleyin:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw, görüntü özellikli olarak işaretlenmemiş modellere yönelik görsel açıklama
isteklerini reddeder. Örtük keşifte bu, `/api/show` görüntü yeteneğinden gelir.

## Yapılandırma

<Tabs>
  <Tab title="Temel (örtük keşif)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` ayarlanmışsa sağlayıcı girdisinde `apiKey` değerini atlayabilirsiniz; OpenClaw, kullanılabilirlik denetimleri için bunu doldurur.
    </Tip>

  </Tab>

  <Tab title="Açık (elle tanımlanan modeller)">
    Barındırılan bulut kurulumu, varsayılan olmayan bir ana bilgisayar/bağlantı noktası,
    zorunlu bağlam pencereleri veya tamamen elle yönetilen model listeleri için açık
    yapılandırma kullanın:

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
    Açık yapılandırma otomatik keşfi devre dışı bırakır; bu nedenle modeller listelenmelidir:

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
    `/v1` eklemeyin. Bu yol, araç çağırmanın güvenilir olmadığı OpenAI uyumlu modu seçer.
    </Warning>

  </Tab>
</Tabs>

## Yaygın tarifler

Model kimliklerini `ollama list` veya `openclaw models list --provider ollama` çıktısındaki tam adlarla değiştirin.

<AccordionGroup>
  <Accordion title="Otomatik keşifli yerel model">
    Gateway ile aynı makinede bulunan Ollama otomatik olarak keşfedilir:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Elle tanımlanan modellere ihtiyacınız olmadıkça `models.providers.ollama` bloğu eklemeyin.

  </Accordion>

  <Accordion title="Elle tanımlanan modellere sahip LAN Ollama ana bilgisayarı">
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

    `contextWindow`, OpenClaw'ın bağlam bütçesidir; `params.num_ctx` ise
    Ollama'ya gönderilir. Donanım, modelin tanıtılan tam bağlamını çalıştıramıyorsa
    bunları uyumlu tutun.

  </Accordion>

  <Accordion title="Yalnızca Ollama Cloud">
    Yerel daemon olmadan doğrudan barındırılan modeller:

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

    Bu biçim yerine özel `ollama-cloud` sağlayıcı kimliği için
    [Ollama Cloud](/tr/providers/ollama-cloud) bölümüne bakın.

  </Accordion>

  <Accordion title="Oturum açılmış bir daemon üzerinden bulut ve yerel kullanım">
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

  <Accordion title="Birden fazla Ollama ana makinesi">
    Birden fazla Ollama sunucusu çalıştırılırken özel sağlayıcı kimlikleri kullanılır; her birinin
    kendi ana makinesi, modelleri, kimlik doğrulaması ve zaman aşımı vardır.

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

    OpenClaw, Ollama'yı çağırmadan önce etkin sağlayıcı önekini kaldırır (önek yoksa yalın
    `ollama/` önekini kullanır); bu nedenle `ollama-large/qwen3.5:27b`,
    Ollama'ya `qwen3.5:27b` olarak ulaşır.

  </Accordion>

  <Accordion title="Hafif yerel model profili">
    Bazı yerel modeller basit istemleri işleyebilir, ancak eksiksiz ajan
    araç yüzeyinde zorlanır. Genel çalışma zamanı ayarlarına dokunmadan önce
    araçları ve bağlamı sınırlayın:

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

    `compat.supportsTools: false` yalnızca model veya sunucu araç şemalarında güvenilir biçimde
    başarısız olduğunda kullanılmalıdır; kararlılık karşılığında ajan kabiliyetinden ödün verir.
    `localModelLean`, açıkça gerekmedikçe ağır tarayıcı, cron, mesaj, medya oluşturma,
    ses ve PDF araçlarını doğrudan ajan yüzeyinden kaldırır ve daha büyük katalogları
    Araç Arama'nın arkasına yerleştirir. Ollama'nın çalışma zamanı bağlamını veya düşünme
    modunu değiştirmez. Döngüye giren ya da bütçesini gizli akıl yürütmeye harcayan
    küçük Qwen tarzı düşünme modellerinde bunu `params.num_ctx` ve
    `params.thinking: false` ile birlikte kullanın.

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

Özel sağlayıcı kimlikleri de aynı şekilde çalışır: `ollama-spark/qwen3:32b` gibi etkin sağlayıcı
önekini kullanan bir başvuru için OpenClaw, Ollama'yı çağırmadan önce bu öneki kaldırır
ve `qwen3:32b` gönderir.

Yavaş yerel modeller için tüm ajan çalışma zamanı zaman aşımını artırmadan önce
sağlayıcı kapsamındaki ince ayarları tercih edin:

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

`timeoutSeconds` model HTTP isteğinin tamamını kapsar: bağlantı kurulumu, üstbilgiler,
gövde akışı ve korumalı getirmenin toplam iptali. `params.keep_alive`, yerel
`/api/chat` isteklerinde üst düzey `keep_alive` olarak iletilir; ilk turdaki
yükleme süresi darboğaz oluşturuyorsa bunu model bazında ayarlayın.

### Hızlı doğrulama

```bash
# Ollama daemon'ı bu makine tarafından görülebiliyor
curl http://127.0.0.1:11434/api/tags

# OpenClaw kataloğu ve seçili model
openclaw models list --provider ollama
openclaw models status

# Doğrudan model duman testi
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Tam olarak şu yanıtı ver: ok"
```

Uzak ana makineler için `127.0.0.1` değerini `baseUrl` ana makinesiyle değiştirin. `curl`
çalışıyor ancak OpenClaw çalışmıyorsa Gateway'in farklı bir makinede,
kapsayıcıda veya hizmet hesabıyla çalışıp çalışmadığını kontrol edin.

## Ollama Web Arama

OpenClaw, **Ollama Web Arama** özelliğini bir `web_search` sağlayıcısı olarak paketler.

| Özellik     | Ayrıntı                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ana makine  | Ayarlandığında `models.providers.ollama.baseUrl`, aksi takdirde `http://127.0.0.1:11434`; `https://ollama.com` barındırılan API'yi doğrudan kullanır                          |
| Kimlik doğrulama | Oturum açılmış yerel ana makinede anahtarsızdır; doğrudan `https://ollama.com` araması veya kimlik doğrulama korumalı ana makineler için `OLLAMA_API_KEY` ya da yapılandırılmış sağlayıcı kimlik doğrulaması |
| Gereksinim  | Yerel/kendi barındırdığınız ana makineler çalışıyor ve `ollama signin` ile oturum açılmış olmalıdır; doğrudan barındırılan arama için `baseUrl: "https://ollama.com"` ile gerçek bir API anahtarı gerekir |

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

Kendi barındırdığınız bir ana makine için OpenClaw önce yerel `/api/experimental/web_search`
vekilini dener, ardından aynı ana makinedeki barındırılan `/api/web_search` yoluna geri döner;
oturum açılmış yerel bir daemon normalde yerel vekil üzerinden yanıt verir. Doğrudan
`https://ollama.com` çağrıları her zaman barındırılan `/api/web_search` uç noktasını kullanır.

<Note>
Eksiksiz kurulum ve davranış bilgileri için [Ollama Web Arama](/tr/tools/ollama-search) bölümüne bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Eski OpenAI uyumlu modu">
    <Warning>
    **Bu modda araç çağırma güvenilir değildir.** Yalnızca bir vekil OpenAI biçimi gerektiriyorsa ve yerel araç çağırmaya bağımlı değilseniz kullanın.
    </Warning>

    `/v1/chat/completions` arkasındaki bir vekil için `api: "openai-completions"` değerini
    açıkça ayarlayın:

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

    Bu mod, akış ile araç çağırmayı eşzamanlı olarak desteklemeyebilir; modelde
    `params: { streaming: false }` kullanmanız gerekebilir.

    OpenClaw, Ollama'nın sessizce 4096 belirteçlik bir bağlama geri dönmemesi için
    bu modda varsayılan olarak `options.num_ctx` ekler. Vekiliniz bilinmeyen
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
    Otomatik keşfedilen modeller için OpenClaw, özel Modelfile'lardaki daha büyük
    `PARAMETER num_ctx` değerleri de dahil olmak üzere `/api/show` tarafından
    bildirilen bağlam penceresini kullanır; aksi takdirde OpenClaw'ın varsayılan Ollama
    bağlam penceresine geri döner.

    Sağlayıcı düzeyindeki `contextWindow`, `contextTokens` ve `maxTokens`,
    ilgili sağlayıcının altındaki her model için varsayılanları belirler ve model bazında
    geçersiz kılınabilir. `contextWindow`, OpenClaw'ın kendi istem/Compaction bütçesidir. Yerel
    `/api/chat` istekleri, `params.num_ctx` açıkça ayarlanmadıkça
    `options.num_ctx` değerini ayarlamaz; böylece Ollama kendi model,
    `OLLAMA_CONTEXT_LENGTH` veya VRAM tabanlı varsayılanını uygular; geçersiz, sıfır, negatif
    veya sonlu olmayan `params.num_ctx` değerleri yok sayılır. Eski bir yapılandırma,
    yerel istek bağlamını zorlamak için yalnızca `contextWindow`/`maxTokens`
    kullandıysa bunları `params.num_ctx` alanına kopyalamak için `openclaw doctor --fix`
    komutunu çalıştırın. OpenAI uyumlu bağdaştırıcı, yapılandırılmış
    `params.num_ctx` veya `contextWindow` değerinden varsayılan olarak
    `options.num_ctx` eklemeye devam eder; üst sistem `options` değerini
    reddediyorsa `injectNumCtxForOpenAICompat: false` ile devre dışı bırakın.

    Yerel model girdileri ayrıca `params` altında yaygın Ollama çalışma zamanı
    seçeneklerini kabul eder ve bunları yerel `/api/chat` `options` olarak iletir: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` ve `num_thread`.
    Birkaç anahtar (`format`, `keep_alive`, `truncate`, `shift`), iç içe
    `options` yerine üst düzey istek alanları olarak iletilir. OpenClaw yalnızca
    bu Ollama istek anahtarlarını iletir; bu nedenle `streaming` gibi yalnızca çalışma
    zamanına özgü parametreler Ollama'ya asla gönderilmez. Üst düzey `think`
    değerini ayarlamak için `params.think` (veya `params.thinking`) kullanın;
    `false`, Qwen tarzı düşünme modellerinde API düzeyindeki düşünmeyi devre dışı bırakır.

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

    Model bazındaki `agents.defaults.models["ollama/<model>"].params.num_ctx` de
    çalışır; ikisi de ayarlanmışsa açık sağlayıcı model girdisi önceliklidir.

  </Accordion>

  <Accordion title="Düşünme denetimi">
    OpenClaw, düşünmeyi Ollama'nın beklediği biçimde iletir: `options.think` değil,
    üst düzey `think`. `/api/show` değeri bir
    `thinking` kabiliyeti bildiren otomatik keşfedilmiş modeller
    `/think low`, `/think medium`, `/think high` ve
    `/think max` seçeneklerini sunar; düşünmeyen modeller yalnızca
    `/think off` seçeneğini sunar.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Veya bir model varsayılanı ayarlayın:

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

    Model başına `params.think`/`params.thinking`, belirli bir model için API
    düşünmesini devre dışı bırakabilir veya zorunlu kılabilir. Etkin çalıştırmada yalnızca örtük
    `off` varsayılanı olduğunda OpenClaw bu açık yapılandırmayı korur; `/think medium`
    gibi kapalı olmayan bir çalışma zamanı komutu yine de bunu geçersiz kılar. Doğru değerli bir
    düşünme isteği, açıkça `reasoning: false` olarak işaretlenmiş bir modele hiçbir zaman
    gönderilmez; `think: false` isteği ise her durumda gönderilir.

  </Accordion>

  <Accordion title="Akıl yürütme modelleri">
    `deepseek-r1`, `reasoning`, `reason` veya `think` adlı modeller
    varsayılan olarak akıl yürütme yeteneğine sahip kabul edilir; ek yapılandırma gerekmez:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Model maliyetleri">
    Ollama yerel olarak çalışır ve ücretsizdir; bu nedenle hem otomatik keşfedilen hem de
    elle tanımlanan modellerin tüm model maliyetleri `0` değerindedir.
  </Accordion>

  <Accordion title="Bellek gömmeleri">
    Paketle birlikte gelen Ollama plugin'i, [bellek araması](/tr/concepts/memory) için
    bir bellek gömme sağlayıcısı kaydeder. Yapılandırılmış Ollama temel URL'sini
    ve API anahtarını kullanır, `/api/embed` çağrısı yapar ve mümkün olduğunda
    birden çok bellek parçasını tek bir `input` isteğinde toplar.

    `proxy.enabled=true` olduğunda, yapılandırılmış `baseUrl` değerinden
    türetilen tam yerel ana makine geri döngü kaynağına yönelik gömme istekleri,
    yönetilen iletme proxy'si yerine OpenClaw'ın korumalı doğrudan yolunu kullanır.
    Yapılandırılmış ana makine adının kendisi `localhost` veya bir geri döngü
    IP sabiti olmalıdır; yalnızca geri döngüye çözümlenen DNS adları yine yönetilen
    proxy yolunu kullanır. LAN, tailnet, özel ağ ve genel Ollama ana makineleri her
    zaman yönetilen proxy yolunda kalır ve başka bir ana makineye/porta yapılan
    yönlendirmeler güveni devralmaz. `proxy.loopbackMode: "proxy"`, geri döngü trafiğini
    yine de proxy üzerinden yönlendirir; `proxy.loopbackMode: "block"` ise bağlantı kurmadan
    önce bunu reddeder — bkz. [Yönetilen proxy](/tr/security/network-proxy#gateway-loopback-mode).

    | Özellik | Değer |
    | --- | --- |
    | Varsayılan model | `nomic-embed-text` |
    | Otomatik indirme | Evet, yerel olarak mevcut değilse |
    | Varsayılan satır içi eşzamanlılık | 1 (diğer sağlayıcıların varsayılanı daha yüksektir; ana makine kaldırabiliyorsa `nonBatchConcurrency` ile artırın) |

    Sorgu zamanı gömmeleri, bunları gerektiren veya öneren modeller için
    getirme ön eklerini kullanır: `nomic-embed-text`, `qwen3-embedding` ve
    `mxbai-embed-large`. Belge grupları ham hâlde kalır; dolayısıyla mevcut
    dizinler için biçim geçişi gerekmez.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Ollama için varsayılan değer. Yeniden dizinleme çok yavaşsa daha büyük ana makinelerde artırın.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Uzak bir gömme ana makinesi için kimlik doğrulamayı o ana makineyle sınırlı tutun:

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
    Ollama varsayılan olarak akış ile araç çağrısını birlikte destekleyen
    **yerel API'yi** (`/api/chat`) kullanır; özel yapılandırma gerekmez.

    Yerel isteklerde düşünme denetimi doğrudan iletilir: açık bir
    `params.think`/`params.thinking` yapılandırılmadığı sürece
    `/think off` ve `openclaw agent --thinking off`, üst düzey `think: false`
    gönderir; `/think
    low|medium|high` eşleşen çaba dizesini gönderir; `/think max`,
    Ollama'nın en yüksek çaba düzeyi olan `think: "high"` değerine eşlenir.

    <Tip>
    Bunun yerine OpenAI uyumlu uç nokta için yukarıdaki "Eski OpenAI uyumlu modu" bölümüne bakın; akış ve araç çağrısı burada birlikte çalışmayabilir.
    </Tip>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="WSL2 çökme döngüsü (yinelenen yeniden başlatmalar)">
    NVIDIA/CUDA kullanılan WSL2'de resmî Ollama Linux yükleyicisi,
    `Restart=always` içeren bir `ollama.service` systemd birimi oluşturur.
    Bu hizmet otomatik olarak başlar ve WSL2 önyüklemesi sırasında GPU destekli
    bir model yüklerse Ollama, yükleme sırasında ana makine belleğini sabitleyebilir;
    Hyper-V bellek geri kazanımı bu sayfaları her zaman geri kazanamaz. Bunun
    sonucunda Windows, WSL2 sanal makinesini sonlandırabilir, systemd Ollama'yı
    yeniden başlatır ve döngü yinelenir.

    Belirtiler: yinelenen WSL2 yeniden başlatmaları/sonlandırmaları, WSL2
    başlatıldıktan hemen sonra `app.slice` veya `ollama.service` içinde
    yüksek CPU kullanımı ve Linux OOM sonlandırıcısı yerine systemd'den gelen SIGTERM.

    OpenClaw; WSL2'yi, `Restart=always` ile etkinleştirilmiş
    `ollama.service` değerini ve görünür CUDA işaretlerini algıladığında
    bir başlatma uyarısı günlüğe kaydeder.

    Azaltma:

    ```bash
    sudo systemctl disable ollama
    ```

    Windows tarafında bunu `%USERPROFILE%\.wslconfig` dosyasına ekleyin, ardından
    `wsl --shutdown` komutunu çalıştırın:

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
    Ollama'nın çalıştığını, `OLLAMA_API_KEY` değerinin (veya bir kimlik
    doğrulama profilinin) ayarlandığını ve `models.providers.ollama` değerinin açıkça
    tanımlanmadığını doğrulayın:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Kullanılabilir model yok">
    Modeli yerel olarak indirin veya `models.providers.ollama` içinde açıkça tanımlayın:

    ```bash
    ollama list  # Nelerin yüklü olduğunu görün
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Veya başka bir model
    ```

  </Accordion>

  <Accordion title="Bağlantı reddedildi">
    ```bash
    # Ollama'nın çalışıp çalışmadığını denetleyin
    ps aux | grep ollama

    # Veya Ollama'yı yeniden başlatın
    ollama serve
    ```

  </Accordion>

  <Accordion title="Uzak ana makine curl ile çalışıyor ancak OpenClaw ile çalışmıyor">
    Gateway'i çalıştıran aynı makine ve çalışma zamanı üzerinden doğrulayın:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Yaygın nedenler:

    - `baseUrl`, `localhost` değerini gösteriyor ancak Gateway Docker içinde veya başka bir ana makinede çalışıyor.
    - URL, `/v1` kullanarak yerel Ollama davranışı yerine OpenAI uyumlu davranışı seçiyor.
    - Uzak ana makinede güvenlik duvarı veya LAN bağlama değişiklikleri gerekiyor.
    - Model dizüstü bilgisayarınızdaki daemon'da bulunuyor ancak uzak daemon'da bulunmuyor.

  </Accordion>

  <Accordion title="Model araç JSON'unu metin olarak çıkarıyor">
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
    girdisinde `compat.supportsTools: false` değerini ayarlayıp yeniden test edin.

  </Accordion>

  <Accordion title="Kimi veya GLM bozuk semboller döndürüyor">
    Uzun ve dilsel olmayan sembol dizilerinden oluşan barındırılan Kimi/GLM
    yanıtları, başarılı bir yanıt yerine başarısız bir sağlayıcı çağrısı olarak
    değerlendirilir. Böylece bozuk metni oturuma kaydetmek yerine normal yeniden
    deneme/yedek/hatta işleme devreye girer.

    Sorun yinelenirse model adını, geçerli oturum dosyasını ve çalıştırmanın
    `Cloud + Local` mı yoksa `Cloud only` mı kullandığını kaydedin;
    ardından yeni bir oturum ve yedek model deneyin:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Tam olarak şununla yanıt ver: ok" --json
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

    Ana makinenin bağlantıları kabul etmesi de yavaşsa `timeoutSeconds`,
    bu sağlayıcı için korumalı bağlantı zaman aşımını da uzatır.

  </Accordion>

  <Accordion title="Geniş bağlamlı model çok yavaş veya belleği tükeniyor">
    Birçok model, donanımınızın rahatça çalıştırabileceğinden daha geniş bağlamlar
    bildirir. `params.num_ctx` ayarlanmadığı sürece yerel Ollama kendi çalışma
    zamanı varsayılanını kullanır. Öngörülebilir ilk belirteç gecikmesi için hem
    OpenClaw'ın bütçesini hem de Ollama'nın istek bağlamını sınırlayın:

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
