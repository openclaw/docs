---
read_when:
    - Model seçme veya değiştirme, takma adları yapılandırma
    - Model yük devretmede hata ayıklama / "Tüm modeller başarısız oldu"
    - Kimlik doğrulama profillerini anlama ve yönetme
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçimi, takma adlar, geçiş, yük devretme ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-06-28T00:40:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  Model ve kimlik doğrulama profili SSS. Kurulum, oturumlar, gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, değiştirme

  <AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw'ın varsayılan modeli, şu şekilde ayarladığınız değerdir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` olarak referanslanır (örnek: `openai/gpt-5.5` veya `anthropic/claude-sonnet-4-6`). Sağlayıcıyı belirtmezseniz OpenClaw önce bir takma ad, sonra tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesi dener ve ancak bundan sonra kullanımdan kaldırılmış uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski, kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele döner. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda mevcut olan en güçlü son nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdi alan ajanlar için:** maliyetten çok model gücüne öncelik verin.
    **Rutin/düşük riskli sohbet için:** daha ucuz yedek modeller kullanın ve ajan rolüne göre yönlendirin.

    MiniMax’in kendi dokümanları vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Genel kural: yüksek riskli işler için **karşılayabildiğiniz en iyi modeli**, rutin sohbet veya özetler için daha ucuz bir modeli kullanın. Modelleri ajan bazında yönlendirebilir ve uzun görevleri paralelleştirmek için alt ajanlar kullanabilirsiniz (her alt ajan token tüketir). [Modeller](/tr/concepts/models) ve
    [Alt ajanlar](/tr/tools/subagents) sayfalarına bakın.

    Güçlü uyarı: daha zayıf/aşırı nicemlenmiş modeller prompt
    enjeksiyonuna ve güvenli olmayan davranışlara karşı daha savunmasızdır. [Güvenlik](/tr/gateway/security) sayfasına bakın.

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değiştirmelerinden kaçının.

    Güvenli seçenekler:

    - Sohbette `/model` (hızlı, oturum bazında)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` değerini düzenleme

    Tüm yapılandırmayı değiştirmeyi amaçlamıyorsanız kısmi bir nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve tercihen `config.patch` kullanın. Lookup yükü size normalleştirilmiş yolu, yüzeysel şema dokümanlarını/kısıtlarını ve anlık alt öğe özetlerini verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` komutunu yeniden çalıştırın.

    Dokümanlar: [Modeller](/tr/concepts/models), [Yapılandırma](/tr/cli/configure), [Config](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri (llama.cpp, vLLM, Ollama) kullanabilir miyim?">
    Evet. Yerel modeller için en kolay yol Ollama’dır.

    En hızlı kurulum:

    1. Ollama’yı `https://ollama.com/download` adresinden yükleyin
    2. `ollama pull gemma4` gibi yerel bir model indirin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local` size bulut modellerini ve yerel Ollama modellerinizi verir
    - `kimi-k2.5:cloud` gibi bulut modelleri için yerel indirme gerekmez
    - manuel geçiş için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun nicemlenmiş modeller prompt
    enjeksiyonuna karşı daha savunmasızdır. Araç kullanabilen herhangi bir bot için **büyük modelleri** kesinlikle öneririz.
    Yine de küçük modeller istiyorsanız korumalı alanı ve katı araç izin listelerini etkinleştirin.

    Dokümanlar: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Korumalı alan](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklılık gösterebilir ve zamanla değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her Gateway üzerindeki geçerli çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenlik açısından hassas/araç etkin ajanlar için mevcut en güçlü son nesil modeli kullanın.

  </Accordion>

  <Accordion title="Modelleri anında (yeniden başlatmadan) nasıl değiştiririm?">
    `/model` komutunu tek başına bir mesaj olarak kullanın:

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

    `/model` (ve `/model list`) kompakt, numaralı bir seçim aracı gösterir. Numarayla seçin:

    ```
    /model 3
    ```

    Sağlayıcı için belirli bir kimlik doğrulama profilini de zorlayabilirsiniz (oturum bazında):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status` hangi ajanın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sırada hangi kimlik doğrulama profilinin deneneceğini gösterir.
    Ayrıca mevcut olduğunda yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) gösterir.

    **@profile ile ayarladığım bir profil sabitlemesini nasıl kaldırırım?**

    `/model` komutunu `@profile` son eki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi kimlik doğrulama profilinin etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="İki sağlayıcı aynı model kimliğini sunarsa /model hangisini kullanır?">
    `/model provider/model`, oturum için tam olarak o sağlayıcı rotasını seçer.

    Örneğin `qianfan/deepseek-v4-flash` ve `deepseek/deepseek-v4-flash`, ikisi de `deepseek-v4-flash` içerse de farklı model referanslarıdır. OpenClaw yalnızca çıplak model kimliği eşleşiyor diye bir sağlayıcıdan diğerine sessizce geçmemelidir.

    Kullanıcı tarafından seçilmiş bir `/model` referansı, yedekleme politikası için de katıdır. Seçilen sağlayıcı/model kullanılamıyorsa yanıt, `agents.defaults.model.fallbacks` üzerinden cevaplamak yerine görünür şekilde başarısız olur. Yapılandırılmış yedek zincirleri yine yapılandırılmış varsayılanlara, cron işi birincillerine ve otomatik seçilmiş yedek durumuna uygulanır.

    Oturum dışı bir geçersiz kılmadan başlayan bir çalışmanın yedek kullanmasına izin veriliyorsa OpenClaw önce istenen sağlayıcı/modeli, sonra yapılandırılmış yedekleri ve ancak sonra yapılandırılmış birincili dener. Bu, yinelenen çıplak model kimliklerinin doğrudan varsayılan sağlayıcıya atlamasını önler.

    [Modeller](/tr/concepts/models) ve [Model failover](/tr/concepts/model-failover) sayfalarına bakın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.5 ve kodlama için Codex 5.5 kullanabilir miyim?">
    Evet. Model seçimini ve çalışma zamanı seçimini ayrı ele alın:

    - **Yerel Codex kodlama ajanı:** `agents.defaults.model.primary` değerini `openai/gpt-5.5` olarak ayarlayın. ChatGPT/Codex abonelik kimlik doğrulamasını kullanmak istediğinizde `openclaw models auth login --provider openai` ile oturum açın.
    - **Ajan döngüsü dışındaki doğrudan OpenAI API görevleri:** görseller, embedding’ler, konuşma, gerçek zamanlı ve diğer ajan dışı OpenAI API yüzeyleri için `OPENAI_API_KEY` yapılandırın.
    - **OpenAI ajan API anahtarı kimlik doğrulaması:** sıralı bir `openai` API anahtarı profiliyle `/model openai/gpt-5.5` kullanın.
    - **Alt ajanlar:** kodlama görevlerini kendi `openai/gpt-5.5` modeline sahip Codex odaklı bir ajana yönlendirin.

    [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands) sayfalarına bakın.

  </Accordion>

  <Accordion title="GPT 5.5 için hızlı modu nasıl yapılandırırım?">
    Bir oturum anahtarı veya bir yapılandırma varsayılanı kullanın:

    - **Oturum bazında:** oturum `openai/gpt-5.5` kullanırken `/fast on` gönderin.
    - **Model bazında varsayılan:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` değerini `true` olarak ayarlayın.
    - **Otomatik kesme:** yeni model çağrılarını otomatik kesme süresine kadar hızlı başlatmak, ardından sonraki yeniden deneme, yedek, araç sonucu veya devam çağrılarını hızlı mod olmadan başlatmak için `/fast auto` veya `params.fastMode: "auto"` kullanın. Kesme süresi varsayılan olarak 60 saniyedir; değiştirmek için etkin modelde `params.fastAutoOnSeconds` ayarlayın.

    Örnek:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI için hızlı mod, desteklenen yerel Responses isteklerinde `service_tier = "priority"` değerine eşlenir. Oturum `/fast` geçersiz kılmaları, yapılandırma varsayılanlarının önüne geçer. Codex app-server dönüşleri kademeyi yalnızca dönüş başlangıcında alabilir; bu nedenle `auto`, zaten çalışan bir app-server dönüşünün içinde değil, OpenClaw tarafından başlatılan sonraki model dönüşünde uygulanır.

    [Düşünme ve hızlı mod](/tr/tools/thinking) ve [OpenAI hızlı mod](/tr/providers/openai#fast-mode) sayfalarına bakın.

  </Accordion>

  <Accordion title='Neden "Model ... is not allowed" görüyorum ve sonra yanıt gelmiyor?'>
    `agents.defaults.models` ayarlanmışsa, `/model` ve tüm oturum geçersiz kılmaları için **izin listesi** haline gelir. Bu listede olmayan bir modeli seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Bu hata normal bir yanıtın **yerine** döndürülür. Çözüm: tam modeli
    `agents.defaults.models` içine ekleyin, dinamik sağlayıcı katalogları için `"provider/*": {}` gibi bir sağlayıcı joker karakteri ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.
    Komut ayrıca `--runtime codex` içeriyorsa önce izin listesini güncelleyin ve sonra aynı `/model provider/model --runtime codex` komutunu yeniden deneyin.

  </Accordion>

  <Accordion title='Neden "Unknown model: minimax/MiniMax-M3" görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya kimlik doğrulama
    profili bulunamadı), bu yüzden model çözümlenemez.

    Çözüm kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` üzerinden çalıştırın), ardından Gateway’i yeniden başlatın.
    2. MiniMax’in yapılandırıldığından (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için MiniMax kimlik doğrulamasının
       env/auth profillerinde mevcut olduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya saklanan MiniMax
       OAuth).
    3. Kimlik doğrulama yolunuz için tam model kimliğini (büyük/küçük harfe duyarlı) kullanın:
       API anahtarı kurulumu için `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` veya
       `minimax/MiniMax-M2.7-highspeed`; OAuth kurulumu için
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` veya
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list` kullanın).

    [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models) sayfalarına bakın.

  </Accordion>

  <Accordion title="MiniMax’i varsayılanım, OpenAI’ı karmaşık görevler için kullanabilir miyim?">
    Evet. **Varsayılan olarak MiniMax** kullanın ve gerektiğinde modelleri **oturum bazında** değiştirin.
    Yedekler "zor görevler" için değil, **hatalar** içindir; bu yüzden `/model` veya ayrı bir ajan kullanın.

    **Seçenek A: oturum bazında değiştirme**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
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

    Dokümanlar: [Modeller](/tr/concepts/models), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısa adla gelir (yalnızca model `agents.defaults.models` içinde mevcut olduğunda uygulanır):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    Aynı adla kendi takma adınızı ayarlarsanız, sizin değeriniz geçerli olur.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adları) nasıl tanımlar/geçersiz kılarım?">
    Takma adlar `agents.defaults.models.<modelId>.alias` değerinden gelir. Örnek:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
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

    Bir sağlayıcıya/modele başvurursanız ancak gerekli sağlayıcı anahtarı eksikse, çalışma zamanı kimlik doğrulama hatası alırsınız (ör. `No API key found for provider "zai"`).

    **Yeni bir ajan ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni ajanın** boş bir kimlik doğrulama deposu olduğu anlamına gelir. Kimlik doğrulama ajan bazındadır ve şurada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` komutunu çalıştırın ve sihirbaz sırasında kimlik doğrulamayı yapılandırın.
    - Ya da ana ajanın kimlik doğrulama deposundan yeni ajanın kimlik doğrulama deposuna yalnızca taşınabilir statik `api_key` / `token` profillerini kopyalayın.
    - OAuth profilleri için, kendi hesabına ihtiyaç duyduğunda yeni ajandan oturum açın; aksi halde OpenClaw yenileme tokenlarını klonlamadan varsayılan/ana ajana okuyarak erişebilir.

    Ajanlar arasında `agentDir` değerini yeniden kullanmayın; bu kimlik doğrulama/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model yük devretme ve "Tüm modeller başarısız oldu"

<AccordionGroup>
  <Accordion title="Yük devretme nasıl çalışır?">
    Yük devretme iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model yedeği**.

    Başarısız profillere bekleme süreleri uygulanır (üstel geri çekilme), böylece bir sağlayıcı hız sınırına takıldığında veya geçici olarak başarısız olduğunda bile OpenClaw yanıt vermeye devam edebilir.

    Hız sınırı kovası yalnızca düz `429` yanıtlarından fazlasını içerir. OpenClaw
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` gibi iletileri ve dönemsel
    kullanım penceresi sınırlarını (`weekly/monthly limit reached`) da yük devretmeye değer
    hız sınırları olarak ele alır.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı `401` veya `403` üzerinde
    açık faturalandırma metni döndürürse, OpenClaw bunu yine de
    faturalandırma hattında tutabilir, ancak sağlayıcıya özel metin eşleştiricileri
    onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Bir `402`
    iletisi bunun yerine yeniden denenebilir bir kullanım penceresi veya
    kuruluş/çalışma alanı harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli faturalandırma devre dışı bırakması değil,
    `rate_limit` olarak ele alır.

    Bağlam taşması hataları farklıdır: `request_too_large`,
    `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar, model yedeğine ilerlemek yerine Compaction/yeniden deneme
    yolunda kalır.

    Genel sunucu hatası metni, kasıtlı olarak "içinde unknown/error geçen
    her şeyden" daha dardır. OpenClaw; Anthropic yalın `An unknown error occurred`, OpenRouter yalın
    `Provider returned error`, `Unhandled stop reason:
    error` gibi durdurma nedeni hataları, geçici sunucu metni içeren JSON `api_error` yükleri
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hataları gibi
    sağlayıcı kapsamlı geçici şekilleri, sağlayıcı bağlamı
    eşleştiğinde yük devretmeye değer zaman aşımı/aşırı yük sinyalleri olarak ele alır.
    `LLM request failed with an unknown
    error.` gibi genel dahili yedek metin korumacı kalır ve tek başına model yedeğini tetiklemez.

  </Accordion>

  <Accordion title='"anthropic:default profili için kimlik bilgisi bulunamadı" ne anlama gelir?'>
    Bu, sistemin `anthropic:default` kimlik doğrulama profili kimliğini kullanmaya çalıştığı, ancak beklenen kimlik doğrulama deposunda bunun için kimlik bilgisi bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Kimlik doğrulama profillerinin nerede bulunduğunu doğrulayın** (yeni ve eski yollar)
      - Geçerli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini kabuğunuzda ayarladıysanız ancak Gateway'i systemd/launchd üzerinden çalıştırıyorsanız, bunu devralmayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` değerini etkinleştirin.
    - **Doğru ajanı düzenlediğinizden emin olun**
      - Çok ajanlı kurulumlarda birden fazla `auth-profiles.json` dosyası olabilir.
    - **Model/kimlik doğrulama durumunu hızlıca kontrol edin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimliğinin doğrulanıp doğrulanmadığını görmek için `openclaw models status` kullanın.

    **"anthropic profili için kimlik bilgisi bulunamadı" için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic kimlik doğrulama profiline sabitlendiği, ancak Gateway'in
    bunu kimlik doğrulama deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **gateway ana makinesinde** `~/.openclaw/.env` içine `ANTHROPIC_API_KEY` koyun.
      - Eksik bir profili zorlayan sabitlenmiş herhangi bir sırayı temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak modda, kimlik doğrulama profilleri dizüstü bilgisayarınızda değil gateway makinesinde bulunur.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de denedi ve başarısız oldu?">
    Model yapılandırmanız yedek olarak Google Gemini içeriyorsa (veya bir Gemini kısa adına geçtiyseniz), OpenClaw model yedeği sırasında onu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: Google kimlik doğrulaması sağlayın veya `agents.defaults.model.fallbacks` / takma adlar içinde Google modellerini kaldırın/kaçının; böylece yedek oraya yönlendirilmez.

    **LLM isteği reddedildi: düşünme imzası gerekli (Google Antigravity)**

    Neden: oturum geçmişi **imzasız düşünme blokları** içeriyor (genellikle
    iptal edilmiş/kısmi bir akıştan). Google Antigravity, düşünme blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız düşünme bloklarını çıkarır. Hala görünürse, **yeni bir oturum** başlatın veya o ajan için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: nedir ve nasıl yönetilir?

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token depolama, çok hesaplı desenler)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Kimlik doğrulama profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada bulunur:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Kaydedilmiş profilleri sırları dökmeden incelemek için `openclaw models auth list` çalıştırın (isteğe bağlı olarak `--provider <id>` veya `--json`). Ayrıntılar için [Modeller CLI](/tr/cli/models#auth-profiles) bölümüne bakın.

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw şu gibi sağlayıcı önekli kimlikler kullanır:

    - `anthropic:default` (e-posta kimliği olmadığında yaygın)
    - OAuth kimlikleri için `anthropic:<email>`
    - seçtiğiniz özel kimlikler (ör. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi kimlik doğrulama profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı metadata'yı ve sağlayıcı başına bir sıralamayı (`auth.order.<provider>`) destekler. Bu **sırları** saklamaz; kimlikleri sağlayıcı/mod ile eşler ve rotasyon sırasını ayarlar.

    OpenClaw, bir profil kısa bir **bekleme süresi** (hız sınırları/zaman aşımları/kimlik doğrulama hataları) veya daha uzun bir **devre dışı** durumdaysa (faturalandırma/yetersiz kredi) geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` değerini kontrol edin. Ayar: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı bekleme süreleri model kapsamlı olabilir. Bir model için beklemede olan
    bir profil, aynı sağlayıcıdaki kardeş bir model için hâlâ kullanılabilir olabilir;
    faturalandırma/devre dışı pencereleri ise tüm profili engellemeye devam eder.

    CLI aracılığıyla **ajan başına** bir sıra geçersiz kılması da ayarlayabilirsiniz (o ajanın `auth-state.json` dosyasında saklanır):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
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

    Saklanan bir profil açık sıradan çıkarılmışsa, probe onu sessizce denemek yerine
    o profil için `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth / CLI oturumu**, sağlayıcının desteklediği yerlerde genellikle abonelik erişiminden
      yararlanır. Anthropic için OpenClaw'ın Claude CLI arka ucu
      Claude Code `claude -p` kullanır; Anthropic şu anda bunu Agent
      SDK/programatik kullanım olarak ele alır ve 15 Haziran 2026'dan itibaren ayrı bir aylık Agent SDK kredisi vardır.
    - **API anahtarları** token başına ödeme faturalandırması kullanır.

    Sihirbaz Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretme](/tr/concepts/model-failover)
