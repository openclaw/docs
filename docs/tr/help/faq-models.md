---
read_when:
    - Modelleri seçme veya değiştirme, takma adları yapılandırma
    - Model yük devretmesini / "All models failed" hatasını ayıklama
    - Kimlik doğrulama profillerini ve bunların nasıl yönetileceğini anlama
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçim, takma adlar, değiştirme, yük devretme ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-04-24T09:12:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  Model ve kimlik doğrulama profili soru-cevapları. Kurulum, oturumlar, Gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, değiştirme

  <AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw’ın varsayılan modeli, şu şekilde ayarladığınız modeldir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` olarak referans verilir (örnek: `openai/gpt-5.4` veya `openai-codex/gpt-5.5`). Sağlayıcıyı çıkarırsanız OpenClaw önce bir takma adı, sonra tam bu model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve yalnızca bundan sonra eski uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri düşer. O sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski, kaldırılmış bir sağlayıcı varsayılanını göstermeden ilk yapılandırılmış sağlayıcı/modele geri düşer. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli öneriyorsunuz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda mevcut olan en güçlü en yeni nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdili aracılar için:** maliyetten çok model gücüne öncelik verin.
    **Rutin/düşük riskli sohbet için:** daha ucuz geri dönüş modelleri kullanın ve aracı rolüne göre yönlendirin.

    MiniMax’ın kendi belgeleri vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Genel kural: yüksek riskli işler için **karşılayabildiğiniz en iyi modeli**, rutin
    sohbet veya özetler için daha ucuz bir modeli kullanın. Modelleri aracıya göre yönlendirebilir ve uzun görevleri
    paralelleştirmek için alt aracılar kullanabilirsiniz (her alt aracı token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Alt aracılar](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı quantize edilmiş modeller prompt
    injection ve güvensiz davranışlara daha açıktır. Bkz. [Güvenlik](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutları** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değiştirmelerinden kaçının.

    Güvenli seçenekler:

    - sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` düzenleyin

    Tüm yapılandırmayı değiştirmeyi amaçlamıyorsanız kısmi bir nesneyle `config.apply`
    kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve kısmi güncellemeler
    için `config.patch` tercih edin. Arama yükü size normalize edilmiş yolu, sığ şema belgelerini/kısıtlamaları ve anlık alt öğe özetlerini verir.

    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` komutunu yeniden çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Configure](/tr/cli/configure), [Config](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri kullanabilir miyim (llama.cpp, vLLM, Ollama)?">
    Evet. Yerel modeller için en kolay yol Ollama’dır.

    En hızlı kurulum:

    1. Ollama’yı `https://ollama.com/download` adresinden kurun
    2. `ollama pull gemma4` gibi bir yerel model çekin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local` size bulut modelleri artı yerel Ollama modellerinizi verir
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel çekim gerektirmez
    - elle değiştirmek için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun şekilde quantize edilmiş modeller prompt
    injection’a daha açıktır. Araç kullanabilen herhangi bir bot için güçlü biçimde **büyük modeller**
    öneririz. Yine de küçük modeller istiyorsanız sandboxing ve katı araç izin listelerini etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zaman içinde değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her Gateway’de geçerli çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenliğe duyarlı/araç etkin aracılar için mevcut en güçlü en yeni nesil modeli kullanın.
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

    Bunlar yerleşik takma adlardır. Özel takma adlar `agents.defaults.models` aracılığıyla eklenebilir.

    Kullanılabilir modelleri `/model`, `/model list` veya `/model status` ile listeleyebilirsiniz.

    `/model` (ve `/model list`) sıkı, numaralandırılmış bir seçici gösterir. Numaraya göre seçin:

    ```
    /model 3
    ```

    Sağlayıcı için belirli bir kimlik doğrulama profilini de zorlayabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status`, hangi aracının etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sıradaki hangi kimlik doğrulama profilinin deneneceğini gösterir.
    Mevcutsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API kipini (`api`) de gösterir.

    **@profile ile ayarladığım profili nasıl kaldırırım?**

    `/model` komutunu `@profile` son eki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız onu `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi kimlik doğrulama profilinin etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.5 ve kodlama için Codex 5.5 kullanabilir miyim?">
    Evet. Birini varsayılan olarak ayarlayın ve gerektiğinde değiştirin:

    - **Hızlı geçiş (oturum başına):** geçerli doğrudan OpenAI API anahtarı görevleri için `/model openai/gpt-5.4` veya GPT-5.5 Codex OAuth görevleri için `/model openai-codex/gpt-5.5`.
    - **Varsayılan:** API anahtarı kullanımı için `agents.defaults.model.primary` değerini `openai/gpt-5.4`, GPT-5.5 Codex OAuth kullanımı için `openai-codex/gpt-5.5` olarak ayarlayın.
    - **Alt aracılar:** kodlama görevlerini farklı bir varsayılan modele sahip alt aracılara yönlendirin.

    `openai/gpt-5.5` için doğrudan API anahtarı erişimi, OpenAI
    GPT-5.5’i genel API’de etkinleştirdiğinde desteklenecektir. O zamana kadar GPT-5.5 yalnızca abonelik/OAuth’tur.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.5 için hızlı modu nasıl yapılandırırım?">
    Ya bir oturum anahtarı ya da bir yapılandırma varsayılanı kullanın:

    - **Oturum başına:** oturum `openai/gpt-5.4` veya `openai-codex/gpt-5.5` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` veya `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` değerini `true` yapın.

    Örnek:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI için hızlı mod, desteklenen doğal Responses isteklerinde `service_tier = "priority"` değerine eşlenir. Oturum `/fast` geçersiz kılmaları yapılandırma varsayılanlarını geçersiz kılar.

    Bkz. [Düşünme ve hızlı mod](/tr/tools/thinking) ve [OpenAI hızlı modu](/tr/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Neden "Model ... is not allowed" görüp sonra yanıt alamıyorum?'>
    `agents.defaults.models` ayarlanmışsa `/model` ve tüm
    oturum geçersiz kılmaları için **izin listesi** hâline gelir. Bu listede olmayan bir modeli seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Bu hata normal bir yanıt **yerine** döndürülür. Düzeltme: modeli
    `agents.defaults.models` içine ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.

  </Accordion>

  <Accordion title='Neden "Unknown model: minimax/MiniMax-M2.7" görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya auth
    profili bulunamadı), bu nedenle model çözümlenemiyor.

    Düzeltme denetim listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynaktan `main` çalıştırın), ardından Gateway’i yeniden başlatın.
    2. MiniMax’ın yapılandırıldığından emin olun (sihirbaz veya JSON) veya eşleşen sağlayıcının enjekte edilebilmesi için env/auth profillerinde MiniMax kimlik doğrulamasının
       bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya saklanmış MiniMax
       OAuth).
    3. Kimlik doğrulama yolunuz için tam model kimliğini kullanın (büyük/küçük harfe duyarlı):
       API anahtarı kurulumu için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       OAuth kurulumu için `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list`).

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Varsayılanım olarak MiniMax ve karmaşık görevler için OpenAI kullanabilir miyim?">
    Evet. **Varsayılan olarak MiniMax** kullanın ve gerektiğinde modelleri **oturum başına**
    değiştirin. Geri dönüşler **hatalar** içindir, “zor görevler” için değil; bu yüzden `/model` veya ayrı bir aracı kullanın.

    **Seçenek A: oturum başına değiştirin**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Sonra:

    ```
    /model gpt
    ```

    **Seçenek B: ayrı aracılar**

    - Aracı A varsayılanı: MiniMax
    - Aracı B varsayılanı: OpenAI
    - Aracıya göre yönlendirin veya değiştirmek için `/agent` kullanın

    Belgeler: [Modeller](/tr/concepts/models), [Çoklu Aracı Yönlendirme](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısa adla gelir (yalnızca model `agents.defaults.models` içinde varsa uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API anahtarı kurulumları için `openai/gpt-5.4`, veya Codex OAuth için yapılandırıldığında `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı adla kendi takma adınızı ayarlarsanız sizin değeriniz kazanır.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adlar) nasıl tanımlarım/geçersiz kılarım?">
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

    Sonra `/model sonnet` (veya desteklendiğinde `/<alias>`) o model kimliğine çözümlenir.

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

    Bir sağlayıcı/modele referans verir ama gerekli sağlayıcı anahtarı eksikse çalışma zamanında bir kimlik doğrulama hatası alırsınız (örneğin `No API key found for provider "zai"`).

    **Yeni bir aracı ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni aracının** boş bir kimlik doğrulama deposuna sahip olduğu anlamına gelir. Kimlik doğrulama aracı başınadır ve şu konumda saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` çalıştırın ve sihirbaz sırasında kimlik doğrulamayı yapılandırın.
    - Veya `auth-profiles.json` dosyasını ana aracının `agentDir` içinden yeni aracının `agentDir` içine kopyalayın.

    `agentDir` değerini aracılar arasında yeniden kullanmayın; kimlik doğrulama/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model yük devretme ve "All models failed"

<AccordionGroup>
  <Accordion title="Yük devretme nasıl çalışır?">
    Yük devretme iki aşamada olur:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili döndürme**.
    2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model geri dönüşü**.

    Başarısız profillere bekleme süreleri uygulanır (üstel geri çekilme), böylece OpenClaw bir sağlayıcı hız sınırlı olduğunda veya geçici olarak başarısız olduğunda bile yanıt vermeyi sürdürebilir.

    Hız sınırı kovası yalnızca düz `429` yanıtlarından fazlasını içerir. OpenClaw
    ayrıca `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` ve dönemsel
    kullanım penceresi sınırları (`weekly/monthly limit reached`) gibi iletileri de yük devretmeye değer
    hız sınırları olarak ele alır.

    Bazı faturalama benzeri yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı
    `401` veya `403` üzerinde açık faturalama metni döndürürse OpenClaw yine de bunu
    faturalama hattında tutabilir, ancak sağlayıcıya özgü metin eşleyicileri onları
    sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Eğer bir `402`
    iletisi bunun yerine yeniden denenebilir bir kullanım penceresi veya
    kuruluş/çalışma alanı harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli bir faturalama devre dışı bırakması değil,
    `rate_limit` olarak ele alır.

    Bağlam taşması hataları farklıdır: örneğin
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar model geri dönüşünü ilerletmek yerine Compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni kasıtlı olarak “içinde unknown/error geçen her şeyden”
    daha dardır. OpenClaw, sağlayıcı kapsamındaki geçici biçimleri
    örneğin Anthropic’in yalın `An unknown error occurred`, OpenRouter’ın yalın
    `Provider returned error`, `Unhandled stop reason:
    error` gibi durma nedeni hatalarını, geçici sunucu metni içeren JSON `api_error` yüklerini
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hatalarını
    sağlayıcı bağlamı eşleştiğinde yük devretmeye değer zaman aşımı/aşırı yük sinyalleri olarak ele alır.
    `LLM request failed with an unknown
    error.` gibi genel dahili geri dönüş metni ise tutucudur ve tek başına model geri dönüşünü tetiklemez.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” ne anlama gelir?'>
    Bu, sistemin `anthropic:default` kimlik doğrulama profil kimliğini kullanmayı denediği, ancak beklenen kimlik doğrulama deposunda bunun için kimlik bilgisi bulamadığı anlamına gelir.

    **Düzeltme denetim listesi:**

    - **Kimlik doğrulama profillerinin nerede yaşadığını doğrulayın** (yeni ve eski yollar)
      - Güncel: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini kabuğunuzda ayarlayıp Gateway’i systemd/launchd ile çalıştırıyorsanız bunu devralmayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` özelliğini etkinleştirin.
    - **Doğru aracıyı düzenlediğinizden emin olun**
      - Çoklu aracı kurulumları birden fazla `auth-profiles.json` dosyası olduğu anlamına gelebilir.
    - **Model/kimlik doğrulama durumunu mantık kontrolünden geçirin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimliği doğrulanmış olup olmadığını görmek için `openclaw models status` kullanın.

    **“No credentials found for profile anthropic” için düzeltme denetim listesi**

    Bu, çalıştırmanın bir Anthropic kimlik doğrulama profiline sabitlendiği ancak Gateway’in
    bunu kendi kimlik doğrulama deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **Gateway ana makinesindeki** `~/.openclaw/.env` içine `ANTHROPIC_API_KEY` koyun.
      - Eksik profili zorlayan sabitlenmiş sırayı temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları Gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak kipte kimlik doğrulama profilleri dizüstü bilgisayarınızda değil Gateway makinesinde yaşar.

  </Accordion>

  <Accordion title="Neden Google Gemini’yi de deneyip başarısız oldu?">
    Model yapılandırmanız Google Gemini’yi geri dönüş olarak içeriyorsa (veya bir Gemini kısa adına geçtiyseniz), OpenClaw model geri dönüşü sırasında onu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: ya Google kimlik doğrulaması sağlayın ya da geri dönüş oraya yönlenmesin diye `agents.defaults.model.fallbacks` / takma adlar içinden Google modellerini kaldırın/kaçının.

    **LLM isteği reddedildi: thinking signature required (Google Antigravity)**

    Neden: oturum geçmişi **imzasız thinking blokları** içeriyor (çoğunlukla
    iptal edilmiş/kısmi bir akıştan). Google Antigravity, thinking blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız thinking bloklarını kaldırır. Hâlâ görünüyorsa **yeni bir oturum** başlatın veya o aracı için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: nedir ve nasıl yönetilir

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, belirteç depolama, çok hesaplı desenler)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Kimlik doğrulama profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şu konumda yaşar:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw, sağlayıcı önekli kimlikler kullanır, örneğin:

    - `anthropic:default` (e-posta kimliği olmadığında yaygındır)
    - OAuth kimlikleri için `anthropic:<email>`
    - seçtiğiniz özel kimlikler (ör. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi kimlik doğrulama profilinin deneneceğini denetleyebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı meta verileri ve sağlayıcı başına bir sıralamayı (`auth.order.<provider>`) destekler. Bu gizli bilgi saklamaz; kimlikleri sağlayıcı/kip ile eşler ve döndürme sırasını ayarlar.

    OpenClaw, bir profil kısa bir **bekleme süresindeyse** (hız sınırları/zaman aşımı/kimlik doğrulama hataları) veya daha uzun bir **devre dışı** durumdaysa (faturalama/yetersiz bakiye) geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` alanını kontrol edin. Ayarlama: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı bekleme süreleri model kapsamlı olabilir. Bir model için bekleme süresinde olan bir profil
    aynı sağlayıcıdaki kardeş bir model için yine de kullanılabilir olabilir,
    ancak faturalama/devre dışı pencereleri tüm profili engeller.

    CLI üzerinden aracı başına bir sıralama geçersiz kılması da ayarlayabilirsiniz (o aracının `auth-state.json` dosyasında saklanır):

    ```bash
    # Yapılandırılmış varsayılan aracıya varsayılandır (--agent çıkarılabilir)
    openclaw models auth order get --provider anthropic

    # Döndürmeyi tek bir profile kilitle (yalnızca bunu dene)
    openclaw models auth order set --provider anthropic anthropic:default

    # Veya açık bir sıra ayarla (sağlayıcı içinde geri dönüş)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Geçersiz kılmayı temizle (config auth.order / round-robin'e geri dön)
    openclaw models auth order clear --provider anthropic
    ```

    Belirli bir aracıyı hedeflemek için:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gerçekte neyin deneneceğini doğrulamak için şunu kullanın:

    ```bash
    openclaw models status --probe
    ```

    Saklanan bir profil açık sıranın dışında bırakılırsa probe,
    onu sessizce denemek yerine o profil için `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw her ikisini de destekler:

    - **OAuth** çoğu zaman abonelik erişiminden yararlanır (uygulanabildiği yerlerde).
    - **API anahtarları** token başına ödeme faturalandırması kullanır.

    Sihirbaz açıkça Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretme](/tr/concepts/model-failover)
