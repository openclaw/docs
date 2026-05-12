---
read_when:
    - Modelleri seçme veya değiştirme, takma adları yapılandırma
    - Model yük devretmede hata ayıklama / "Tüm modeller başarısız oldu"
    - Kimlik doğrulama profillerini ve bunların nasıl yönetileceğini anlama
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçimi, takma adlar, geçiş, yük devretme ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-05-12T04:10:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a42a8c24798908c7782a9f0c6f0af3fac0c1ad4e5f80d64778f6fd7e1e174f3b
    source_path: help/faq-models.md
    workflow: 16
---

  Model ve kimlik doğrulama profili SSS. Kurulum, oturumlar, gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, geçiş

  <AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw’ın varsayılan modeli, şurada ayarladığınız modeldir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` olarak başvurulur (örnek: `openai/gpt-5.5` veya `anthropic/claude-sonnet-4-6`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra aynı model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra kullanımdan kaldırılmış bir uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski ve kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda kullanılabilen en güçlü en yeni nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdi alan ajanlar için:** maliyet yerine model gücünü önceliklendirin.
    **Rutin/düşük riskli sohbet için:** daha ucuz yedek modeller kullanın ve ajan rolüne göre yönlendirin.

    MiniMax’in kendi belgeleri vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Pratik kural: yüksek riskli işler için **karşılayabildiğiniz en iyi modeli**, rutin sohbet veya özetler için daha ucuz
    bir modeli kullanın. Modelleri ajan başına yönlendirebilir ve uzun görevleri
    paralelleştirmek için alt ajanlar kullanabilirsiniz (her alt ajan token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Alt ajanlar](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı kuantize modeller prompt
    injection ve güvensiz davranışlara karşı daha savunmasızdır. Bkz. [Güvenlik](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değiştirmelerinden kaçının.

    Güvenli seçenekler:

    - Sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` değerini düzenleyin

    Tüm yapılandırmayı değiştirmek istemiyorsanız kısmi bir nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Lookup yükü size normalleştirilmiş yolu, sığ şema belgelerini/kısıtlarını ve anlık alt öğe özetlerini verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` komutunu yeniden çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Yapılandır](/tr/cli/configure), [Yapılandırma](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri kullanabilir miyim (llama.cpp, vLLM, Ollama)?">
    Evet. Yerel modeller için en kolay yol Ollama’dır.

    En hızlı kurulum:

    1. Ollama’yı `https://ollama.com/download` adresinden kurun
    2. `ollama pull gemma4` gibi yerel bir model indirin
    3. Bulut modellerini de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` komutunu çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local`, bulut modellerini ve yerel Ollama modellerinizi sağlar
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel indirme gerektirmez
    - elle geçiş yapmak için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun şekilde kuantize edilmiş modeller prompt
    injection’a karşı daha savunmasızdır. Araç kullanabilen herhangi bir bot için **büyük modelleri** kesinlikle öneririz.
    Yine de küçük modeller istiyorsanız sandboxing ve katı araç izin listelerini etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanır?">
    - Bu dağıtımlar farklılık gösterebilir ve zamanla değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her gateway’de geçerli çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenlik açısından hassas/araç etkin ajanlar için kullanılabilen en güçlü en yeni nesil modeli kullanın.

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

    İpucu: `/model status`, hangi ajanın aktif olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sıradaki hangi kimlik doğrulama profilinin deneneceğini gösterir.
    Ayrıca varsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) gösterir.

    **@profile ile ayarladığım bir profil sabitlemesini nasıl kaldırırım?**

    `/model` komutunu `@profile` soneki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi kimlik doğrulama profilinin aktif olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="İki sağlayıcı aynı model kimliğini sunuyorsa /model hangisini kullanır?">
    `/model provider/model`, oturum için tam olarak bu sağlayıcı rotasını seçer.

    Örneğin, `qianfan/deepseek-v4-flash` ve `deepseek/deepseek-v4-flash`, ikisi de `deepseek-v4-flash` içerse bile farklı model referanslarıdır. OpenClaw, yalnızca çıplak model kimliği eşleşiyor diye sessizce bir sağlayıcıdan diğerine geçmemelidir.

    Kullanıcı tarafından seçilmiş bir `/model` referansı, yedek politikası için de katıdır. Seçilen sağlayıcı/model kullanılamıyorsa yanıt, `agents.defaults.model.fallbacks` içinden cevaplamak yerine görünür biçimde başarısız olur. Yapılandırılmış yedek zincirleri yine de yapılandırılmış varsayılanlara, cron işi birincillerine ve otomatik seçilmiş yedek durumuna uygulanır.

    Oturum dışı bir geçersiz kılmadan başlayan bir çalıştırmanın yedek kullanmasına izin veriliyorsa OpenClaw önce istenen sağlayıcı/modeli, sonra yapılandırılmış yedekleri ve ancak bundan sonra yapılandırılmış birincili dener. Bu, yinelenen çıplak model kimliklerinin doğrudan varsayılan sağlayıcıya geri sıçramasını önler.

    Bkz. [Modeller](/tr/concepts/models) ve [Model failover](/tr/concepts/model-failover).

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.5, kodlama için Codex 5.5 kullanabilir miyim?">
    Evet. Model seçimini ve çalışma zamanı seçimini ayrı ele alın:

    - **Yerel Codex kodlama ajanı:** `agents.defaults.model.primary` değerini `openai/gpt-5.5` olarak ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması kullanmak istediğinizde `openclaw models auth login --provider openai-codex` ile oturum açın.
    - **Ajan döngüsü dışındaki doğrudan OpenAI API görevleri:** görseller, embeddings, konuşma, realtime ve diğer ajan dışı OpenAI API yüzeyleri için `OPENAI_API_KEY` yapılandırın.
    - **OpenAI ajan API anahtarı kimlik doğrulaması:** sıralı bir `openai-codex` API anahtarı profiliyle `/model openai/gpt-5.5` kullanın.
    - **Alt ajanlar:** kodlama görevlerini kendi `openai/gpt-5.5` modeline sahip Codex odaklı bir ajana yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands).

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

    OpenAI için hızlı mod, desteklenen yerel Responses isteklerinde `service_tier = "priority"` ile eşlenir. Oturum `/fast` geçersiz kılmaları yapılandırma varsayılanlarından önceliklidir.

    Bkz. [Düşünme ve hızlı mod](/tr/tools/thinking) ve [OpenAI hızlı modu](/tr/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Neden “Model ... is not allowed” görüyorum ve sonra yanıt gelmiyor?'>
    `agents.defaults.models` ayarlanmışsa `/model` ve tüm
    oturum geçersiz kılmaları için **izin listesi** olur. Bu listede olmayan bir modeli seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Bu hata normal bir yanıtın **yerine** döndürülür. Çözüm: tam modeli
    `agents.defaults.models` içine ekleyin, dinamik sağlayıcı katalogları için `"provider/*": {}` gibi bir sağlayıcı jokeri ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.
    Komut ayrıca `--runtime codex` içeriyorsa önce izin listesini güncelleyin ve ardından
    aynı `/model provider/model --runtime codex` komutunu yeniden deneyin.

  </Accordion>

  <Accordion title='Neden “Unknown model: minimax/MiniMax-M2.7” görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya kimlik doğrulama
    profili bulunamadı), bu yüzden model çözümlenemez.

    Düzeltme kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` dalından çalıştırın), sonra gateway’i yeniden başlatın.
    2. MiniMax’in yapılandırıldığından (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için MiniMax kimlik doğrulamasının
       env/kimlik doğrulama profillerinde bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya saklanan MiniMax
       OAuth).
    3. Kimlik doğrulama yolunuz için tam model kimliğini (büyük/küçük harfe duyarlı) kullanın:
       API anahtarlı kurulum için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       OAuth kurulumu için ise `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list`).

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="MiniMax’i varsayılanım, OpenAI’ı karmaşık görevler için kullanabilir miyim?">
    Evet. **Varsayılan olarak MiniMax** kullanın ve gerektiğinde modelleri **oturum başına** değiştirin.
    Yedekler **hatalar** içindir, “zor görevler” için değil; bu nedenle `/model` veya ayrı bir ajan kullanın.

    **Seçenek A: oturum başına geçiş**

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
    - Ajana göre yönlendirin veya geçiş için `/agent` kullanın

    Belgeler: [Modeller](/tr/concepts/models), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısa adla gelir (yalnızca model `agents.defaults.models` içinde mevcutsa uygulanır):

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
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
    OpenRouter (token başına ödeme; çok sayıda model):

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

    Bir sağlayıcıya/modele başvurursanız ancak gerekli sağlayıcı anahtarı eksikse, çalışma zamanında kimlik doğrulama hatası alırsınız (ör. `No API key found for provider "zai"`).

    **Yeni bir agent ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni agent** boş bir kimlik doğrulama deposuna sahip demektir. Kimlik doğrulama agent başınadır ve şurada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` çalıştırın ve sihirbaz sırasında kimlik doğrulamayı yapılandırın.
    - Ya da yalnızca taşınabilir statik `api_key` / `token` profillerini ana agent'ın kimlik doğrulama deposundan yeni agent'ın kimlik doğrulama deposuna kopyalayın.
    - OAuth profilleri için, kendi hesabına ihtiyaç duyduğunda yeni agent'tan oturum açın; aksi halde OpenClaw yenileme token'larını klonlamadan varsayılan/ana agent üzerinden okuyabilir.

    Agent'lar arasında `agentDir` yeniden kullanmayın; kimlik doğrulama/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model devretmesi ve "Tüm modeller başarısız oldu"

<AccordionGroup>
  <Accordion title="Devretme nasıl çalışır?">
    Devretme iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model geri dönüşü**.

    Başarısız profillere bekleme süreleri uygulanır (üstel geri çekilme), böylece bir sağlayıcı hız sınırına takıldığında veya geçici olarak başarısız olduğunda bile OpenClaw yanıt vermeye devam edebilir.

    Hız sınırı kovası düz `429` yanıtlarından daha fazlasını içerir. OpenClaw
    ayrıca `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` gibi iletileri ve dönemsel
    kullanım penceresi limitlerini (`weekly/monthly limit reached`) devretmeye değer
    hız sınırları olarak ele alır.

    Faturalama gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı `401` veya `403` üzerinde
    açık faturalama metni döndürürse, OpenClaw bunu yine de
    faturalama yolunda tutabilir, ancak sağlayıcıya özgü metin eşleştiriciler
    bunların sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Bir `402`
    iletisi bunun yerine yeniden denenebilir bir kullanım penceresi veya
    kuruluş/çalışma alanı harcama limiti gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli faturalama devre dışı bırakması
    olarak değil, `rate_limit` olarak ele alır.

    Bağlam taşması hataları farklıdır: `request_too_large`,
    `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar, model geri dönüşünü ilerletmek yerine
    Compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni kasıtlı olarak "içinde unknown/error geçen her şey"den
    daha dardır. OpenClaw, sağlayıcı bağlamı eşleştiğinde Anthropic düz
    `An unknown error occurred`, OpenRouter düz
    `Provider returned error`, `Unhandled stop reason:
    error` gibi durdurma nedeni hataları, geçici sunucu metni içeren JSON
    `api_error` yükleri (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hataları gibi
    sağlayıcı kapsamlı geçici biçimleri devretmeye değer zaman aşımı/aşırı yük
    sinyalleri olarak ele alır.
    `LLM request failed with an unknown
    error.` gibi genel dahili geri dönüş metni temkinli kalır ve tek başına model geri dönüşünü tetiklemez.

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default" ne anlama gelir?'>
    Bu, sistemin `anthropic:default` kimlik doğrulama profil kimliğini kullanmaya çalıştığı, ancak beklenen kimlik doğrulama deposunda bunun için kimlik bilgilerini bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Kimlik doğrulama profillerinin nerede bulunduğunu doğrulayın** (yeni ve eski yollar)
      - Güncel: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından geçirilir)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - Kabuğunuzda `ANTHROPIC_API_KEY` ayarladıysanız ancak Gateway'i systemd/launchd üzerinden çalıştırıyorsanız, bunu devralmayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` etkinleştirin.
    - **Doğru agent'ı düzenlediğinizden emin olun**
      - Çok agent'lı kurulumlarda birden fazla `auth-profiles.json` dosyası olabilir.
    - **Model/kimlik doğrulama durumunu hızlıca kontrol edin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimlik doğrulamasının yapılıp yapılmadığını görmek için `openclaw models status` kullanın.

    **"No credentials found for profile anthropic" için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic kimlik doğrulama profiline sabitlendiği, ancak Gateway'in
    bunu kendi kimlik doğrulama deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **Gateway ana makinesinde** `ANTHROPIC_API_KEY` değerini `~/.openclaw/.env` içine koyun.
      - Eksik bir profili zorlayan sabitlenmiş sıralamaları temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları Gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak modda, kimlik doğrulama profilleri dizüstü bilgisayarınızda değil, gateway makinesinde bulunur.

  </Accordion>

  <Accordion title="Neden Google Gemini de denendi ve başarısız oldu?">
    Model yapılandırmanız Google Gemini'yi geri dönüş olarak içeriyorsa (veya bir Gemini kısaltmasına geçtiyseniz), OpenClaw model geri dönüşü sırasında bunu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: Google kimlik doğrulaması sağlayın veya geri dönüşün oraya yönlenmemesi için `agents.defaults.model.fallbacks` / takma adlar içinde Google modellerini kaldırın/kaçının.

    **LLM isteği reddedildi: düşünme imzası gerekli (Google Antigravity)**

    Neden: oturum geçmişi **imzasız düşünme blokları** içeriyor (sıkça
    iptal edilmiş/kısmi bir akıştan). Google Antigravity düşünme blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız düşünme bloklarını kaldırır. Hâlâ görünüyorsa, **yeni oturum** başlatın veya o agent için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: nedir ve nasıl yönetilir?

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token depolama, çok hesaplı kalıplar)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Kimlik doğrulama profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada bulunur:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Kayıtlı profilleri sırları dökmeden incelemek için `openclaw models auth list` çalıştırın (isteğe bağlı olarak `--provider <id>` veya `--json`). Ayrıntılar için [Models CLI](/tr/cli/models#auth-profiles) sayfasına bakın.

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw aşağıdaki gibi sağlayıcı önekli kimlikler kullanır:

    - `anthropic:default` (e-posta kimliği olmadığında yaygın)
    - OAuth kimlikleri için `anthropic:<email>`
    - seçtiğiniz özel kimlikler (ör. `anthropic:work`)

  </Accordion>

  <Accordion title="İlk hangi kimlik doğrulama profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı meta verileri ve sağlayıcı başına bir sıralamayı (`auth.order.<provider>`) destekler. Bu **sırları** saklamaz; kimlikleri sağlayıcıya/moda eşler ve rotasyon sırasını ayarlar.

    OpenClaw, bir profili kısa bir **bekleme süresi** (hız sınırları/zaman aşımları/kimlik doğrulama hataları) veya daha uzun bir **devre dışı** durumu (faturalama/yetersiz kredi) içindeyse geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` kontrol edin. Ayarlama: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı bekleme süreleri model kapsamlı olabilir. Bir model için beklemede olan
    bir profil, aynı sağlayıcıdaki kardeş model için hâlâ kullanılabilir olabilirken,
    faturalama/devre dışı pencereleri tüm profili engellemeye devam eder.

    Ayrıca CLI üzerinden **agent başına** bir sıralama geçersiz kılması (o agent'ın `auth-state.json` dosyasında saklanır) ayarlayabilirsiniz:

    ```bash
    # Yapılandırılmış varsayılan agent kullanılır (omit --agent)
    openclaw models auth order get --provider anthropic

    # Rotasyonu tek bir profile kilitleyin (yalnızca bunu deneyin)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ya da açık bir sıralama ayarlayın (sağlayıcı içinde geri dönüş)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Geçersiz kılmayı temizleyin (config auth.order / round-robin'e geri dön)
    openclaw models auth order clear --provider anthropic
    ```

    Belirli bir agent'ı hedeflemek için:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gerçekte neyin deneneceğini doğrulamak için şunu kullanın:

    ```bash
    openclaw models status --probe
    ```

    Saklanan bir profil açık sıralamadan çıkarılırsa, probe bunu sessizce denemek yerine
    o profil için `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth** genellikle abonelik erişiminden yararlanır (geçerli olduğu durumlarda).
    - **API anahtarları** token başına ödeme faturalandırması kullanır.

    Sihirbaz Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model devretmesi](/tr/concepts/model-failover)
