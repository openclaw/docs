---
read_when:
    - Modelleri seçme veya değiştirme, takma adları yapılandırma
    - Model yük devretme / "Tüm modeller başarısız oldu" hatasında hata ayıklama
    - Kimlik doğrulama profillerini anlama ve yönetme
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçimi, takma adları, geçiş, yük devretme ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-05-10T19:40:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62ff4ee6f455e9b8786d79b71dc9be53e650afbe177e3d467665aa407cadfdfd
    source_path: help/faq-models.md
    workflow: 16
---

  Model ve kimlik doğrulama profili SSS. Kurulum, oturumlar, gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) bölümüne bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, geçiş yapma

  <AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw'ın varsayılan modeli, şu şekilde ayarladığınız değerdir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` olarak başvurulur (örnek: `openai/gpt-5.5` veya `anthropic/claude-sonnet-4-6`). Sağlayıcıyı belirtmezseniz OpenClaw önce bir takma adı, ardından tam model id için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra kullanımdan kaldırılmış uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski ve kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda mevcut olan en güçlü son nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdili agent'lar için:** maliyet yerine model gücüne öncelik verin.
    **Rutin/düşük riskli sohbet için:** daha ucuz yedek modeller kullanın ve agent rolüne göre yönlendirin.

    MiniMax'in kendi dokümanları vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Genel kural: yüksek riskli işler için **karşılayabileceğiniz en iyi modeli**, rutin sohbet veya özetler içinse daha ucuz
    bir modeli kullanın. Modelleri agent başına yönlendirebilir ve uzun görevleri paralelleştirmek için alt agent'ları
    kullanabilirsiniz (her alt agent token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Alt agent'lar](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı kuantize modeller prompt
    injection ve güvenli olmayan davranışlara karşı daha savunmasızdır. Bkz. [Güvenlik](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değiştirmelerinden kaçının.

    Güvenli seçenekler:

    - Sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` değerini düzenleme

    Tüm yapılandırmayı değiştirmek istemiyorsanız kısmi bir nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Arama yükü size normalleştirilmiş yolu, sığ şema dokümanlarını/kısıtlarını ve doğrudan alt özetleri verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` komutunu yeniden çalıştırın.

    Dokümanlar: [Modeller](/tr/concepts/models), [Yapılandır](/tr/cli/configure), [Yapılandırma](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri (llama.cpp, vLLM, Ollama) kullanabilir miyim?">
    Evet. Ollama, yerel modeller için en kolay yoldur.

    En hızlı kurulum:

    1. Ollama'yı `https://ollama.com/download` adresinden yükleyin
    2. `ollama pull gemma4` gibi yerel bir modeli indirin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local`, bulut modellerinin yanı sıra yerel Ollama modellerinizi de sağlar
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel bir indirme gerektirmez
    - elle geçiş yapmak için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun biçimde kuantize edilmiş modeller prompt
    injection'a karşı daha savunmasızdır. Araç kullanabilen herhangi bir bot için **büyük modelleri** önemle öneririz.
    Yine de küçük modeller kullanmak istiyorsanız sandboxing ve sıkı araç izin listelerini etkinleştirin.

    Dokümanlar: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanır?">
    - Bu dağıtımlar farklılık gösterebilir ve zaman içinde değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her gateway üzerindeki geçerli çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenlik açısından hassas/araç etkin agent'lar için mevcut en güçlü son nesil modeli kullanın.

  </Accordion>

  <Accordion title="Yeniden başlatmadan anında modeller arasında nasıl geçiş yaparım?">
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

    `/model` (ve `/model list`) kompakt, numaralı bir seçici gösterir. Numarayla seçin:

    ```
    /model 3
    ```

    Sağlayıcı için belirli bir kimlik doğrulama profilini de zorunlu kılabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status` hangi agent'ın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sırada hangi kimlik doğrulama profilinin deneneceğini gösterir.
    Ayrıca kullanılabilir olduğunda yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) gösterir.

    **@profile ile ayarladığım bir profil sabitlemesini nasıl kaldırırım?**

    `/model` komutunu `@profile` soneki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız bunu `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi kimlik doğrulama profilinin etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.5 ve kodlama için Codex 5.5 kullanabilir miyim?">
    Evet. Model seçimini ve çalışma zamanı seçimini ayrı ele alın:

    - **Yerel Codex kodlama aracı:** `agents.defaults.model.primary` değerini `openai/gpt-5.5` olarak ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması istediğinizde `openclaw models auth login --provider openai-codex` ile oturum açın.
    - **Aracı döngüsü dışındaki doğrudan OpenAI API görevleri:** görseller, embeddings, konuşma, realtime ve diğer aracı dışı OpenAI API yüzeyleri için `OPENAI_API_KEY` yapılandırın.
    - **OpenAI aracı API anahtarı kimlik doğrulaması:** sıralı bir `openai-codex` API anahtarı profiliyle `/model openai/gpt-5.5` kullanın.
    - **Alt aracılar:** kodlama görevlerini kendi `openai/gpt-5.5` modeli olan Codex odaklı bir aracıya yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.5 için hızlı modu nasıl yapılandırırım?">
    Bir oturum anahtarı veya bir yapılandırma varsayılanı kullanın:

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

    OpenAI için hızlı mod, desteklenen yerel Responses isteklerinde `service_tier = "priority"` değerine eşlenir. Oturum `/fast` geçersiz kılmaları, yapılandırma varsayılanlarına üstün gelir.

    Bkz. [Düşünme ve hızlı mod](/tr/tools/thinking) ve [OpenAI hızlı mod](/tr/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='"Model ... is not allowed" ifadesini neden görüyorum ve ardından neden yanıt gelmiyor?'>
    `agents.defaults.models` ayarlanmışsa, `/model` ve tüm oturum geçersiz kılmaları için **izin listesi** haline gelir. Bu listede olmayan bir model seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Bu hata normal bir yanıtın **yerine** döndürülür. Düzeltme: tam modeli
    `agents.defaults.models` içine ekleyin, dinamik sağlayıcı katalogları için `"provider/*": {}` gibi bir sağlayıcı joker karakteri ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.
    Komut ayrıca `--runtime codex` içeriyorsa, önce izin listesini güncelleyin ve ardından aynı `/model provider/model --runtime codex` komutunu yeniden deneyin.

  </Accordion>

  <Accordion title='"Unknown model: minimax/MiniMax-M2.7" ifadesini neden görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya kimlik doğrulama
    profili bulunamadı), bu nedenle model çözümlenemez.

    Düzeltme kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` üzerinden çalıştırın), ardından gateway'i yeniden başlatın.
    2. MiniMax'in yapılandırıldığından (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için env/auth profillerinde MiniMax kimlik doğrulamasının
       bulunduğundan emin olun
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

       ve listeden seçim yapın (veya sohbette `/model list`).

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="MiniMax'i varsayılanım ve OpenAI'ı karmaşık görevler için kullanabilir miyim?">
    Evet. **MiniMax'i varsayılan** olarak kullanın ve gerektiğinde **oturum başına** model değiştirin.
    Yedekler "zor görevler" için değil, **hatalar** içindir; bu nedenle `/model` veya ayrı bir aracı kullanın.

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

    **Seçenek B: ayrı aracılar**

    - Aracı A varsayılanı: MiniMax
    - Aracı B varsayılanı: OpenAI
    - Aracıya göre yönlendirin veya geçiş yapmak için `/agent` kullanın

    Belgeler: [Modeller](/tr/concepts/models), [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısa adla gelir (yalnızca model `agents.defaults.models` içinde mevcut olduğunda uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı ada sahip kendi alias'ınızı ayarlarsanız, sizin değeriniz geçerli olur.

  </Accordion>

  <Accordion title="Model kısayollarını (alias'ları) nasıl tanımlar/geçersiz kılarım?">
    Alias'lar `agents.defaults.models.<modelId>.alias` kaynağından gelir. Örnek:

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

    Bir sağlayıcıya/modele başvurursanız ancak gerekli sağlayıcı anahtarı eksikse, çalışma zamanı kimlik doğrulama hatası alırsınız (ör. `No API key found for provider "zai"`).

    **Yeni bir agent ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni agent** için kimlik doğrulama deposunun boş olduğu anlamına gelir. Kimlik doğrulama agent başınadır ve
    burada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` komutunu çalıştırın ve sihirbaz sırasında kimlik doğrulamayı yapılandırın.
    - Ya da yalnızca taşınabilir statik `api_key` / `token` profillerini ana agent'ın kimlik doğrulama deposundan yeni agent'ın kimlik doğrulama deposuna kopyalayın.
    - OAuth profilleri için, yeni agent kendi hesabına ihtiyaç duyduğunda oradan oturum açın; aksi takdirde OpenClaw yenileme tokenlarını klonlamadan varsayılan/ana agent üzerinden okuyabilir.

    `agentDir` değerini agent'lar arasında yeniden kullanmayın; kimlik doğrulama/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model devretmesi ve "Tüm modeller başarısız oldu"

<AccordionGroup>
  <Accordion title="Devretme nasıl çalışır?">
    Devretme iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model yedeklemesi**.

    Başarısız profillere soğuma süreleri uygulanır (üstel geri çekilme), böylece bir sağlayıcı hız sınırına takılsa veya geçici olarak başarısız olsa bile OpenClaw yanıt vermeye devam edebilir.

    Hız sınırı kovası düz `429` yanıtlarından fazlasını içerir. OpenClaw
    ayrıca `Too many concurrent requests`, `ThrottlingException`,
    `concurrency limit reached`, `workers_ai ... quota limit exceeded`,
    `resource exhausted` gibi iletileri ve periyodik kullanım penceresi
    sınırlarını (`weekly/monthly limit reached`) devretmeye değer hız sınırları
    olarak ele alır.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı `401` veya `403` üzerinde
    açık faturalandırma metni döndürürse, OpenClaw bunu yine de faturalandırma
    yolunda tutabilir, ancak sağlayıcıya özgü metin eşleştiriciler bunların
    sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Bir `402`
    iletisi bunun yerine yeniden denenebilir bir kullanım penceresi veya
    kuruluş/çalışma alanı harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli
    faturalandırma devre dışı bırakması olarak değil, `rate_limit` olarak ele alır.

    Bağlam taşması hataları farklıdır: `request_too_large`,
    `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar, model yedeklemesine ilerlemek yerine
    Compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni, kasıtlı olarak "içinde unknown/error geçen her
    şey"den daha dardır. OpenClaw, sağlayıcı bağlamı eşleştiğinde Anthropic yalın
    `An unknown error occurred`, OpenRouter yalın `Provider returned error`,
    `Unhandled stop reason: error` gibi durdurma nedeni hataları, geçici sunucu
    metni içeren JSON `api_error` yükleri (`internal server error`,
    `unknown error, 520`, `upstream error`, `backend error`) ve
    `ModelNotReadyException` gibi sağlayıcı meşgul hataları gibi sağlayıcı
    kapsamlı geçici biçimleri devretmeye değer zaman aşımı/aşırı yük sinyalleri
    olarak ele alır.
    `LLM request failed with an unknown error.` gibi genel dahili yedek metni
    temkinli kalır ve tek başına model yedeklemesini tetiklemez.

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default" ne anlama gelir?'>
    Bu, sistemin `anthropic:default` kimlik doğrulama profili kimliğini kullanmaya çalıştığı, ancak beklenen kimlik doğrulama deposunda bunun için kimlik bilgileri bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Kimlik doğrulama profillerinin nerede bulunduğunu doğrulayın** (yeni ve eski yollar)
      - Güncel: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından geçirilir)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini kabuğunuzda ayarladıysanız ancak Gateway'i systemd/launchd üzerinden çalıştırıyorsanız, bunu miras almayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` değerini etkinleştirin.
    - **Doğru agent'ı düzenlediğinizden emin olun**
      - Çok agent'lı kurulumlarda birden fazla `auth-profiles.json` dosyası olabilir.
    - **Model/kimlik doğrulama durumunu hızlıca kontrol edin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimliğinin doğrulanıp doğrulanmadığını görmek için `openclaw models status` kullanın.

    **"No credentials found for profile anthropic" için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic kimlik doğrulama profiline sabitlendiği, ancak Gateway'in
    bunu kimlik doğrulama deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **Gateway ana makinesinde** `ANTHROPIC_API_KEY` değerini `~/.openclaw/.env` içine koyun.
      - Eksik bir profili zorlayan sabitlenmiş sıralamaları temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları Gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak modda kimlik doğrulama profilleri dizüstü bilgisayarınızda değil, Gateway makinesinde bulunur.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de deneyip başarısız oldu?">
    Model yapılandırmanız Google Gemini'yi yedek olarak içeriyorsa (veya Gemini kısayoluna geçtiyseniz), OpenClaw model yedeklemesi sırasında bunu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: Google kimlik doğrulaması sağlayın veya yedeklemenin oraya yönlenmemesi için Google modellerini `agents.defaults.model.fallbacks` / takma adlarından kaldırın ya da bunlardan kaçının.

    **LLM isteği reddedildi: düşünme imzası gerekli (Google Antigravity)**

    Neden: oturum geçmişi **imzasız düşünme blokları** içeriyor (çoğunlukla
    iptal edilmiş/kısmi bir akıştan). Google Antigravity düşünme blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız düşünme bloklarını kaldırır. Hala görünüyorsa, **yeni bir oturum** başlatın veya o agent için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: nedir ve nasıl yönetilir?

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token saklama, çok hesaplı desenler)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Kimlik doğrulama profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller burada bulunur:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Kaydedilmiş profilleri gizli bilgileri dökmeden incelemek için `openclaw models auth list` çalıştırın (isteğe bağlı olarak `--provider <id>` veya `--json`). Ayrıntılar için [Models CLI](/tr/cli/models#auth-profiles) sayfasına bakın.

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw şu gibi sağlayıcı önekli kimlikler kullanır:

    - `anthropic:default` (e-posta kimliği olmadığında yaygın)
    - OAuth kimlikleri için `anthropic:<email>`
    - Seçtiğiniz özel kimlikler (ör. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi kimlik doğrulama profilinin deneneceğini denetleyebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı meta verileri ve sağlayıcı başına bir sıralamayı (`auth.order.<provider>`) destekler. Bu, gizli bilgi saklamaz; kimlikleri sağlayıcı/mod ile eşler ve rotasyon sırasını ayarlar.

    OpenClaw, kısa bir **soğuma** durumundaysa (hız sınırları/zaman aşımları/kimlik doğrulama hataları) veya daha uzun bir **devre dışı** durumdaysa (faturalandırma/yetersiz kredi) bir profili geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` değerini kontrol edin. Ayar: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı soğumaları model kapsamlı olabilir. Bir model için soğumada olan
    bir profil, aynı sağlayıcıdaki kardeş bir model için hâlâ kullanılabilir
    olabilir; faturalandırma/devre dışı pencereleri ise tüm profili engellemeye
    devam eder.

    CLI üzerinden **agent başına** bir sıra geçersiz kılması da ayarlayabilirsiniz (o agent'ın `auth-state.json` dosyasında saklanır):

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

    Belirli bir agent'ı hedeflemek için:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gerçekte neyin deneneceğini doğrulamak için şunu kullanın:

    ```bash
    openclaw models status --probe
    ```

    Saklanan bir profil açık sıradan çıkarılmışsa, probe bunu sessizce denemek
    yerine o profil için `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth** çoğu zaman abonelik erişiminden yararlanır (geçerli olduğu yerlerde).
    - **API anahtarları** token başına ödeme faturalandırması kullanır.

    Sihirbaz Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model devretmesi](/tr/concepts/model-failover)
