---
read_when:
    - OpenClaw’ı Ollama aracılığıyla bulut veya yerel modellerle çalıştırmak istiyorsunuz
    - Ollama kurulumu ve yapılandırma rehberliğine ihtiyacınız var
    - Görsel anlama için Ollama vision modelleri istiyorsunuz
summary: OpenClaw'u Ollama ile çalıştırın (bulut ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:55:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw, barındırılan bulut modelleri ve yerel/kendi kendine barındırılan Ollama sunucuları için Ollama'nın yerel API'siyle (`/api/chat`) entegre olur. Ollama'yı üç modda kullanabilirsiniz: erişilebilir bir Ollama ana makinesi üzerinden `Cloud + Local`, `https://ollama.com` karşısında `Cloud only` veya erişilebilir bir Ollama ana makinesi karşısında `Local only`.

OpenClaw ayrıca doğrudan Ollama Cloud kullanımı için `ollama-cloud` değerini birinci sınıf barındırılan sağlayıcı kimliği olarak kaydeder. Yerel `ollama` sağlayıcı kimliğini paylaşmadan yalnızca bulut yönlendirmesi istediğinizde `ollama-cloud/kimi-k2.5:cloud` gibi başvurular kullanın.

Ayrılmış yalnızca bulut kurulum sayfası için bkz. [Ollama Cloud](/tr/providers/ollama-cloud).

<Warning>
**Uzak Ollama kullanıcıları**: OpenClaw ile `/v1` OpenAI uyumlu URL'sini (`http://host:11434/v1`) kullanmayın. Bu, araç çağırmayı bozar ve modeller ham araç JSON'unu düz metin olarak çıktılayabilir. Bunun yerine yerel Ollama API URL'sini kullanın: `baseUrl: "http://host:11434"` (`/v1` yok).
</Warning>

Ollama sağlayıcı yapılandırması, kanonik anahtar olarak `baseUrl` kullanır. OpenClaw, OpenAI SDK tarzı örneklerle uyumluluk için `baseURL` değerini de kabul eder, ancak yeni yapılandırma `baseUrl` değerini tercih etmelidir.

## Kimlik doğrulama kuralları

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Yerel ve LAN Ollama ana makineleri gerçek bir bearer token gerektirmez. OpenClaw, yerel `ollama-local` işaretleyicisini yalnızca loopback, özel ağ, `.local` ve çıplak ana makine adlı Ollama temel URL'leri için kullanır.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Uzak herkese açık ana makineler ve Ollama Cloud (`https://ollama.com`), `OLLAMA_API_KEY`, bir kimlik doğrulama profili veya sağlayıcının `apiKey` değeri üzerinden gerçek bir kimlik bilgisi gerektirir. Doğrudan barındırılan kullanım için `ollama-cloud` sağlayıcısını tercih edin.
  </Accordion>
  <Accordion title="Custom provider ids">
    `api: "ollama"` ayarlayan özel sağlayıcı kimlikleri aynı kuralları izler. Örneğin, özel bir LAN Ollama ana makinesini işaret eden bir `ollama-remote` sağlayıcısı `apiKey: "ollama-local"` kullanabilir ve alt ajanlar bu işaretleyiciyi eksik kimlik bilgisi olarak ele almak yerine Ollama sağlayıcı kancası üzerinden çözümler. Bellek araması ayrıca gömmelerin eşleşen Ollama uç noktasını kullanması için `agents.defaults.memorySearch.provider` değerini bu özel sağlayıcı kimliğine ayarlayabilir.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json`, bir sağlayıcı kimliği için kimlik bilgisini saklar. Uç nokta ayarlarını (`baseUrl`, `api`, model kimlikleri, üstbilgiler, zaman aşımları) `models.providers.<id>` içine koyun. `{ "ollama-windows": { "apiKey": "ollama-local" } }` gibi eski düz kimlik doğrulama profili dosyaları çalışma zamanı biçimi değildir; bunları bir yedekle kanonik `ollama-windows:default` API anahtarı profiline yeniden yazmak için `openclaw doctor --fix` çalıştırın. Bu dosyadaki `baseUrl` uyumluluk gürültüsüdür ve sağlayıcı yapılandırmasına taşınmalıdır.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Ollama bellek gömmeleri için kullanıldığında, bearer kimlik doğrulaması bildirildiği ana makineyle sınırlandırılır:

    - Sağlayıcı düzeyindeki anahtar yalnızca o sağlayıcının Ollama ana makinesine gönderilir.
    - `agents.*.memorySearch.remote.apiKey` yalnızca kendi uzak gömme ana makinesine gönderilir.
    - Saf bir `OLLAMA_API_KEY` ortam değeri, Ollama Cloud geleneği olarak ele alınır ve varsayılan olarak yerel veya kendi kendine barındırılan ana makinelere gönderilmez.

  </Accordion>
</AccordionGroup>

## Başlarken

Tercih ettiğiniz kurulum yöntemini ve modu seçin.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **En uygun olduğu durum:** çalışan bir Ollama bulut veya yerel kurulumuna giden en hızlı yol.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Sağlayıcı listesinden **Ollama** seçin.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — yerel Ollama ana makinesi ve bu ana makine üzerinden yönlendirilen bulut modelleri
        - **Cloud only** — `https://ollama.com` üzerinden barındırılan Ollama modelleri
        - **Local only** — yalnızca yerel modeller

      </Step>
      <Step title="Select a model">
        `Cloud only`, `OLLAMA_API_KEY` ister ve barındırılan bulut varsayılanlarını önerir. `Cloud + Local` ve `Local only`, bir Ollama temel URL'si ister, kullanılabilir modelleri keşfeder ve seçili yerel model henüz kullanılabilir değilse otomatik olarak çeker. Ollama, `gemma4:latest` gibi kurulu bir `:latest` etiketi bildirdiğinde kurulum, hem `gemma4` hem de `gemma4:latest` göstermek veya çıplak takma adı yeniden çekmek yerine bu kurulu modeli bir kez gösterir. `Cloud + Local` ayrıca bu Ollama ana makinesinin bulut erişimi için oturum açıp açmadığını denetler.
      </Step>
      <Step title="Verify the model is available">
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

  <Tab title="Manual setup">
    **En uygun olduğu durum:** bulut veya yerel kurulum üzerinde tam denetim.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: Ollama'yı kurun, `ollama signin` ile oturum açın ve bulut isteklerini bu ana makine üzerinden yönlendirin
        - **Cloud only**: `OLLAMA_API_KEY` ile `https://ollama.com` kullanın
        - **Local only**: Ollama'yı [ollama.com/download](https://ollama.com/download) adresinden kurun

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
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Ya da yapılandırmada varsayılanı ayarlayın:

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
    `Cloud + Local`, hem yerel hem de bulut modelleri için denetim noktası olarak erişilebilir bir Ollama ana makinesi kullanır. Bu, Ollama'nın tercih ettiği hibrit akıştır.

    Kurulum sırasında **Cloud + Local** kullanın. OpenClaw, Ollama temel URL'sini ister, bu ana makinedeki yerel modelleri keşfeder ve ana makinenin `ollama signin` ile bulut erişimi için oturum açıp açmadığını denetler. Ana makinede oturum açılmışsa OpenClaw ayrıca `kimi-k2.5:cloud`, `minimax-m2.7:cloud` ve `glm-5.1:cloud` gibi barındırılan bulut varsayılanlarını önerir.

    Ana makinede henüz oturum açılmamışsa OpenClaw, siz `ollama signin` çalıştırana kadar kurulumu yalnızca yerel tutar.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only`, `https://ollama.com` adresindeki Ollama'nın barındırılan API'sine karşı çalışır.

    Kurulum sırasında **Cloud only** kullanın. OpenClaw `OLLAMA_API_KEY` ister, `baseUrl: "https://ollama.com"` ayarlar ve barındırılan bulut model listesini başlatır. Bu yol yerel bir Ollama sunucusu veya `ollama signin` gerektirmez.

    `openclaw onboard` sırasında gösterilen bulut model listesi `https://ollama.com/api/tags` üzerinden canlı olarak doldurulur ve 500 girişle sınırlandırılır; böylece seçici statik bir başlangıç listesi yerine mevcut barındırılan kataloğu yansıtır. Kurulum sırasında `ollama.com` erişilemezse veya hiç model döndürmezse OpenClaw, onboarding'in yine de tamamlanması için önceki sabit kodlanmış önerilere geri döner.

    Birinci sınıf bulut sağlayıcısını doğrudan da yapılandırabilirsiniz:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    Yalnızca yerel modda OpenClaw, yapılandırılmış Ollama örneğinden modelleri keşfeder. Bu yol yerel veya kendi kendine barındırılan Ollama sunucuları içindir.

    OpenClaw şu anda yerel varsayılan olarak `gemma4` önerir.

  </Tab>
</Tabs>

## Model keşfi (örtük sağlayıcı)

`OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ayarladığınızda ve `models.providers.ollama` ya da `api: "ollama"` değerine sahip başka bir özel uzak sağlayıcı tanımlamadığınızda OpenClaw, `http://127.0.0.1:11434` adresindeki yerel Ollama örneğinden modelleri keşfeder.

| Davranış            | Ayrıntı                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalog sorgusu     | `/api/tags` sorgular                                                                                                                                                 |
| Yetenek algılama    | `contextWindow`, genişletilmiş `num_ctx` Modelfile parametreleri ve vision/tools dahil yetenekleri okumak için en iyi çaba `/api/show` aramalarını kullanır          |
| Görüntü modelleri   | `/api/show` tarafından bildirilen `vision` yeteneğine sahip modeller görüntü destekli (`input: ["text", "image"]`) olarak işaretlenir; böylece OpenClaw görüntüleri isteme otomatik olarak enjekte eder |
| Akıl yürütme algılama | Mevcut olduğunda `thinking` dahil `/api/show` yeteneklerini kullanır; Ollama yetenekleri atladığında model adı sezgisine (`r1`, `reasoning`, `think`) geri döner     |
| Token sınırları     | `maxTokens` değerini OpenClaw tarafından kullanılan varsayılan Ollama maksimum token üst sınırına ayarlar                                                            |
| Maliyetler          | Tüm maliyetleri `0` olarak ayarlar                                                                                                                                   |

Bu, kataloğu yerel Ollama örneğiyle hizalı tutarken elle model girişleri yazma ihtiyacını ortadan kaldırır. Yerel `infer model run` içinde `ollama/<pulled-model>:latest` gibi tam bir başvuru kullanabilirsiniz; OpenClaw bu kurulu modeli, elle yazılmış bir `models.json` girişi gerektirmeden Ollama'nın canlı kataloğundan çözümler.

Oturum açılmış Ollama ana makineleri için bazı `:cloud` modelleri `/api/tags` içinde görünmeden önce `/api/chat` ve `/api/show` üzerinden kullanılabilir olabilir. Tam bir `ollama/<model>:cloud` başvurusunu açıkça seçtiğinizde OpenClaw, bu eksik modeli `/api/show` ile doğrular ve yalnızca Ollama model meta verilerini onaylarsa çalışma zamanı kataloğuna ekler. Yazım hataları otomatik oluşturulmak yerine bilinmeyen model olarak başarısız olur.

```bash
# See what models are available
ollama list
openclaw models list
```

Tam ajan araç yüzeyinden kaçınan dar bir metin üretimi smoke testi için, tam bir Ollama model başvurusuyla yerel `infer model run` kullanın:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Bu yol yine de OpenClaw'ın yapılandırılmış sağlayıcısını, kimlik doğrulamasını ve yerel Ollama taşımasını kullanır; ancak bir sohbet ajanı turu başlatmaz veya MCP/araç bağlamını yüklemez. Bu başarılı olurken normal ajan yanıtları başarısız oluyorsa, bir sonraki adımda modelin ajan istemi/araç kapasitesini sorun giderin.

Aynı yalın yolda dar bir görüntü modeli smoke testi için `infer model run` komutuna bir veya daha fazla görüntü dosyası ekleyin. Bu, istemi ve görüntüyü sohbet araçları, bellek veya önceki oturum bağlamı yüklemeden doğrudan seçili Ollama görüntü modeline gönderir:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file`, yaygın PNG, JPEG ve WebP girdileri dahil `image/*` olarak algılanan dosyaları kabul eder. Görüntü olmayan dosyalar Ollama çağrılmadan önce reddedilir. Konuşma tanıma için bunun yerine `openclaw infer audio transcribe` kullanın.

Bir konuşmayı `/model ollama/<model>` ile değiştirdiğinizde, OpenClaw bunu kesin bir kullanıcı seçimi olarak değerlendirir. Yapılandırılmış Ollama `baseUrl` adresine ulaşılamıyorsa, sonraki yanıt başka bir yapılandırılmış yedek modelden sessizce yanıtlamak yerine sağlayıcı hatasıyla başarısız olur.

Yalıtılmış cron işleri, ajan turunu başlatmadan önce ek bir yerel güvenlik denetimi yapar. Seçilen model yerel, özel ağ ya da `.local` Ollama sağlayıcısına çözümlenirse ve `/api/tags` erişilemezse, OpenClaw bu cron çalıştırmasını hata metninde seçili `ollama/<model>` ile `skipped` olarak kaydeder. Uç nokta ön denetimi 5 dakika önbelleğe alınır, bu nedenle aynı durdurulmuş Ollama daemon'una yönlendirilmiş birden çok cron işinin tamamı başarısız model istekleri başlatmaz.

Yerel metin yolunu, yerel akış yolunu ve embeddings'i yerel Ollama'ya karşı canlı doğrulayın:

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

Bulut smoke testi metin, yerel akış ve web aramasını çalıştırır. Ollama Cloud API anahtarları `/api/embed` için yetki vermeyebileceğinden, `https://ollama.com` için embeddings varsayılan olarak atlanır. Yapılandırılmış bulut anahtarı embed uç noktasını kullanamıyorsa canlı testin açıkça başarısız olmasını istediğinizde `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` ayarlayın.

Yeni bir model eklemek için onu Ollama ile çekmeniz yeterlidir:

```bash
ollama pull mistral
```

Yeni model otomatik olarak keşfedilir ve kullanıma hazır olur.

<Note>
`models.providers.ollama` değerini açıkça ayarlarsanız veya `api: "ollama"` ile `models.providers.ollama-cloud` gibi özel bir uzak sağlayıcı yapılandırırsanız, otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir. `http://127.0.0.2:11434` gibi loopback özel sağlayıcılar yine de yerel olarak değerlendirilir. Aşağıdaki açık yapılandırma bölümüne bakın.
</Note>

## Node yerel çıkarım

Ajanlar kısa bir görevi eşleştirilmiş bir masaüstü veya sunucu düğümünde kurulu bir Ollama modeline devredebilir. İstem ve yanıt mevcut kimlik doğrulamalı Gateway/düğüm bağlantısından geçer; model isteği seçilen düğümde standart loopback Ollama uç noktasına (`http://127.0.0.1:11434`) karşı çalışır.

<Steps>
  <Step title="Start Ollama on the node">
    En az bir sohbet modeli çekin ve Ollama'yı çalışır durumda tutun:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Connect the node host">
    Ollama ile aynı makinede, bir düğüm konağını Gateway'e bağlayın:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Gateway konağında yeni cihazı ve bildirdiği düğüm komutlarını onaylayın, ardından düğümü doğrulayın:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    İlk bağlantı ve Ollama komutlarını ekleyen bir yükseltme ikisi de düğüm komutu onayını tetikleyebilir. Düğüm `ollama.models` ve `ollama.chat` duyurmadan bağlanırsa, `openclaw nodes pending` komutunu tekrar denetleyin.

  </Step>
  <Step title="Ask an agent to use local inference">
    Paketlenmiş Ollama plugin'i `node_inference` aracını sunar. Ajanlar önce `action: "discover"` kullanır, ardından döndürülen bir düğüm ve modelle `action: "run"` kullanır. Tam olarak bir yetenekli düğüm bağlıysa, `run` düğümü atlayabilir.

    Örneğin: "Düğümlerimdeki Ollama modellerini keşfet, ardından bu metni özetlemek için en hızlı yüklü modeli kullan."

  </Step>
</Steps>

Keşif `/api/tags` okur, `/api/show` yeteneklerini denetler ve mevcut olduğunda zaten yüklü modelleri ilk sıraya koymak için `/api/ps` kullanır. Yalnızca yerel sohbet yetenekli modelleri döndürür: Ollama Cloud satırları ve yalnızca embedding modelleri hariç tutulur. Her çalıştırma Ollama'dan model thinking'i devre dışı bırakmasını ister ve araç çağrısı farklı bir `maxTokens` değeri istemedikçe çıktıyı 512 token ile sınırlar. GPT-OSS gibi bazı modeller thinking'i devre dışı bırakmayı desteklemez ve yine de reasoning token'ları kullanabilir.

Ollama'yı ajanlara sunmadan bir düğümde çalışır durumda tutmak için, o düğüm konağının kullandığı yapılandırmada şunu ayarlayın:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Düğüm yukarıdaki kurulumdan ön plandaki `openclaw node run` komutunu kullanıyorsa, o süreci durdurun ve komutu yeniden çalıştırın. Kurulu bir düğüm servisi kullanıyorsa, `openclaw node restart` çalıştırın.

Düğüm `ollama.models` ve `ollama.chat` duyurmayı durdurur; Ollama'nın kendisi ve Gateway'in Ollama sağlayıcısı değişmeden kalır. Yerel çıkarımı yeniden duyurmak için değeri `true` olarak ayarlayın ve düğümü yeniden başlatın. Değişen komut yüzeyi yeniden bağlanmadan sonra `openclaw nodes pending` üzerinden onay gerektirebilir.

Aynı düğüm komutlarını ajan turu olmadan doğrulayabilirsiniz:

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

Node yerel çıkarım, uzak veya bulut `models.providers.ollama.baseUrl` değerini bilerek yeniden kullanmaz. Ollama'yı düğümün standart loopback uç noktasında başlatın. Düğüm komutları macOS, Linux ve Windows düğüm konaklarında varsayılan olarak kullanılabilir ve normal düğüm eşleştirme ile komut politikasına tabi kalır.

## Görü ve görüntü açıklaması

Paketlenmiş Ollama plugin'i, Ollama'yı görüntü yetenekli bir medya anlama sağlayıcısı olarak kaydeder. Bu, OpenClaw'ın açık görüntü açıklama isteklerini ve yapılandırılmış görüntü modeli varsayılanlarını yerel veya barındırılan Ollama görü modelleri üzerinden yönlendirmesini sağlar.

Yerel görü için görüntüleri destekleyen bir model çekin:

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

`--model` tam bir `<provider/model>` başvurusu olmalıdır. Ayarlandığında, `openclaw infer image describe` model yerel görü desteklediği için açıklamayı atlamak yerine önce o modeli dener. Model çağrısı başarısız olursa, OpenClaw yapılandırılmış `agents.defaults.imageModel.fallbacks` üzerinden devam edebilir; dosya veya URL hazırlama hataları yedek denemelerden önce yine de başarısız olur.

OpenClaw'ın görüntü anlama sağlayıcı akışını, yapılandırılmış `agents.defaults.imageModel` değerini ve görüntü açıklaması çıktı şeklini istediğinizde `infer image describe` kullanın. Özel istem ve bir veya daha fazla görüntüyle ham çok kipli model yoklaması istediğinizde `infer model run --file` kullanın.

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

Tam `ollama/<model>` başvurusunu tercih edin. Aynı model `models.providers.ollama.models` altında `input: ["text", "image"]` ile listelenmişse ve başka hiçbir yapılandırılmış görüntü sağlayıcısı bu yalın model kimliğini sunmuyorsa, OpenClaw `qwen2.5vl:7b` gibi yalın bir `imageModel` başvurusunu da `ollama/qwen2.5vl:7b` olarak normalleştirir. Birden fazla yapılandırılmış görüntü sağlayıcısı aynı yalın kimliğe sahipse, sağlayıcı önekini açıkça kullanın.

Yavaş yerel görü modelleri, bulut modellerinden daha uzun bir görüntü anlama zaman aşımına ihtiyaç duyabilir. Ollama kısıtlı donanımda ilan edilen tam görü bağlamını ayırmaya çalıştığında bunlar çökebilir veya durabilir. Yalnızca normal bir görüntü açıklama turuna ihtiyaç duyduğunuzda bir yetenek zaman aşımı ayarlayın ve model girdisinde `num_ctx` değerini sınırlayın:

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

Bu zaman aşımı, gelen görüntü anlamaya ve ajanın bir tur sırasında çağırabileceği açık `image` aracına uygulanır. Sağlayıcı düzeyindeki `models.providers.ollama.timeoutSeconds`, normal model çağrıları için alttaki Ollama HTTP isteği korumasını denetlemeye devam eder.

Açık görüntü aracını yerel Ollama'ya karşı canlı doğrulayın:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` değerini elle tanımlarsanız, görü modellerini görüntü girdi desteğiyle işaretleyin:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw, görüntü yetenekli olarak işaretlenmemiş modeller için görüntü açıklama isteklerini reddeder. Örtük keşifle, `/api/show` bir görü yeteneği bildirdiğinde OpenClaw bunu Ollama'dan okur.

## Yapılandırma

<Tabs>
  <Tab title="Basic (implicit discovery)">
    En basit yalnızca yerel etkinleştirme yolu ortam değişkeni üzerindendir:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` ayarlanmışsa, sağlayıcı girdisinde `apiKey` değerini atlayabilirsiniz; OpenClaw bunu kullanılabilirlik denetimleri için doldurur.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Barındırılan bulut kurulumu istediğinizde, Ollama başka bir konakta/portta çalıştığında, belirli bağlam pencerelerini veya model listelerini zorlamak istediğinizde ya da tamamen elle model tanımları istediğinizde açık yapılandırma kullanın.

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
    Ollama farklı bir konakta veya portta çalışıyorsa (açık yapılandırma otomatik keşfi devre dışı bırakır, bu nedenle modelleri elle tanımlayın):

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
    URL'ye `/v1` eklemeyin. `/v1` yolu OpenAI uyumlu modu kullanır ve bu modda araç çağırma güvenilir değildir. Yol soneki olmadan temel Ollama URL'sini kullanın.
    </Warning>

  </Tab>
</Tabs>

## Yaygın tarifler

Bunları başlangıç noktası olarak kullanın ve model kimliklerini `ollama list` veya `openclaw models list --provider ollama` çıktısındaki tam adlarla değiştirin.

<AccordionGroup>
  <Accordion title="Otomatik keşifli yerel model">
    Ollama, Gateway ile aynı makinede çalıştığında ve OpenClaw'ın kurulu modelleri otomatik olarak keşfetmesini istediğinizde bunu kullanın.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Bu yol yapılandırmayı minimumda tutar. Modelleri elle tanımlamak istemediğiniz sürece `models.providers.ollama` bloğu eklemeyin.

  </Accordion>

  <Accordion title="Elle tanımlı modellerle LAN Ollama konağı">
    LAN konakları için yerel Ollama URL'lerini kullanın. `/v1` eklemeyin.

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

    `contextWindow`, OpenClaw tarafındaki bağlam bütçesidir. `params.num_ctx` istek için Ollama'ya gönderilir. Donanımınız modelin ilan edilen tam bağlamını çalıştıramadığında bunları hizalı tutun.

  </Accordion>

  <Accordion title="Yalnızca Ollama Cloud">
    Yerel daemon çalıştırmadığınızda ve barındırılan Ollama modellerini doğrudan kullanmak istediğinizde bunu kullanın.

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

  <Accordion title="Oturum açılmış daemon üzerinden bulut artı yerel">
    Yerel veya LAN Ollama daemon'ı `ollama signin` ile oturum açmışsa ve hem yerel modelleri hem de `:cloud` modellerini sunması gerekiyorsa bunu kullanın.

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

  <Accordion title="Birden çok Ollama konağı">
    Birden fazla Ollama sunucunuz olduğunda özel sağlayıcı kimlikleri kullanın. Her sağlayıcının kendi konağı, modelleri, kimlik doğrulaması, zaman aşımı ve model referansları olur.

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

    OpenClaw isteği gönderdiğinde etkin sağlayıcı ön eki kaldırılır, böylece `ollama-large/qwen3.5:27b` Ollama'ya `qwen3.5:27b` olarak ulaşır.

  </Accordion>

  <Accordion title="Yalın yerel model profili">
    Bazı yerel modeller basit istemleri yanıtlayabilir, ancak tam agent araç yüzeyinde zorlanabilir. Genel runtime ayarlarını değiştirmeden önce araçları ve bağlamı sınırlayarak başlayın.

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

    `compat.supportsTools: false` yalnızca model veya sunucu araç şemalarında güvenilir biçimde başarısız olduğunda kullanın. Bu, kararlılık karşılığında agent yeteneğinden ödün verir.
    `localModelLean`, doğrudan agent yüzeyinden tarayıcı, Cron ve mesaj araçlarını kaldırır ve bir çalıştırmanın doğrudan mesaj teslim semantiğini koruması gerekmediği durumlar dışında daha büyük katalogları varsayılan olarak yapılandırılmış Tool Search denetimlerinin arkasına alır; ancak Ollama'nın runtime bağlamını veya düşünme modunu değiştirmez. Döngüye giren ya da yanıt bütçesini gizli akıl yürütmeye harcayan küçük Qwen tarzı düşünme modelleri için bunu açık `params.num_ctx` ve `params.thinking: false` ile eşleştirin.

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

Özel Ollama sağlayıcı kimlikleri de desteklenir. Bir model referansı `ollama-spark/qwen3:32b` gibi etkin
sağlayıcı ön ekini kullandığında, OpenClaw Ollama'yı çağırmadan önce yalnızca bu
ön eki kaldırır; böylece sunucu `qwen3:32b` alır.

Yavaş yerel modeller için, tüm agent runtime zaman aşımını artırmadan önce
sağlayıcı kapsamlı istek ayarlamasını tercih edin:

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

Uzak konaklar için `127.0.0.1` değerini `baseUrl` içinde kullanılan konakla değiştirin. `curl` çalışıyor ama OpenClaw çalışmıyorsa Gateway'in farklı bir makinede, container'da veya hizmet hesabında çalışıp çalışmadığını kontrol edin.

## Ollama Web Search

OpenClaw, **Ollama Web Search** özelliğini paketli bir `web_search` sağlayıcısı olarak destekler.

| Özellik     | Ayrıntı                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Konak       | Yapılandırılmış Ollama konağınızı kullanır (`models.providers.ollama.baseUrl` ayarlanmışsa o, aksi halde `http://127.0.0.1:11434`); `https://ollama.com` barındırılan API'yi doğrudan kullanır |
| Kimlik doğrulama | Oturum açılmış yerel Ollama konakları için anahtarsız; doğrudan `https://ollama.com` araması veya kimlik doğrulama korumalı konaklar için `OLLAMA_API_KEY` ya da yapılandırılmış sağlayıcı kimlik doğrulaması |
| Gereksinim  | Yerel/kendi barındırdığınız konaklar çalışıyor ve `ollama signin` ile oturum açmış olmalıdır; doğrudan barındırılan arama için `baseUrl: "https://ollama.com"` artı gerçek bir Ollama API anahtarı gerekir |

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

Oturum açılmış yerel daemon için OpenClaw, daemon'ın `/api/experimental/web_search` proxy'sini kullanır. `https://ollama.com` için barındırılan `/api/web_search` uç noktasını doğrudan çağırır.

<Note>
Tam kurulum ve davranış ayrıntıları için bkz. [Ollama Web Search](/tr/tools/ollama-search).
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Eski OpenAI uyumlu mod">
    <Warning>
    **OpenAI uyumlu modda araç çağırma güvenilir değildir.** Bu modu yalnızca bir proxy için OpenAI biçimine ihtiyacınız varsa ve yerel araç çağırma davranışına bağlı değilseniz kullanın.
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

    Bu mod, akışı ve araç çağırmayı aynı anda desteklemeyebilir. Model yapılandırmasında `params: { streaming: false }` ile akışı devre dışı bırakmanız gerekebilir.

    Ollama ile `api: "openai-completions"` kullanıldığında OpenClaw varsayılan olarak `options.num_ctx` enjekte eder; böylece Ollama sessizce 4096 bağlam penceresine geri dönmez. Proxy'niz/yukarı akışınız bilinmeyen `options` alanlarını reddediyorsa bu davranışı devre dışı bırakın:

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
    Otomatik keşfedilen modeller için OpenClaw, özel Modelfile'lardan gelen daha büyük `PARAMETER num_ctx` değerleri dahil olmak üzere, mevcut olduğunda Ollama tarafından bildirilen bağlam penceresini kullanır. Aksi halde OpenClaw tarafından kullanılan varsayılan Ollama bağlam penceresine geri döner.

    Bu Ollama sağlayıcısı altındaki her model için sağlayıcı düzeyinde `contextWindow`, `contextTokens` ve `maxTokens` varsayılanları ayarlayabilir, sonra gerektiğinde bunları model başına geçersiz kılabilirsiniz. `contextWindow`, OpenClaw'ın istem ve compaction bütçesidir. Yerel Ollama istekleri, `params.num_ctx` değerini açıkça yapılandırmadığınız sürece `options.num_ctx` değerini ayarlanmamış bırakır; böylece Ollama kendi modelini, `OLLAMA_CONTEXT_LENGTH` değerini veya VRAM tabanlı varsayılanını uygulayabilir. Bir Modelfile'ı yeniden oluşturmadan Ollama'nın istek başına çalışma zamanı bağlamını sınırlamak veya zorlamak için `params.num_ctx` değerini ayarlayın; geçersiz, sıfır, negatif ve sonlu olmayan değerler yok sayılır. Yerel Ollama istek bağlamını zorlamak için yalnızca `contextWindow` veya `maxTokens` kullanan eski bir yapılandırmadan yükselttiyseniz, bu açık sağlayıcı veya model bütçelerini `params.num_ctx` içine kopyalamak için `openclaw doctor --fix` çalıştırın. OpenAI uyumlu Ollama bağdaştırıcısı, yapılandırılmış `params.num_ctx` veya `contextWindow` değerinden varsayılan olarak hâlâ `options.num_ctx` enjekte eder; üst sisteminiz `options` değerini reddediyorsa bunu `injectNumCtxForOpenAICompat: false` ile devre dışı bırakın.

    Yerel Ollama model girdileri ayrıca `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` ve `use_mmap` dahil olmak üzere `params` altında yaygın Ollama çalışma zamanı seçeneklerini kabul eder. OpenClaw yalnızca Ollama istek anahtarlarını iletir, bu yüzden `streaming` gibi OpenClaw çalışma zamanı parametreleri Ollama'ya sızdırılmaz. Üst düzey Ollama `think` göndermek için `params.think` veya `params.thinking` kullanın; `false`, Qwen tarzı düşünen modeller için API düzeyinde düşünmeyi devre dışı bırakır.

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

    Model başına `agents.defaults.models["ollama/<model>"].params.num_ctx` da çalışır. İkisi de yapılandırılmışsa, açık sağlayıcı model girdisi ajan varsayılanına üstün gelir.

  </Accordion>

  <Accordion title="Düşünme denetimi">
    Yerel Ollama modelleri için OpenClaw düşünme denetimini Ollama'nın beklediği şekilde iletir: `options.think` değil, üst düzey `think`. `/api/show` yanıtı `thinking` yeteneğini içeren otomatik keşfedilmiş modeller `/think low`, `/think medium`, `/think high` ve `/think max` sunar; düşünmeyen modeller yalnızca `/think off` sunar.

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

    Model başına `params.think` veya `params.thinking`, belirli bir yapılandırılmış model için Ollama API düşünmesini devre dışı bırakabilir veya zorlayabilir. OpenClaw, etkin çalıştırmada yalnızca örtük varsayılan `off` olduğunda bu açık model parametrelerini korur; `/think medium` gibi off dışı çalışma zamanı komutları etkin çalıştırmayı yine geçersiz kılar.

  </Accordion>

  <Accordion title="Akıl yürütme modelleri">
    OpenClaw, `deepseek-r1`, `reasoning` veya `think` gibi adlara sahip modelleri varsayılan olarak akıl yürütme yetenekli kabul eder.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Ek yapılandırma gerekmez. OpenClaw bunları otomatik olarak işaretler.

  </Accordion>

  <Accordion title="Model maliyetleri">
    Ollama ücretsizdir ve yerel olarak çalışır, bu yüzden tüm model maliyetleri $0 olarak ayarlanır. Bu, hem otomatik keşfedilen hem de elle tanımlanan modeller için geçerlidir.
  </Accordion>

  <Accordion title="Bellek embedding'leri">
    Birlikte gelen Ollama Plugin'i, [bellek araması](/tr/concepts/memory) için bir bellek embedding sağlayıcısı kaydeder. Yapılandırılmış Ollama temel URL'sini ve API anahtarını kullanır, Ollama'nın mevcut `/api/embed` uç noktasını çağırır ve mümkün olduğunda birden fazla bellek parçasını tek bir `input` isteği halinde toplu işler.

    `proxy.enabled=true` olduğunda, yapılandırılmış `baseUrl` değerinden türetilen tam host-local loopback kökenine giden Ollama bellek embedding istekleri, yönetilen iletme proxy'si yerine OpenClaw'ın korumalı doğrudan yolunu kullanır. Yapılandırılmış ana makine adının kendisi `localhost` veya bir loopback IP sabiti olmalıdır; yalnızca loopback'e çözümlenen DNS adları yine yönetilen proxy yolunu kullanır. LAN, tailnet, özel ağ ve genel Ollama ana makineleri de yönetilen proxy yolunda kalır. Başka bir ana makineye veya porta yönlendirmeler güveni devralmaz. Operatörler, loopback trafiğini proxy üzerinden göndermek için genel `proxy.loopbackMode: "proxy"` ayarını veya bağlantı açmadan önce loopback bağlantılarını reddetmek için `proxy.loopbackMode: "block"` ayarını yine de belirleyebilir; bu ayarın süreç genelindeki etkisi için [Yönetilen proxy](/tr/security/network-proxy#gateway-loopback-mode) bölümüne bakın.

    | Özellik      | Değer               |
    | ------------- | ------------------- |
    | Varsayılan model | `nomic-embed-text`  |
    | Otomatik çekme     | Evet — embedding modeli yerel olarak yoksa otomatik olarak çekilir |

    Sorgu zamanı embedding'leri, `nomic-embed-text`, `qwen3-embedding` ve `mxbai-embed-large` dahil olmak üzere bunları gerektiren veya öneren modeller için alma önekleri kullanır. Mevcut dizinlerin biçim geçişine ihtiyaç duymaması için bellek belgesi toplu işleri ham kalır.

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
    OpenClaw'ın Ollama entegrasyonu varsayılan olarak **yerel Ollama API'sini** (`/api/chat`) kullanır; bu API akışı ve araç çağırmayı aynı anda tam olarak destekler. Özel yapılandırma gerekmez.

    Yerel `/api/chat` istekleri için OpenClaw düşünme denetimini de doğrudan Ollama'ya iletir: açık bir model `params.think`/`params.thinking` değeri yapılandırılmadığı sürece `/think off` ve `openclaw agent --thinking off` üst düzey `think: false` gönderir; `/think low|medium|high` ise eşleşen üst düzey `think` efor dizesini gönderir. `/think max`, Ollama'nın en yüksek yerel eforu olan `think: "high"` değerine eşlenir.

    <Tip>
    OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa yukarıdaki "Eski OpenAI uyumlu mod" bölümüne bakın. Bu modda akış ve araç çağırma aynı anda çalışmayabilir.
    </Tip>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="WSL2 çökme döngüsü (tekrarlanan yeniden başlatmalar)">
    NVIDIA/CUDA ile WSL2 üzerinde resmi Ollama Linux yükleyicisi, `Restart=always` içeren bir `ollama.service` systemd birimi oluşturur. Bu hizmet otomatik başlar ve WSL2 açılışı sırasında GPU destekli bir model yüklerse, model yüklenirken Ollama ana makine belleğini sabitleyebilir. Hyper-V bellek geri kazanımı bu sabitlenmiş sayfaları her zaman geri alamaz; bu nedenle Windows WSL2 VM'yi sonlandırabilir, systemd Ollama'yı yeniden başlatır ve döngü tekrarlanır.

    Yaygın kanıtlar:

    - Windows tarafında tekrarlanan WSL2 yeniden başlatmaları veya sonlandırmaları
    - WSL2 başlangıcından kısa süre sonra `app.slice` veya `ollama.service` içinde yüksek CPU
    - Linux OOM-killer olayı yerine systemd kaynaklı SIGTERM

    OpenClaw, WSL2, `Restart=always` ile etkinleştirilmiş `ollama.service` ve görünür CUDA işaretçileri algıladığında başlangıçta bir uyarı günlüğe yazar.

    Azaltma:

    ```bash
    sudo systemctl disable ollama
    ```

    Bunu Windows tarafında `%USERPROFILE%\.wslconfig` dosyasına ekleyin, sonra `wsl --shutdown` çalıştırın:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama hizmet ortamında daha kısa bir keep-alive ayarlayın veya Ollama'yı yalnızca ihtiyacınız olduğunda elle başlatın:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Bkz. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama algılanmıyor">
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
    Modeliniz listelenmiyorsa modeli yerel olarak çekin veya `models.providers.ollama` içinde açıkça tanımlayın.

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

  <Accordion title="Uzak ana makine curl ile çalışıyor ama OpenClaw ile çalışmıyor">
    Gateway'i çalıştıran aynı makine ve çalışma zamanından doğrulayın:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Yaygın nedenler:

    - `baseUrl`, `localhost` değerini gösteriyor, ancak Gateway Docker içinde veya başka bir ana makinede çalışıyor.
    - URL `/v1` kullanıyor; bu, yerel Ollama yerine OpenAI uyumlu davranışı seçer.
    - Uzak ana makinede Ollama tarafında güvenlik duvarı veya LAN bağlama değişiklikleri gerekiyor.
    - Model dizüstü bilgisayarınızdaki daemon'da mevcut, ancak uzak daemon'da yok.

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
    Uzun, dilsel olmayan sembol dizilerinden oluşan barındırılan Kimi/GLM yanıtları, başarılı bir asistan yanıtı yerine başarısız sağlayıcı çıktısı olarak ele alınır. Bu, bozuk metni oturuma kalıcı olarak yazmadan normal yeniden deneme, fallback veya hata işlemenin devreye girmesini sağlar.

    Bu tekrar tekrar olursa ham model adını, geçerli oturum dosyasını ve çalıştırmanın `Cloud + Local` mı yoksa `Cloud only` mi kullandığını yakalayın; ardından yeni bir oturum ve bir fallback modeli deneyin:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Soğuk yerel model zaman aşımına uğruyor">
    Büyük yerel modeller, akış başlamadan önce uzun bir ilk yükleme gerektirebilir. Zaman aşımını Ollama sağlayıcısıyla sınırlı tutun ve isteğe bağlı olarak Ollama'dan modeli dönüşler arasında yüklü tutmasını isteyin:

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
    Birçok Ollama modeli, donanımınızın rahatça çalıştırabileceğinden daha büyük bağlamlar duyurur. Yerel Ollama, `params.num_ctx` ayarlamadığınız sürece Ollama'nın kendi çalışma zamanı bağlamı varsayılanını kullanır. Öngörülebilir ilk token gecikmesi istediğinizde hem OpenClaw bütçesini hem de Ollama'nın istek bağlamını sınırlayın:

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

    OpenClaw çok fazla istem gönderiyorsa önce `contextWindow` değerini düşürün. Ollama makine için çok büyük bir çalışma zamanı bağlamı yüklüyorsa `params.num_ctx` değerini düşürün. Üretim çok uzun sürüyorsa `maxTokens` değerini düşürün.

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılar, model referansları ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="Ollama Web Araması" href="/tr/tools/ollama-search" icon="magnifying-glass">
    Ollama destekli web araması için tam kurulum ve davranış ayrıntıları.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma referansı.
  </Card>
</CardGroup>
