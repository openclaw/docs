---
read_when:
    - Modelleri seçme veya değiştirme, takma adları yapılandırma
    - Model failover / "All models failed" hata ayıklama
    - Kimlik doğrulama profillerini ve bunların nasıl yönetileceğini anlama
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçim, takma adlar, geçiş, failover ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-04-26T11:32:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  Model ve kimlik doğrulama profili SSS. Kurulum, oturumlar, gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, geçiş

  <AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw'ın varsayılan modeli, şu alanda ayarladığınız modeldir:

    ```
    agents.defaults.model.primary
    ```

    Modellere `provider/model` olarak başvurulur (örnek: `openai/gpt-5.5` veya `openai-codex/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra bu tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra kullanımdan kaldırılmış bir uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya fallback yapar. O sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, bayat kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele fallback yapar. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda bulunan en güçlü yeni nesil modeli kullanın.
    **Tool etkin veya güvenilmeyen girdiye sahip agent'lar için:** maliyet yerine model gücüne öncelik verin.
    **Rutin/düşük riskli sohbet için:** daha ucuz fallback modeller kullanın ve agent rolüne göre yönlendirin.

    MiniMax için ayrı docs vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Genel kural: yüksek riskli işler için karşılayabildiğiniz **en iyi modeli** kullanın, rutin sohbet veya özetler içinse daha ucuz
    bir model kullanın. Modelleri agent başına yönlendirebilir ve uzun görevleri
    paralelleştirmek için alt agent'lar kullanabilirsiniz (her alt agent token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Sub-agents](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı kuantize modeller, prompt injection ve güvenli olmayan davranışlara daha açıktır. Bkz. [Güvenlik](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Config'imi silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tüm config'i değiştirmekten kaçının.

    Güvenli seçenekler:

    - sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model config'ini günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` alanını düzenleyin

    Tüm config'i değiştirmek istemiyorsanız kısmi bir nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Lookup payload'u size normalize edilmiş yolu, sığ şema docs/kısıtlarını ve doğrudan alt özetleri verir.
    kısmi güncellemeler için.
    Config'in üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` komutunu yeniden çalıştırın.

    Dokümantasyon: [Modeller](/tr/concepts/models), [Configure](/tr/cli/configure), [Config](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri (llama.cpp, vLLM, Ollama) kullanabilir miyim?">
    Evet. Yerel modeller için en kolay yol Ollama'dır.

    En hızlı kurulum:

    1. `https://ollama.com/download` adresinden Ollama'yı kurun
    2. `ollama pull gemma4` gibi bir yerel model çekin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local`, size bulut modelleri ve yerel Ollama modellerinizi birlikte verir
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel çekme gerektirmez
    - elle geçiş için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun biçimde kuantize edilmiş modeller prompt
    injection'a daha açıktır. Tool kullanabilen tüm botlar için **büyük modelleri** kuvvetle öneririz.
    Yine de küçük modeller kullanmak istiyorsanız sandboxing ve sıkı tool allowlist'leri etkinleştirin.

    Dokümantasyon: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zamanla değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her gateway üzerindeki geçerli çalışma zamanı ayarını `openclaw models status` ile denetleyin.
    - Güvenliğe duyarlı/tool etkin agent'lar için mevcut en güçlü yeni nesil modeli kullanın.
  </Accordion>

  <Accordion title="Modelleri anında nasıl değiştiririm (yeniden başlatmadan)?">
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

    `/model` (ve `/model list`) kompakt, numaralı bir seçici gösterir. Numara ile seçin:

    ```
    /model 3
    ```

    Ayrıca sağlayıcı için belirli bir kimlik doğrulama profilini zorlayabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status`, hangi agent'ın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sıradaki hangi kimlik doğrulama profilinin deneneceğini gösterir.
    Ayrıca mevcutsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) da gösterir.

    **`@profile` ile ayarladığım profili nasıl sabitlemeden çıkarırım?**

    `/model` komutunu `@profile` son eki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi kimlik doğrulama profilinin etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.5, kodlama için Codex 5.5 kullanabilir miyim?">
    Evet. Birini varsayılan yapın, gerektiğinde geçiş yapın:

    - **Hızlı geçiş (oturum başına):** geçerli doğrudan OpenAI API anahtarı görevleri için `/model openai/gpt-5.5` veya GPT-5.5 Codex OAuth görevleri için `/model openai-codex/gpt-5.5`.
    - **Varsayılan:** API anahtarı kullanımı için `agents.defaults.model.primary` değerini `openai/gpt-5.5`, GPT-5.5 Codex OAuth kullanımı için `openai-codex/gpt-5.5` olarak ayarlayın.
    - **Sub-agents:** kodlama görevlerini farklı varsayılan modele sahip alt agent'lara yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash commands](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.5 için hızlı modu nasıl yapılandırırım?">
    Bir oturum anahtarı veya config varsayılanı kullanın:

    - **Oturum başına:** oturum `openai/gpt-5.5` veya `openai-codex/gpt-5.5` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` veya `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` değerini `true` yapın.

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

    OpenAI için hızlı mod, desteklenen yerel Responses isteklerinde `service_tier = "priority"` olarak eşlenir. Oturum `/fast` geçersiz kılmaları config varsayılanlarından üstündür.

    Bkz. [Thinking and fast mode](/tr/tools/thinking) ve [OpenAI fast mode](/tr/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Neden “Model ... is not allowed” görüp ardından yanıt almıyorum?'>
    `agents.defaults.models` ayarlanmışsa `/model` ve tüm
    oturum geçersiz kılmaları için **allowlist** haline gelir. Bu listede olmayan bir modeli seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Bu hata normal bir yanıt **yerine** döndürülür. Çözüm: modeli
    `agents.defaults.models` içine ekleyin, allowlist'i kaldırın veya `/model list` içinden bir model seçin.

  </Accordion>

  <Accordion title='Neden “Unknown model: minimax/MiniMax-M2.7” görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı config'i veya kimlik doğrulama
    profili bulunamadı), bu yüzden model çözümlenemiyor.

    Çözüm denetim listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynaktan `main` çalıştırın), sonra gateway'i yeniden başlatın.
    2. MiniMax'in yapılandırıldığından emin olun (sihirbaz veya JSON), ya da eşleşen sağlayıcının enjekte edilebilmesi için MiniMax kimlik doğrulamasının
       env/auth profillerinde bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya saklanmış MiniMax
       OAuth).
    3. Kimlik doğrulama yolunuz için tam model kimliğini (büyük/küçük harfe duyarlı) kullanın:
       API anahtarı kurulumu için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       ya da OAuth kurulumu için `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list`).

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="MiniMax'i varsayılan, OpenAI'yi karmaşık görevler için kullanabilir miyim?">
    Evet. **MiniMax'i varsayılan** olarak kullanın ve gerektiğinde modelleri **oturum başına** değiştirin.
    Fallback'ler **hatalar** içindir, "zor görevler" için değil; bu yüzden `/model` veya ayrı bir agent kullanın.

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

    Sonra:

    ```
    /model gpt
    ```

    **Seçenek B: ayrı agent'lar**

    - Agent A varsayılanı: MiniMax
    - Agent B varsayılanı: OpenAI
    - Agent'a göre yönlendirin veya geçmek için `/agent` kullanın

    Dokümantasyon: [Modeller](/tr/concepts/models), [Multi-Agent Routing](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısayolla gelir (yalnızca model `agents.defaults.models` içinde varsa uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API anahtarı kurulumları için `openai/gpt-5.5` veya Codex OAuth için yapılandırıldığında `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı adla kendi takma adınızı ayarlarsanız sizin değeriniz kazanır.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adları) nasıl tanımlarım/geçersiz kılarım?">
    Takma adlar `agents.defaults.models.<modelId>.alias` alanından gelir. Örnek:

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

    Sonrasında `/model sonnet` (veya destekleniyorsa `/<alias>`) bu model kimliğine çözülür.

  </Accordion>

  <Accordion title="OpenRouter veya Z.AI gibi diğer sağlayıcılardan modelleri nasıl eklerim?">
    OpenRouter (kullanım başına ödeme; çok sayıda model):

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

    Bir `provider/model` başvurusu yapıp gerekli sağlayıcı anahtarı eksikse çalışma zamanında bir kimlik doğrulama hatası alırsınız (ör. `No API key found for provider "zai"`).

    **Yeni bir agent ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni agent**'ın auth deposunun boş olduğu anlamına gelir. Kimlik doğrulama agent başınadır ve şurada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Çözüm seçenekleri:

    - `openclaw agents add <id>` çalıştırın ve sihirbaz sırasında kimlik doğrulamayı yapılandırın.
    - Veya `auth-profiles.json` dosyasını ana agent'ın `agentDir` dizininden yeni agent'ın `agentDir` dizinine kopyalayın.

    `agentDir` değerini agent'lar arasında yeniden kullanmayın; kimlik doğrulama/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model failover ve "All models failed"

<AccordionGroup>
  <Accordion title="Failover nasıl çalışır?">
    Failover iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model fallback**.

    Başarısız profillere cooldown uygulanır (üstel backoff), böylece OpenClaw bir sağlayıcı hız sınırına takıldığında veya geçici olarak hata verdiğinde bile yanıt vermeyi sürdürebilir.

    Hız sınırı kovası yalnızca düz `429` yanıtlarından ibaret değildir. OpenClaw ayrıca
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` ve dönemsel
    kullanım penceresi sınırlarını (`weekly/monthly limit reached`) da failover gerektiren
    hız sınırları olarak değerlendirir.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı
    `401` veya `403` üzerinde açık faturalandırma metni döndürürse OpenClaw bunu yine
    faturalandırma hattında tutabilir, ancak sağlayıcıya özgü metin eşleyiciler
    bunların sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Bir `402`
    iletisi bunun yerine yeniden denenebilir bir kullanım penceresi veya
    organization/workspace harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli faturalandırma devre dışı bırakması olarak değil,
    `rate_limit` olarak değerlendirir.

    Bağlam taşması hataları farklıdır: örneğin
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar model
    fallback'e ilerlemek yerine Compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni kasıtlı olarak "içinde unknown/error geçen her şey" kadar
    geniş değildir. OpenClaw, yine de sağlayıcı kapsamlı geçici biçimleri
    örneğin Anthropic'in yalın `An unknown error occurred`, OpenRouter'ın yalın
    `Provider returned error`, `Unhandled stop reason:
    error` gibi stop-reason hataları, geçici sunucu metni içeren JSON `api_error` payload'ları
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hatalarını sağlayıcı bağlamı
    eşleştiğinde failover gerektiren zaman aşımı/aşırı yük sinyalleri olarak değerlendirir.
    `LLM request failed with an unknown
    error.` gibi genel iç fallback metni daha muhafazakâr kalır ve tek başına model fallback'i tetiklemez.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” ne anlama gelir?'>
    Bu, sistemin `anthropic:default` kimlik doğrulama profil kimliğini kullanmaya çalıştığı, ancak beklenen auth deposunda bunun için kimlik bilgisi bulamadığı anlamına gelir.

    **Çözüm denetim listesi:**

    - **Kimlik doğrulama profillerinin nerede yaşadığını doğrulayın** (yeni ve eski yollar)
      - Güncel: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Gateway'in env değişkeninizi yüklediğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini kabuğunuzda ayarladıysanız ama Gateway'i systemd/launchd ile çalıştırıyorsanız bunu devralmayabilir. Bunu `~/.openclaw/.env` içine koyun veya `env.shellEnv` özelliğini etkinleştirin.
    - **Doğru agent'ı düzenlediğinizden emin olun**
      - Çoklu agent kurulumları, birden fazla `auth-profiles.json` dosyası olabileceği anlamına gelir.
    - **Model/auth durumunu temel düzeyde doğrulayın**
      - Yapılandırılmış modelleri ve sağlayıcıların kimliği doğrulanmış olup olmadığını görmek için `openclaw models status` kullanın.

    **“No credentials found for profile anthropic” için çözüm denetim listesi**

    Bu, çalıştırmanın bir Anthropic kimlik doğrulama profiline sabitlendiği, ancak Gateway'in
    bunu auth deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **gateway ana makinesinde** `ANTHROPIC_API_KEY` değerini `~/.openclaw/.env` içine koyun.
      - Eksik bir profili zorlayan sabitlenmiş sıralamayı temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak modda kimlik doğrulama profilleri dizüstü bilgisayarınızda değil, gateway makinesinde bulunur.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de denedi ve başarısız oldu?">
    Model config'iniz Google Gemini'yi fallback olarak içeriyorsa (veya bir Gemini kısayoluna geçtiyseniz), OpenClaw model fallback sırasında bunu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Çözüm: ya Google auth sağlayın ya da fallback'in oraya yönelmemesi için `agents.defaults.model.fallbacks` / takma adlar içindeki Google modellerini kaldırın/kaçının.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Neden: oturum geçmişi **imzasız thinking blokları** içeriyor (genellikle
    yarıda kesilmiş/kısmi bir akıştan). Google Antigravity, thinking blokları için imza gerektirir.

    Çözüm: OpenClaw artık Google Antigravity Claude için imzasız thinking bloklarını temizler. Yine de görünüyorsa **yeni bir oturum** başlatın veya bu agent için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: nedirler ve nasıl yönetilirler

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token depolama, çok hesaplı kalıplar)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Kimlik doğrulama profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada bulunur:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw, sağlayıcı önekli kimlikler kullanır:

    - `anthropic:default` (e-posta kimliği olmadığında yaygın)
    - OAuth kimlikleri için `anthropic:<email>`
    - seçtiğiniz özel kimlikler (örn. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi kimlik doğrulama profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Config, profiller için isteğe bağlı metadata ve sağlayıcı başına bir sıralama (`auth.order.<provider>`) destekler. Bu **sırları** saklamaz; kimlikleri sağlayıcı/mod ile eşler ve rotasyon sırasını ayarlar.

    OpenClaw, kısa bir **cooldown** (hız sınırları/zaman aşımları/kimlik doğrulama hataları) veya daha uzun bir **disabled** durumu (faturalandırma/yetersiz kredi) içindeyse bir profili geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` alanına bakın. Ayarlama için: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı cooldown'ları model kapsamlı olabilir. Bir profil, bir model için
    cooldown içindeyken aynı sağlayıcıdaki kardeş bir model için hâlâ kullanılabilir olabilir,
    ancak faturalandırma/devre dışı pencereleri yine tüm profili engeller.

    Ayrıca CLI üzerinden bir **agent başına** sıralama geçersiz kılması da ayarlayabilirsiniz (`auth-state.json` içinde o agent için saklanır):

    ```bash
    # Yapılandırılmış varsayılan agent'ı kullanır (--agent atlanabilir)
    openclaw models auth order get --provider anthropic

    # Rotasyonu tek bir profile kilitle (yalnızca bunu dene)
    openclaw models auth order set --provider anthropic anthropic:default

    # Veya açık bir sıra ayarla (sağlayıcı içinde fallback)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Geçersiz kılmayı temizle (config auth.order / round-robin değerine fallback yap)
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

    Saklanan bir profil açık sıradan çıkarılırsa probe,
    bunu sessizce denemek yerine o profil için `excluded_by_auth_order`
    bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw her ikisini de destekler:

    - **OAuth** çoğu zaman abonelik erişiminden yararlanır (uygulanabildiği yerde).
    - **API anahtarları** token başına faturalandırma kullanır.

    Sihirbaz açıkça Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model failover](/tr/concepts/model-failover)
