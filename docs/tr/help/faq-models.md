---
read_when:
    - Modelleri seçme veya değiştirme, takma adları yapılandırma
    - Model yük devretme hata ayıklaması / "Tüm modeller başarısız oldu"
    - Kimlik doğrulama profillerini anlama ve yönetme
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçimi, takma adları, geçiş, yük devretme ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-05-11T20:31:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1bd3bcfdca583472d42782448271879a2bcaaa21858ab3304da48556ae922c
    source_path: help/faq-models.md
    workflow: 16
---

  Model ve kimlik doğrulama profili Soru-Cevap. Kurulum, oturumlar, Gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, değiştirme

  <AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw’ın varsayılan modeli, şurada ayarladığınız değerdir:

    ```
    agents.defaults.model.primary
    ```

    Modellere `provider/model` olarak başvurulur (örnek: `openai/gpt-5.5` veya `anthropic/claude-sonnet-4-6`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, ardından tam olarak o model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra kullanımdan kaldırılmış bir uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eskimiş ve kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda bulunan en güçlü son nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdi alan ajanlar için:** maliyetten çok model gücüne öncelik verin.
    **Rutin/düşük riskli sohbet için:** daha ucuz yedek modeller kullanın ve ajan rolüne göre yönlendirin.

    MiniMax’ın kendi belgeleri vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Genel kural: yüksek riskli işler için **karşılayabildiğiniz en iyi modeli**, rutin sohbetler veya özetler için daha ucuz
    bir modeli kullanın. Modelleri ajan başına yönlendirebilir ve uzun görevleri
    paralelleştirmek için alt ajanları kullanabilirsiniz (her alt ajan token tüketir). [Modeller](/tr/concepts/models) ve
    [Alt ajanlar](/tr/tools/subagents) sayfalarına bakın.

    Güçlü uyarı: daha zayıf/aşırı kuantize modeller, prompt
    injection ve güvenli olmayan davranışlara karşı daha savunmasızdır. [Güvenlik](/tr/gateway/security) sayfasına bakın.

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değişimlerinden kaçının.

    Güvenli seçenekler:

    - Sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` değerini düzenleme

    Tüm yapılandırmayı değiştirmeyi amaçlamıyorsanız kısmi bir nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve tercihen `config.patch` kullanın. Lookup yükü size normalleştirilmiş yolu, sığ şema belgelerini/kısıtlarını ve doğrudan alt özetleri verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` komutunu yeniden çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Yapılandır](/tr/cli/configure), [Yapılandırma](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri kullanabilir miyim (llama.cpp, vLLM, Ollama)?">
    Evet. Ollama, yerel modeller için en kolay yoldur.

    En hızlı kurulum:

    1. Ollama’yı `https://ollama.com/download` adresinden kurun
    2. `ollama pull gemma4` gibi yerel bir model çekin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local` size bulut modellerini ve yerel Ollama modellerinizi verir
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel çekme gerektirmez
    - elle değiştirmek için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun şekilde kuantize edilmiş modeller prompt
    injection’a karşı daha savunmasızdır. Araç kullanabilen her bot için **büyük modelleri** önemle öneririz.
    Küçük modelleri yine de kullanmak istiyorsanız sandboxing ve katı araç izin listelerini etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zamanla değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her Gateway’de geçerli çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenlik açısından hassas/araç etkin ajanlar için mevcut en güçlü son nesil modeli kullanın.

  </Accordion>

  <Accordion title="Modelleri anında nasıl değiştiririm (yeniden başlatmadan)?">
    `/model` komutunu bağımsız bir mesaj olarak kullanın:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Bunlar yerleşik takma adlardır. Özel takma adlar `agents.defaults.models` üzerinden eklenebilir.

    Kullanılabilir modelleri `/model`, `/model list` veya `/model status` ile listeleyebilirsiniz.

    `/model` (ve `/model list`) kompakt, numaralı bir seçici gösterir. Numarayla seçin:

    ```
    /model 3
    ```

    Sağlayıcı için belirli bir kimlik doğrulama profilini de zorlayabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status` hangi ajanın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sırada hangi kimlik doğrulama profilinin deneneceğini gösterir.
    Ayrıca mevcut olduğunda yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) gösterir.

    **@profile ile ayarladığım bir profil sabitlemesini nasıl kaldırırım?**

    `/model` komutunu `@profile` soneki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi kimlik doğrulama profilinin etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="İki sağlayıcı aynı model kimliğini sunuyorsa /model hangisini kullanır?">
    `/model provider/model`, oturum için tam olarak o sağlayıcı rotasını seçer.

    Örneğin `qianfan/deepseek-v4-flash` ve `deepseek/deepseek-v4-flash`, ikisi de `deepseek-v4-flash` içerse bile farklı model referanslarıdır. OpenClaw, çıplak model kimliği eşleşti diye bir sağlayıcıdan diğerine sessizce geçmemelidir.

    Kullanıcının seçtiği `/model` referansı, yedekleme ilkesi için de katıdır. Seçilen sağlayıcı/model kullanılamıyorsa yanıt, `agents.defaults.model.fallbacks` üzerinden cevap vermek yerine görünür şekilde başarısız olur. Yapılandırılmış yedek zincirleri yapılandırılmış varsayılanlar, Cron işlerinin birincil modelleri ve otomatik seçilen yedek durum için uygulanmaya devam eder.

    Oturum dışı bir geçersiz kılmadan başlayan bir çalışmanın yedek kullanmasına izin veriliyorsa OpenClaw önce istenen sağlayıcı/modeli, ardından yapılandırılmış yedekleri ve ancak bundan sonra yapılandırılmış birincil modeli dener. Bu, yinelenen çıplak model kimliklerinin doğrudan varsayılan sağlayıcıya geri atlamasını engeller.

    [Modeller](/tr/concepts/models) ve [Model failover](/tr/concepts/model-failover) sayfalarına bakın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.5 ve kodlama için Codex 5.5 kullanabilir miyim?">
    Evet. Model seçimini ve çalışma zamanı seçimini ayrı düşünün:

    - **Yerel Codex kodlama ajanı:** `agents.defaults.model.primary` değerini `openai/gpt-5.5` olarak ayarlayın. ChatGPT/Codex abonelik kimlik doğrulamasını istediğinizde `openclaw models auth login --provider openai-codex` ile oturum açın.
    - **Ajan döngüsü dışındaki doğrudan OpenAI API görevleri:** görüntüler, embeddings, konuşma, realtime ve diğer ajan dışı OpenAI API yüzeyleri için `OPENAI_API_KEY` yapılandırın.
    - **OpenAI ajan API anahtarı kimlik doğrulaması:** sıralı bir `openai-codex` API anahtarı profiliyle `/model openai/gpt-5.5` kullanın.
    - **Alt ajanlar:** kodlama görevlerini kendi `openai/gpt-5.5` modeline sahip Codex odaklı bir ajana yönlendirin.

    [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands) sayfalarına bakın.

  </Accordion>

  <Accordion title="GPT 5.5 için hızlı modu nasıl yapılandırırım?">
    Bir oturum anahtarı veya yapılandırma varsayılanı kullanın:

    - **Oturum başına:** oturum `openai/gpt-5.5` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` değerini `true` olarak ayarlayın.

    Örnek:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI için hızlı mod, desteklenen yerel Responses isteklerinde `service_tier = "priority"` değerine eşlenir. Oturum `/fast` geçersiz kılmaları yapılandırma varsayılanlarından üstündür.

    [Düşünme ve hızlı mod](/tr/tools/thinking) ve [OpenAI hızlı modu](/tr/providers/openai#fast-mode) sayfalarına bakın.

  </Accordion>

  <Accordion title='Neden “Model ... is not allowed” görüyorum ve ardından yanıt gelmiyor?'>
    `agents.defaults.models` ayarlanırsa `/model` ve tüm
    oturum geçersiz kılmaları için **izin listesi** haline gelir. Bu listede olmayan bir model seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Bu hata, normal bir yanıt **yerine** döndürülür. Düzeltme: tam modeli
    `agents.defaults.models` içine ekleyin, dinamik sağlayıcı katalogları için `"provider/*": {}` gibi bir sağlayıcı jokeri ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.
    Komut ayrıca `--runtime codex` içeriyorsa önce izin listesini güncelleyin, ardından
    aynı `/model provider/model --runtime codex` komutunu yeniden deneyin.

  </Accordion>

  <Accordion title='Neden “Unknown model: minimax/MiniMax-M2.7” görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya kimlik doğrulama
    profili bulunamadı), bu yüzden model çözümlenemez.

    Düzeltme kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` dalından çalıştırın), ardından Gateway’i yeniden başlatın.
    2. MiniMax’ın yapılandırıldığından (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için MiniMax kimlik doğrulamasının
       env/kimlik doğrulama profillerinde bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya saklanan MiniMax
       OAuth).
    3. Kimlik doğrulama yolunuz için tam model kimliğini (büyük/küçük harfe duyarlı) kullanın:
       API anahtarı kurulumu için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       OAuth kurulumu için ise `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list`).

    [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models) sayfalarına bakın.

  </Accordion>

  <Accordion title="Varsayılanım olarak MiniMax’ı, karmaşık görevler için OpenAI’ı kullanabilir miyim?">
    Evet. **Varsayılan olarak MiniMax’ı** kullanın ve gerektiğinde modelleri **oturum başına** değiştirin.
    Yedekler “zor görevler” için değil, **hatalar** içindir; bu yüzden `/model` veya ayrı bir ajan kullanın.

    **Seçenek A: oturum başına değiştirin**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Ardından:

    ```
    /model gpt
    ```

    **Seçenek B: ayrı ajanlar**

    - Ajan A varsayılanı: MiniMax
    - Ajan B varsayılanı: OpenAI
    - Ajana göre yönlendirin veya geçiş yapmak için `/agent` kullanın

    Belgeler: [Modeller](/tr/concepts/models), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısaltmayla gelir (yalnızca model `agents.defaults.models` içinde mevcut olduğunda uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı adla kendi takma adınızı ayarlarsanız, sizin değeriniz geçerli olur.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adları) nasıl tanımlar/geçersiz kılarım?">
    Takma adlar `agents.defaults.models.<modelId>.alias` içinden gelir. Örnek:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Ardından `/model sonnet` (veya desteklendiğinde `/<alias>`) bu model kimliğine çözümlenir.

  </Accordion>

  <Accordion title="OpenRouter veya Z.AI gibi diğer sağlayıcılardan modelleri nasıl eklerim?">
    OpenRouter (token başına ödeme; birçok model):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM modelleri):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Bir sağlayıcıya/modele başvurur ancak gerekli sağlayıcı anahtarı eksikse çalışma zamanında kimlik doğrulama hatası alırsınız (ör. `No API key found for provider "zai"`).

    **Yeni bir ajan ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni ajanın** boş bir kimlik doğrulama deposu olduğu anlamına gelir. Kimlik doğrulama ajan bazındadır ve
    şurada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` komutunu çalıştırın ve sihirbaz sırasında kimlik doğrulamayı yapılandırın.
    - Ya da yalnızca taşınabilir statik `api_key` / `token` profillerini ana ajanın kimlik doğrulama deposundan yeni ajanın kimlik doğrulama deposuna kopyalayın.
    - OAuth profilleri için, kendi hesabına ihtiyaç duyduğunda yeni ajandan oturum açın; aksi halde OpenClaw yenileme tokenlarını klonlamadan varsayılan/ana ajan üzerinden okuyabilir.

    `agentDir` öğesini ajanlar arasında **yeniden kullanmayın**; kimlik doğrulama/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model devretme ve "All models failed"

<AccordionGroup>
  <Accordion title="Devretme nasıl çalışır?">
    Devretme iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model geri dönüşü**.

    Başarısız profillere bekleme süreleri uygulanır (üssel geri çekilme), böylece OpenClaw bir sağlayıcı hız sınırına takıldığında veya geçici olarak başarısız olduğunda bile yanıt vermeyi sürdürebilir.

    Hız sınırı kovası düz `429` yanıtlarından fazlasını içerir. OpenClaw
    ayrıca `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` gibi iletileri ve dönemsel
    kullanım penceresi sınırlarını (`weekly/monthly limit reached`) devretmeye uygun
    hız sınırları olarak ele alır.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı
    `401` veya `403` üzerinde açık faturalandırma metni döndürürse, OpenClaw bunu yine de
    faturalandırma hattında tutabilir, ancak sağlayıcıya özgü metin eşleştiriciler
    onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Bir `402`
    iletisi bunun yerine yeniden denenebilir bir kullanım penceresi veya
    kuruluş/çalışma alanı harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli faturalandırma devre dışı bırakması olarak değil,
    `rate_limit` olarak ele alır.

    Bağlam taşması hataları farklıdır: `request_too_large`,
    `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar, model
    geri dönüşünü ilerletmek yerine compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni, kasıtlı olarak "içinde unknown/error geçen
    her şey"den daha dardır. OpenClaw, sağlayıcı bağlamı
    eşleştiğinde Anthropic düz `An unknown error occurred`, OpenRouter düz
    `Provider returned error`, `Unhandled stop reason:
    error` gibi durdurma nedeni hataları, geçici sunucu metni içeren JSON `api_error` yükleri
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hataları dahil
    sağlayıcı kapsamlı geçici biçimleri
    devretmeye uygun zaman aşımı/aşırı yük sinyalleri olarak ele alır.
    `LLM request failed with an unknown
    error.` gibi genel iç geri dönüş metinleri temkinli kalır ve tek başına model geri dönüşünü tetiklemez.

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default" ne anlama gelir?'>
    Bu, sistemin `anthropic:default` kimlik doğrulama profili kimliğini kullanmaya çalıştığı, ancak beklenen kimlik doğrulama deposunda bunun için kimlik bilgilerini bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Kimlik doğrulama profillerinin nerede bulunduğunu doğrulayın** (yeni ve eski yollar)
      - Geçerli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - Kabuğunuzda `ANTHROPIC_API_KEY` ayarladıysanız ancak Gateway’i systemd/launchd üzerinden çalıştırıyorsanız, bunu miras almayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` etkinleştirin.
    - **Doğru ajanı düzenlediğinizden emin olun**
      - Çok ajanlı kurulumlarda birden fazla `auth-profiles.json` dosyası olabilir.
    - **Model/kimlik doğrulama durumunu temel kontrolden geçirin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimliğinin doğrulanıp doğrulanmadığını görmek için `openclaw models status` kullanın.

    **"No credentials found for profile anthropic" için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic kimlik doğrulama profiline sabitlendiği, ancak Gateway’in
    bunu kimlik doğrulama deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **Gateway ana makinesinde** `ANTHROPIC_API_KEY` öğesini `~/.openclaw/.env` içine koyun.
      - Eksik bir profili zorlayan sabitlenmiş sıralamaları temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları Gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak modda kimlik doğrulama profilleri dizüstü bilgisayarınızda değil, Gateway makinesinde bulunur.

  </Accordion>

  <Accordion title="Neden Google Gemini de denendi ve başarısız oldu?">
    Model yapılandırmanız Google Gemini’yi geri dönüş olarak içeriyorsa (veya bir Gemini kısaltmasına geçtiyseniz), OpenClaw model geri dönüşü sırasında bunu deneyecektir. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: Google kimlik doğrulaması sağlayın ya da geri dönüşün oraya yönlenmemesi için Google modellerini `agents.defaults.model.fallbacks` / takma adlardan kaldırın veya bunlardan kaçının.

    **LLM isteği reddedildi: düşünme imzası gerekli (Google Antigravity)**

    Neden: oturum geçmişi **imzasız düşünme blokları** içeriyor (genellikle
    durdurulmuş/kısmi bir akıştan). Google Antigravity, düşünme blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız düşünme bloklarını çıkarır. Hala görünüyorsa **yeni bir oturum** başlatın veya bu ajan için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: ne oldukları ve nasıl yönetilecekleri

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token saklama, çok hesaplı kalıplar)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Kimlik doğrulama profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada bulunur:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Kaydedilmiş profilleri sırları dökmeden incelemek için `openclaw models auth list` çalıştırın (isteğe bağlı olarak `--provider <id>` veya `--json`). Ayrıntılar için [Models CLI](/tr/cli/models#auth-profiles) bölümüne bakın.

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw şu tür sağlayıcı ön ekli kimlikler kullanır:

    - `anthropic:default` (e-posta kimliği olmadığında yaygındır)
    - OAuth kimlikleri için `anthropic:<email>`
    - seçtiğiniz özel kimlikler (ör. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi kimlik doğrulama profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı meta verileri ve sağlayıcı başına sıralamayı (`auth.order.<provider>`) destekler. Bu, sırları **saklamaz**; kimlikleri sağlayıcı/mod ile eşler ve rotasyon sırasını ayarlar.

    OpenClaw, kısa bir **bekleme süresinde** (hız sınırları/zaman aşımları/kimlik doğrulama hataları) veya daha uzun bir **devre dışı** durumdaysa (faturalandırma/yetersiz kredi) bir profili geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` öğesini kontrol edin. Ayarlama: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı bekleme süreleri model kapsamlı olabilir. Bir model için beklemede olan
    bir profil, aynı sağlayıcıdaki kardeş model için hâlâ kullanılabilir olabilir;
    faturalandırma/devre dışı pencereleri ise tüm profili engellemeyi sürdürür.

    CLI üzerinden **ajan başına** sıralama geçersiz kılması da ayarlayabilirsiniz (o ajanın `auth-state.json` dosyasında saklanır):

    ```bash
    # Yapılandırılmış varsayılan ajanı kullanır (--agent atlanır)
    openclaw models auth order get --provider anthropic

    # Rotasyonu tek bir profile kilitleyin (yalnızca bunu deneyin)
    openclaw models auth order set --provider anthropic anthropic:default

    # Veya açık bir sıra ayarlayın (sağlayıcı içinde geri dönüş)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Geçersiz kılmayı temizleyin (config auth.order / round-robin'e geri dön)
    openclaw models auth order clear --provider anthropic
    ```

    Belirli bir ajanı hedeflemek için:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gerçekte neyin deneneceğini doğrulamak için şunu kullanın:

    ```bash
    openclaw models status --probe
    ```

    Saklanan bir profil açık sıradan çıkarılmışsa, probe bunu sessizce denemek yerine
    o profil için `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth** genellikle abonelik erişiminden yararlanır (uygulanabildiği durumlarda).
    - **API anahtarları** token başına ödeme faturalandırmasını kullanır.

    Sihirbaz Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model devretme](/tr/concepts/model-failover)
