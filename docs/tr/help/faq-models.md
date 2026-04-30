---
read_when:
    - Modelleri seçme veya değiştirme, takma adları yapılandırma
    - Model yük devretmesinde hata ayıklama / "Tüm modeller başarısız oldu"
    - Kimlik doğrulama profillerini ve bunları nasıl yöneteceğinizi anlama
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçimi, takma adları, değiştirme, yük devretme ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-04-30T09:26:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  Model ve kimlik doğrulama profili SSS. Kurulum, oturumlar, Gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, geçiş

  <AccordionGroup>
  <Accordion title='"Varsayılan model" nedir?'>
    OpenClaw'ın varsayılan modeli, şu şekilde ayarladığınız değerdir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` olarak başvurulur (örnek: `openai/gpt-5.5` veya `openai-codex/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, ardından tam olarak o model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra kullanımdan kaldırılmış uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski ve kaldırılmış bir sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda mevcut olan en güçlü son nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen giriş alan ajanlar için:** maliyetten çok model gücünü önceliklendirin.
    **Rutin/düşük riskli sohbet için:** daha ucuz yedek modeller kullanın ve ajan rolüne göre yönlendirin.

    MiniMax'in kendi dokümanları vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Genel kural: yüksek riskli işler için **karşılayabileceğiniz en iyi modeli**, rutin sohbet veya özetler içinse daha ucuz
    bir modeli kullanın. Modelleri ajana göre yönlendirebilir ve uzun görevleri
    paralelleştirmek için alt ajanlar kullanabilirsiniz (her alt ajan token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Alt ajanlar](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı nicemlenmiş modeller prompt
    enjeksiyonuna ve güvensiz davranışa karşı daha savunmasızdır. Bkz. [Güvenlik](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değiştirmelerinden kaçının.

    Güvenli seçenekler:

    - Sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` değerini düzenleyin

    Tüm yapılandırmayı değiştirmeyi amaçlamıyorsanız kısmi bir nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Arama yükü size normalleştirilmiş yolu, yüzeysel şema dokümanlarını/kısıtlarını ve doğrudan alt özetleri verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` komutunu yeniden çalıştırın.

    Dokümanlar: [Modeller](/tr/concepts/models), [Yapılandırma](/tr/cli/configure), [Config](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri (llama.cpp, vLLM, Ollama) kullanabilir miyim?">
    Evet. Yerel modeller için en kolay yol Ollama'dır.

    En hızlı kurulum:

    1. Ollama'yı `https://ollama.com/download` adresinden yükleyin
    2. `ollama pull gemma4` gibi bir yerel model indirin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local` size bulut modellerini ve yerel Ollama modellerinizi verir
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel indirme gerektirmez
    - elle geçiş için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun biçimde nicemlenmiş modeller prompt
    enjeksiyonuna karşı daha savunmasızdır. Araç kullanabilen her bot için **büyük modelleri** önemle öneririz.
    Yine de küçük modeller istiyorsanız korumalı alanı ve katı araç izin listelerini etkinleştirin.

    Dokümanlar: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Korumalı alan](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zamanla değişebilir; sabit bir sağlayıcı önerisi yoktur.
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

  <Accordion title="Günlük görevler için GPT 5.5, kodlama için Codex 5.5 kullanabilir miyim?">
    Evet. Birini varsayılan olarak ayarlayın ve gerektiğinde geçiş yapın:

    - **Hızlı geçiş (oturum başına):** geçerli doğrudan OpenAI API anahtarlı görevler için `/model openai/gpt-5.5` veya GPT-5.5 Codex OAuth görevleri için `/model openai-codex/gpt-5.5`.
    - **Varsayılan:** API anahtarı kullanımı için `agents.defaults.model.primary` değerini `openai/gpt-5.5`, GPT-5.5 Codex OAuth kullanımı için `openai-codex/gpt-5.5` olarak ayarlayın.
    - **Alt ajanlar:** kodlama görevlerini farklı bir varsayılan modele sahip alt ajanlara yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.5 için hızlı modu nasıl yapılandırırım?">
    Bir oturum geçişi veya yapılandırma varsayılanı kullanın:

    - **Oturum başına:** oturum `openai/gpt-5.5` veya `openai-codex/gpt-5.5` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` veya `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` değerini `true` olarak ayarlayın.

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

    OpenAI için hızlı mod, desteklenen yerel Responses isteklerinde `service_tier = "priority"` değerine eşlenir. Oturum `/fast` geçersiz kılmaları yapılandırma varsayılanlarından önce gelir.

    Bkz. [Düşünme ve hızlı mod](/tr/tools/thinking) ve [OpenAI hızlı mod](/tr/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='"Model ... is not allowed" gördükten sonra neden yanıt alamıyorum?'>
    `agents.defaults.models` ayarlanmışsa `/model` ve tüm
    oturum geçersiz kılmaları için **izin listesi** haline gelir. Bu listede olmayan bir modeli seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Bu hata normal yanıt **yerine** döndürülür. Çözüm: modeli
    `agents.defaults.models` içine ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.

  </Accordion>

  <Accordion title='"Unknown model: minimax/MiniMax-M2.7" neden görünüyor?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya kimlik doğrulama
    profili bulunamadı), bu yüzden model çözümlenemez.

    Çözüm kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` üzerinden çalıştırın), ardından Gateway'i yeniden başlatın.
    2. MiniMax'in yapılandırıldığından (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için env/kimlik doğrulama profillerinde MiniMax kimlik doğrulamasının
       bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya saklanan MiniMax
       OAuth).
    3. Kimlik doğrulama yolunuz için tam model kimliğini (büyük/küçük harfe duyarlı) kullanın:
       API anahtarlı kurulum için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       OAuth kurulumu içinse `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list`).

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="MiniMax'i varsayılanım, karmaşık görevler için OpenAI'yi kullanabilir miyim?">
    Evet. **Varsayılan olarak MiniMax'i** kullanın ve gerektiğinde modelleri **oturum başına** değiştirin.
    Yedekler **hatalar** içindir, "zor görevler" için değildir; bu nedenle `/model` veya ayrı bir ajan kullanın.

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
    - Ajana göre yönlendirin veya geçiş yapmak için `/agent` kullanın

    Dokümanlar: [Modeller](/tr/concepts/models), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısa adla gelir (yalnızca model `agents.defaults.models` içinde mevcut olduğunda uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API anahtarlı kurulumlar için `openai/gpt-5.5`, Codex OAuth için yapılandırıldığında ise `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı adla kendi takma adınızı ayarlarsanız sizin değeriniz kazanır.

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

    Bir sağlayıcıya/modele başvurursanız ancak gerekli sağlayıcı anahtarı eksikse, çalışma zamanında kimlik doğrulama hatası alırsınız (örn. `No API key found for provider "zai"`).

    **Yeni bir ajan ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni ajanın** boş bir kimlik doğrulama deposuna sahip olduğu anlamına gelir. Kimlik doğrulama ajan bazındadır ve
    şurada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` komutunu çalıştırın ve sihirbaz sırasında kimlik doğrulamayı yapılandırın.
    - Veya yalnızca taşınabilir statik `api_key` / `token` profillerini ana ajanın kimlik doğrulama deposundan yeni ajanın kimlik doğrulama deposuna kopyalayın.
    - OAuth profilleri için, yeni ajanın kendi hesabına ihtiyacı olduğunda yeni ajandan oturum açın; aksi halde OpenClaw yenileme belirteçlerini klonlamadan varsayılan/ana ajana erişip okuyabilir.

    `agentDir` değerini ajanlar arasında **yeniden kullanmayın**; bu, kimlik doğrulama/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model yük devri ve "Tüm modeller başarısız oldu"

<AccordionGroup>
  <Accordion title="Yük devri nasıl çalışır?">
    Yük devri iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model geri dönüşü**.

    Başarısız profillere bekleme süreleri uygulanır (üstel geri çekilme), böylece bir sağlayıcı hız sınırına takılsa veya geçici olarak başarısız olsa bile OpenClaw yanıt vermeye devam edebilir.

    Hız sınırı kovası, düz `429` yanıtlarından fazlasını içerir. OpenClaw
    ayrıca `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` gibi iletileri ve periyodik
    kullanım penceresi sınırlarını (`weekly/monthly limit reached`) yük devrine değer
    hız sınırları olarak ele alır.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı `401` veya `403` üzerinde
    açık faturalandırma metni döndürürse, OpenClaw bunu yine de faturalandırma
    hattında tutabilir, ancak sağlayıcıya özgü metin eşleyiciler bunlara sahip
    olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Bir `402`
    iletisi bunun yerine yeniden denenebilir kullanım penceresi veya
    kuruluş/çalışma alanı harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli faturalandırma devre dışı bırakması
    olarak değil, `rate_limit` olarak ele alır.

    Bağlam taşması hataları farklıdır: `request_too_large`,
    `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar model geri dönüşünü ilerletmek yerine compaction/yeniden deneme
    yolunda kalır.

    Genel sunucu hatası metni, bilinçli olarak "içinde unknown/error geçen
    herhangi bir şey"den daha dardır. OpenClaw, sağlayıcı bağlamı
    eşleştiğinde Anthropic yalın `An unknown error occurred`, OpenRouter yalın
    `Provider returned error`, `Unhandled stop reason:
    error` gibi durdurma nedeni hataları, geçici sunucu metni içeren JSON
    `api_error` yükleri (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı-meşgul hataları
    gibi sağlayıcı kapsamlı geçici şekilleri yük devrine değer zaman aşımı/aşırı yük sinyalleri olarak
    ele alır.
    `LLM request failed with an unknown
    error.` gibi genel dahili geri dönüş metni temkinli kalır ve tek başına model geri dönüşünü tetiklemez.

  </Accordion>

  <Accordion title='"anthropic:default profili için kimlik bilgisi bulunamadı" ne anlama gelir?'>
    Bu, sistemin `anthropic:default` kimlik doğrulama profili kimliğini kullanmaya çalıştığı, ancak beklenen kimlik doğrulama deposunda bunun için kimlik bilgisi bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Kimlik doğrulama profillerinin nerede bulunduğunu doğrulayın** (yeni ve eski yollar)
      - Geçerli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - Kabuğunuzda `ANTHROPIC_API_KEY` ayarladıysanız ancak Gateway'i systemd/launchd üzerinden çalıştırıyorsanız, bunu devralmayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` değerini etkinleştirin.
    - **Doğru ajanı düzenlediğinizden emin olun**
      - Çok ajanlı kurulumlar, birden fazla `auth-profiles.json` dosyası olabileceği anlamına gelir.
    - **Model/kimlik doğrulama durumunu sağduyu kontrolünden geçirin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimliğinin doğrulanıp doğrulanmadığını görmek için `openclaw models status` kullanın.

    **"anthropic profili için kimlik bilgisi bulunamadı" için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic kimlik doğrulama profiline sabitlendiği, ancak Gateway'in
    bunu kimlik doğrulama deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine bir API anahtarı kullanmak istiyorsanız**
      - **Gateway ana makinesinde** `ANTHROPIC_API_KEY` değerini `~/.openclaw/.env` içine koyun.
      - Eksik bir profili zorlayan sabitlenmiş sıralamayı temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları Gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak modda, kimlik doğrulama profilleri dizüstü bilgisayarınızda değil Gateway makinesinde bulunur.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de deneyip başarısız oldu?">
    Model yapılandırmanız Google Gemini'yi geri dönüş olarak içeriyorsa (veya bir Gemini kısaltmasına geçtiyseniz), OpenClaw model geri dönüşü sırasında onu deneyecektir. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: Google kimlik doğrulaması sağlayın veya geri dönüşün oraya yönlenmemesi için `agents.defaults.model.fallbacks` / takma adlar içinden Google modellerini kaldırın/kaçının.

    **LLM isteği reddedildi: düşünme imzası gerekli (Google Antigravity)**

    Neden: oturum geçmişi **imzasız düşünme blokları** içeriyor (çoğunlukla
    iptal edilmiş/kısmi bir akıştan). Google Antigravity, düşünme blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız düşünme bloklarını çıkarır. Hala görünürse, **yeni bir oturum** başlatın veya o ajan için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: nedir ve nasıl yönetilir

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, belirteç depolama, çok hesaplı kalıplar)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Kimlik doğrulama profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada bulunur:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw şu gibi sağlayıcı önekli kimlikler kullanır:

    - `anthropic:default` (e-posta kimliği olmadığında yaygın)
    - OAuth kimlikleri için `anthropic:<email>`
    - Seçtiğiniz özel kimlikler (örn. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi kimlik doğrulama profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı meta verileri ve sağlayıcı başına bir sıralamayı (`auth.order.<provider>`) destekler. Bu, gizli bilgileri saklamaz; kimlikleri sağlayıcı/mod ile eşler ve rotasyon sırasını ayarlar.

    OpenClaw, kısa bir **bekleme süresinde** (hız sınırları/zaman aşımları/kimlik doğrulama hataları) veya daha uzun bir **devre dışı** durumundaysa (faturalandırma/yetersiz kredi) bir profili geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` değerini kontrol edin. Ayarlama: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı bekleme süreleri model kapsamlı olabilir. Bir model için bekleme süresinde olan
    bir profil, aynı sağlayıcıdaki kardeş bir model için hâlâ kullanılabilir olabilir;
    faturalandırma/devre dışı pencereleri ise tüm profili engellemeye devam eder.

    CLI üzerinden ayrıca **ajan bazında** sıralama geçersiz kılması (o ajanın `auth-state.json` dosyasında saklanır) ayarlayabilirsiniz:

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

    Saklanan bir profil açık sıralamadan çıkarılmışsa, probe bu profili sessizce denemek yerine
    `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ve API anahtarı - fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth** çoğu zaman abonelik erişiminden yararlanır (uygun olduğunda).
    - **API anahtarları** belirteç başına ödeme faturalandırması kullanır.

    Sihirbaz Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devri](/tr/concepts/model-failover)
