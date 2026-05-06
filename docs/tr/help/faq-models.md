---
read_when:
    - Modelleri seçme veya değiştirme, takma adları yapılandırma
    - Model yük devretmede hata ayıklama / "Tüm modeller başarısız oldu"
    - Kimlik doğrulama profillerini anlama ve bunları yönetme
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçim, takma adlar, geçiş, yük devretme ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-05-06T09:16:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8f6d367cf22b9035f75ffcfa641008a015d78b727c4b3d67730fd5286520fb4
    source_path: help/faq-models.md
    workflow: 16
---

  Model ve auth-profile SSS. Kurulum, oturumlar, gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, geçiş

  <AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw'ın varsayılan modeli, şu şekilde ayarladığınız modeldir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` olarak referanslanır (örnek: `openai/gpt-5.5` veya `openai-codex/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, ardından tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra, kullanımdan kaldırılmış uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski ve kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/model çiftine geri döner. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda bulunan en güçlü son nesil modeli kullanın.
    **Araç etkinleştirilmiş veya güvenilmeyen girdili ajanlar için:** maliyet yerine model gücüne öncelik verin.
    **Rutin/düşük riskli sohbet için:** daha ucuz yedek modeller kullanın ve ajan rolüne göre yönlendirin.

    MiniMax'in kendi belgeleri vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Genel kural: yüksek riskli işler için **karşılayabileceğiniz en iyi modeli**, rutin sohbet veya özetler için daha ucuz
    bir modeli kullanın. Modelleri ajan başına yönlendirebilir ve uzun görevleri paralelleştirmek için alt ajanlar kullanabilirsiniz
    (her alt ajan token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Alt ajanlar](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı nicemlenmiş modeller prompt
    injection ve güvenli olmayan davranışlara daha açıktır. Bkz. [Güvenlik](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modeller arasında nasıl geçiş yaparım?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değiştirmelerinden kaçının.

    Güvenli seçenekler:

    - Sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` değerini düzenleyin

    Tüm yapılandırmayı değiştirmeyi amaçlamıyorsanız kısmi bir nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Lookup yükü size normalleştirilmiş yolu, yüzeysel şema belgelerini/kısıtlarını ve anlık alt öğe özetlerini verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` komutunu yeniden çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Yapılandır](/tr/cli/configure), [Yapılandırma](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri kullanabilir miyim (llama.cpp, vLLM, Ollama)?">
    Evet. Yerel modeller için en kolay yol Ollama'dır.

    En hızlı kurulum:

    1. Ollama'yı `https://ollama.com/download` adresinden kurun
    2. `ollama pull gemma4` gibi bir yerel model indirin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local`, size bulut modellerini ve yerel Ollama modellerinizi sağlar
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel indirme gerektirmez
    - manuel geçiş için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun nicemlenmiş modeller prompt
    injection'a daha açıktır. Araç kullanabilen herhangi bir bot için **büyük modelleri** güçlü şekilde öneririz.
    Yine de küçük modeller istiyorsanız sandboxing'i ve sıkı araç izin listelerini etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanır?">
    - Bu dağıtımlar farklılık gösterebilir ve zamanla değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her gateway üzerinde geçerli çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenliğe duyarlı/araç etkinleştirilmiş ajanlar için mevcut en güçlü son nesil modeli kullanın.

  </Accordion>

  <Accordion title="Modeller arasında anında nasıl geçiş yaparım (yeniden başlatmadan)?">
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

    Sağlayıcı için belirli bir auth profile'ı da zorunlu kılabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status`, hangi ajanın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sıradaki denenecek auth profile'ı gösterir.
    Ayrıca varsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) gösterir.

    **@profile ile ayarladığım bir profil sabitlemesini nasıl kaldırırım?**

    `/model` komutunu `@profile` soneki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi auth profile'ın etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.5, kodlama için Codex 5.5 kullanabilir miyim?">
    Evet. Model seçimini ve çalışma zamanı seçimini ayrı ele alın:

    - **Yerel Codex kodlama ajanı:** `agents.defaults.model.primary` değerini `openai/gpt-5.5`, `agents.defaults.agentRuntime.id` değerini `"codex"` olarak ayarlayın. ChatGPT/Codex abonelik kimlik doğrulamasını kullanmak istediğinizde `openclaw models auth login --provider openai-codex` ile oturum açın.
    - **PI üzerinden doğrudan OpenAI API görevleri:** Codex çalışma zamanı geçersiz kılması olmadan `/model openai/gpt-5.5` kullanın ve `OPENAI_API_KEY` yapılandırın.
    - **PI üzerinden Codex OAuth:** yalnızca Codex OAuth ile normal PI çalıştırıcısını özellikle istediğinizde `/model openai-codex/gpt-5.5` kullanın.
    - **Alt ajanlar:** kodlama görevlerini kendi modeli ve `agentRuntime` varsayılanı olan yalnızca Codex'e özel bir ajana yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.5 için hızlı modu nasıl yapılandırırım?">
    Bir oturum anahtarı veya yapılandırma varsayılanı kullanın:

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

    OpenAI için hızlı mod, desteklenen yerel Responses isteklerinde `service_tier = "priority"` ile eşleşir. Oturum `/fast` geçersiz kılmaları yapılandırma varsayılanlarının önüne geçer.

    Bkz. [Düşünme ve hızlı mod](/tr/tools/thinking) ve [OpenAI hızlı mod](/tr/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Neden “Model ... is not allowed” görüyorum ve sonra yanıt alamıyorum?'>
    `agents.defaults.models` ayarlanmışsa, `/model` ve tüm
    oturum geçersiz kılmaları için **izin listesi** olur. Bu listede olmayan bir model seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Bu hata normal bir yanıt **yerine** döndürülür. Düzeltme: modeli
    `agents.defaults.models` içine ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.
    Komut ayrıca `--runtime codex` içeriyorsa önce modeli ekleyin ve ardından aynı
    `/model provider/model --runtime codex` komutunu yeniden deneyin.

  </Accordion>

  <Accordion title='Neden “Unknown model: minimax/MiniMax-M2.7” görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya auth
    profile bulunamadı), bu nedenle model çözümlenemez.

    Düzeltme kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` üzerinden çalıştırın), ardından gateway'i yeniden başlatın.
    2. MiniMax'in yapılandırıldığından (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için env/auth profillerinde MiniMax kimlik doğrulamasının
       bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya depolanmış MiniMax
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

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="MiniMax'i varsayılan, OpenAI'ı karmaşık görevler için kullanabilir miyim?">
    Evet. **Varsayılan olarak MiniMax** kullanın ve gerektiğinde modelleri **oturum başına** değiştirin.
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
    - Ajanla yönlendirin veya geçiş yapmak için `/agent` kullanın

    Belgeler: [Modeller](/tr/concepts/models), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısa adla gelir (yalnızca model `agents.defaults.models` içinde mevcut olduğunda uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API anahtarı kurulumları için `openai/gpt-5.5`, Codex OAuth için yapılandırıldığında ise `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı adla kendi takma adınızı ayarlarsanız sizin değeriniz geçerli olur.

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

    Bir sağlayıcıya/modele başvurur ancak gerekli sağlayıcı anahtarı eksik olursa, çalışma zamanı kimlik doğrulama hatası alırsınız (ör. `No API key found for provider "zai"`).

    **Yeni bir ajan ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni ajanın** boş bir kimlik doğrulama deposu olduğu anlamına gelir. Kimlik doğrulama ajan bazındadır ve
    şurada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` komutunu çalıştırın ve sihirbaz sırasında kimlik doğrulamayı yapılandırın.
    - Veya ana ajanın kimlik doğrulama deposundan yeni ajanın kimlik doğrulama deposuna yalnızca taşınabilir statik `api_key` / `token` profillerini kopyalayın.
    - OAuth profilleri için, yeni ajanın kendi hesabına ihtiyacı olduğunda yeni ajandan oturum açın; aksi halde OpenClaw, yenileme belirteçlerini klonlamadan varsayılan/ana ajan üzerinden okuyabilir.

    Ajanlar arasında `agentDir` değerini **yeniden kullanmayın**; bu kimlik doğrulama/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model yük devretmesi ve "Tüm modeller başarısız oldu"

<AccordionGroup>
  <Accordion title="Yük devretme nasıl çalışır?">
    Yük devretme iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model yedeğine geçiş**.

    Hatalı profillere bekleme süreleri uygulanır (üstel geri çekilme), böylece OpenClaw bir sağlayıcı hız sınırına takıldığında veya geçici olarak hata verdiğinde bile yanıt vermeye devam edebilir.

    Hız sınırı kovası yalnızca düz `429` yanıtlarından daha fazlasını içerir. OpenClaw
    ayrıca `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` gibi iletileri ve dönemsel
    kullanım penceresi sınırlarını (`weekly/monthly limit reached`) yük devretmeye uygun
    hız sınırları olarak değerlendirir.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı `401` veya `403` üzerinde
    açık faturalandırma metni döndürürse, OpenClaw bunu yine de
    faturalandırma hattında tutabilir, ancak sağlayıcıya özgü metin eşleştiricileri
    onları sahiplenen sağlayıcı kapsamıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Bir `402`
    iletisi bunun yerine yeniden denenebilir bir kullanım penceresi veya
    kuruluş/çalışma alanı harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli bir faturalandırma devre dışı bırakması olarak değil,
    `rate_limit` olarak değerlendirir.

    Bağlam taşması hataları farklıdır: `request_too_large`,
    `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar, model yedeğine geçmek yerine compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni, bilerek "içinde unknown/error geçen her şeyden"
    daha dardır. OpenClaw; Anthropic çıplak `An unknown error occurred`, OpenRouter çıplak
    `Provider returned error`, `Unhandled stop reason:
    error` gibi durdurma nedeni hataları, geçici sunucu metni içeren JSON `api_error` yükleri
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hataları gibi sağlayıcı kapsamlı geçici şekilleri,
    sağlayıcı bağlamı eşleştiğinde
    yük devretmeye uygun zaman aşımı/aşırı yük sinyalleri olarak değerlendirir.
    `LLM request failed with an unknown
    error.` gibi genel dahili yedek metinler muhafazakar kalır ve tek başına model yedeğine geçişi tetiklemez.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” ne anlama gelir?'>
    Bu, sistemin `anthropic:default` kimlik doğrulama profili kimliğini kullanmaya çalıştığı, ancak beklenen kimlik doğrulama deposunda bunun için kimlik bilgileri bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Kimlik doğrulama profillerinin nerede yaşadığını doğrulayın** (yeni ve eski yollar)
      - Güncel: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini kabuğunuzda ayarladıysanız ancak Gateway'i systemd/launchd üzerinden çalıştırıyorsanız, bunu devralmayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` değerini etkinleştirin.
    - **Doğru ajanı düzenlediğinizden emin olun**
      - Çok ajanlı kurulumlarda birden fazla `auth-profiles.json` dosyası olabilir.
    - **Model/kimlik doğrulama durumunu mantık kontrolünden geçirin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimlik doğrulamasından geçip geçmediğini görmek için `openclaw models status` kullanın.

    **"No credentials found for profile anthropic" için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic kimlik doğrulama profiline sabitlendiği, ancak Gateway'in
    bunu kimlik doğrulama deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` komutunu çalıştırın.
    - **Bunun yerine bir API anahtarı kullanmak istiyorsanız**
      - **Gateway ana makinesinde** `~/.openclaw/.env` içine `ANTHROPIC_API_KEY` koyun.
      - Eksik bir profili zorlayan sabitlenmiş sıraları temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları Gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak modda kimlik doğrulama profilleri dizüstü bilgisayarınızda değil, Gateway makinesinde yaşar.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de deneyip başarısız oldu?">
    Model yapılandırmanız Google Gemini'yi yedek olarak içeriyorsa (veya bir Gemini kısaltmasına geçtiyseniz), OpenClaw model yedeğine geçiş sırasında onu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: ya Google kimlik doğrulaması sağlayın ya da yedek geçişin oraya yönlenmemesi için `agents.defaults.model.fallbacks` / takma adlar içindeki Google modellerini kaldırın/önleyin.

    **LLM isteği reddedildi: düşünme imzası gerekli (Google Antigravity)**

    Neden: oturum geçmişi **imzasız düşünme blokları** içeriyor (genellikle
    iptal edilmiş/kısmi bir akıştan). Google Antigravity, düşünme blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız düşünme bloklarını çıkarır. Hala görünüyorsa, **yeni bir oturum** başlatın veya o agent için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: bunlar nedir ve nasıl yönetilir

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token depolama, çoklu hesap desenleri)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Kimlik doğrulama profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada bulunur:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Kaydedilmiş profilleri sırları dökmeden incelemek için `openclaw models auth list` çalıştırın (isteğe bağlı olarak `--provider <id>` veya `--json`). Ayrıntılar için [Models CLI](/tr/cli/models#auth-profiles) bölümüne bakın.

  </Accordion>

  <Accordion title="Tipik profil ID'leri nelerdir?">
    OpenClaw şu şekilde sağlayıcı önekli ID'ler kullanır:

    - `anthropic:default` (e-posta kimliği olmadığında yaygındır)
    - OAuth kimlikleri için `anthropic:<email>`
    - seçtiğiniz özel ID'ler (örn. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi kimlik doğrulama profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı metadata'yı ve sağlayıcı başına sıralamayı (`auth.order.<provider>`) destekler. Bu, sırları saklamaz; ID'leri sağlayıcı/mod ile eşler ve döndürme sırasını ayarlar.

    OpenClaw, kısa bir **cooldown** durumundaysa (hız limitleri/zaman aşımları/kimlik doğrulama hataları) veya daha uzun bir **disabled** durumundaysa (faturalandırma/yetersiz kredi) bir profili geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` öğesini kontrol edin. Ayar: `auth.cooldowns.billingBackoffHours*`.

    Hız limiti cooldown'ları model kapsamlı olabilir. Bir model için cooldown'da olan bir profil, aynı sağlayıcıdaki kardeş bir model için hâlâ kullanılabilir olabilir; faturalandırma/disabled pencereleri ise yine de tüm profili engeller.

    CLI üzerinden ayrıca **agent başına** bir sıra geçersiz kılması ayarlayabilirsiniz (o agent'ın `auth-state.json` dosyasında saklanır):

    ```bash
    # Yapılandırılmış varsayılan agent'a varsayılan olur (--agent atlayın)
    openclaw models auth order get --provider anthropic

    # Döndürmeyi tek bir profile kilitle (yalnızca bunu dene)
    openclaw models auth order set --provider anthropic anthropic:default

    # Veya açık bir sıra ayarla (sağlayıcı içinde yedek geçiş)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Geçersiz kılmayı temizle (config auth.order / round-robin'e geri dön)
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

    Saklanan bir profil açık sıradan çıkarılırsa, probe bu profili sessizce denemek yerine
    o profil için `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth** genellikle abonelik erişiminden yararlanır (uygun olduğunda).
    - **API anahtarları** token başına ödeme faturalandırmasını kullanır.

    Sihirbaz Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yedek geçişi](/tr/concepts/model-failover)
