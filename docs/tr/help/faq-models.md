---
read_when:
    - Model seçme veya değiştirme, takma adları yapılandırma
    - Model yük devretme / "Tüm modeller başarısız oldu" hatalarını ayıklama
    - Kimlik doğrulama profillerini ve bunların nasıl yönetileceğini anlama
sidebarTitle: Models FAQ
summary: 'SSS: model varsayılanları, seçimi, takma adları, model değiştirme, yük devretme ve kimlik doğrulama profilleri'
title: 'SSS: modeller ve kimlik doğrulama'
x-i18n:
    generated_at: "2026-07-12T12:20:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Model ve kimlik doğrulama profili soru-cevapları. Kurulum, oturumlar, gateway, kanallar ve
  sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Modeller: varsayılanlar, seçim, takma adlar, geçiş

  <AccordionGroup>
  <Accordion title='"Varsayılan model" nedir?'>
    Şununla ayarlanır:

    ```text
    agents.defaults.model.primary
    ```

    Modeller `provider/model` başvurularıdır (örnek: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). `provider/model` değerini her zaman açıkça ayarlayın.
    Sağlayıcıyı belirtmezseniz OpenClaw önce bir takma ad eşleşmesi, ardından bu model
    kimliği için yapılandırılmış sağlayıcılar arasında benzersiz bir eşleşme arar ve
    son olarak yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımdan kaldırılmış
    uyumluluk yolu). Bu sağlayıcıda yapılandırılmış varsayılan model artık yoksa OpenClaw,
    geçerliliğini yitirmiş varsayılan yerine ilk yapılandırılmış sağlayıcı/model çiftine
    geri döner.

  </Accordion>

  <Accordion title="Hangi modeli öneriyorsunuz?">
    Özellikle araç etkin veya güvenilmeyen girdi alan agent'lar için sağlayıcı
    yığınınızın sunduğu en güçlü, en yeni nesil modeli kullanın — daha zayıf veya
    aşırı nicemlenmiş modeller istem enjeksiyonuna ve güvenli olmayan davranışlara
    karşı daha savunmasızdır (bkz. [Güvenlik](/tr/gateway/security)). Daha ucuz modelleri
    agent rolüne göre rutin/düşük riskli sohbetlere yönlendirin.

    Modelleri agent başına yönlendirin ve uzun görevleri paralelleştirmek için alt
    agent'ları kullanın (her alt agent kendi token'larını tüketir). Bkz.
    [Modeller](/tr/concepts/models), [Alt agent'lar](/tr/tools/subagents),
    [MiniMax](/tr/providers/minimax) ve [Yerel modeller](/tr/gateway/local-models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modeller arasında nasıl geçiş yaparım?">
    Yalnızca model alanlarını değiştirin — yapılandırmanın tamamını değiştirmekten kaçının.

    - Sohbette `/model` (oturum başına, bkz. [Eğik çizgi komutları](/tr/tools/slash-commands))
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içindeki `agents.defaults.model` alanını doğrudan düzenleyin

    RPC düzenlemelerinde önce `config.schema.lookup` ile inceleyin (normalleştirilmiş
    yol, yüzeysel şema belgeleri, alt öğe özetleri), ardından kısmi bir nesneyle
    `config.apply` yerine `config.patch` kullanmayı tercih edin. Yapılandırmanın
    üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor`
    komutunu çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Yapılandırma](/tr/cli/configure),
    [Yapılandırma](/tr/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri (llama.cpp, vLLM, Ollama) kullanabilir miyim?">
    Evet — en kolay yol Ollama'dır. Hızlı kurulum:

    1. Ollama'yı `https://ollama.com/download` adresinden yükleyin
    2. Yerel bir model indirin; örneğin `ollama pull gemma4`
    3. Bulut modelleri için de `ollama signin` komutunu çalıştırın
    4. `openclaw onboard` komutunu çalıştırın, `Ollama` seçeneğini, ardından `Local` veya `Cloud + Local` seçeneğini belirleyin

    `Cloud + Local`, bulut modellerinin yanı sıra yerel Ollama modellerinizi de
    kullanmanızı sağlar; `kimi-k2.5:cloud` gibi bulut modellerinin yerel olarak
    indirilmesi gerekmez. Elle geçiş yapmak için: `openclaw models list`, ardından
    `openclaw models set ollama/<model>`.

    Daha küçük/yoğun biçimde nicemlenmiş modeller istem enjeksiyonuna karşı daha
    savunmasızdır. Araç erişimi olan tüm botlar için büyük modeller kullanın; yine de
    küçük modeller kullanıyorsanız korumalı alanı ve katı araç izin listelerini etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Korumalı alan](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Yeniden başlatmadan modeller arasında anında nasıl geçiş yaparım?">
    `/model <name>` komutunu tek başına bir ileti olarak gönderin. Numaralı seçici
    (`/model`, `/model list`, `/model 3`), bir oturum geçersiz kılmasını temizlemek
    için `/model default` ve uç nokta/API modu ayrıntıları için `/model status`
    dahil olmak üzere komutların tam listesi için
    [Eğik çizgi komutları](/tr/tools/slash-commands) sayfasına bakın.

    `@profile` ile oturum başına belirli bir kimlik doğrulama profilini zorunlu kılın:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    `@profile` ile ayarlanmış bir profil sabitlemesini kaldırmak için `/model`
    komutunu son ek olmadan yeniden çalıştırın (ör. `/model anthropic/claude-opus-4-6`)
    veya `/model` içinden varsayılanı seçin. Etkin kimlik doğrulama profilini
    doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="İki sağlayıcı aynı model kimliğini sunuyorsa /model hangisini kullanır?">
    `/model provider/model` tam olarak belirtilen sağlayıcı yolunu seçer. Örneğin,
    model kimlikleri aynı olsa da `qianfan/deepseek-v4-flash` ile
    `deepseek/deepseek-v4-flash` farklı başvurulardır — OpenClaw yalnızca yalın bir
    kimlik eşleşmesine dayanarak sağlayıcıları sessizce değiştirmez.

    Kullanıcının seçtiği bir `/model` başvurusu geri dönüş açısından katıdır: söz
    konusu sağlayıcı/model kullanılamaz hâle gelirse yanıt,
    `agents.defaults.model.fallbacks` seçeneğine geri dönmek yerine görünür biçimde
    başarısız olur. Yapılandırılmış geri dönüş zincirleri yapılandırılmış
    varsayılanlar, Cron işi birincil modelleri ve otomatik seçilmiş geri dönüş
    durumu için geçerliliğini korur. Oturum geçersiz kılması olmayan bir çalışmanın
    geri dönüş kullanmasına izin verildiğinde OpenClaw önce istenen
    sağlayıcı/modeli, ardından yapılandırılmış geri dönüşleri ve son olarak
    yapılandırılmış birincil modeli dener — böylece yinelenen yalın model kimlikleri
    hiçbir zaman doğrudan varsayılan sağlayıcıya geri atlamaz.

    Bkz. [Modeller](/tr/concepts/models) ve [Model yük devretmesi](/tr/concepts/model-failover).

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.5, kodlama için Codex 5.5 kullanabilir miyim?">
    Evet — model seçimi ve çalışma zamanı seçimi birbirinden ayrıdır:

    - **Yerel Codex kodlama agent'ı:** `agents.defaults.model.primary` değerini
      `openai/gpt-5.5` olarak ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması
      için `openclaw models auth login --provider openai` ile oturum açın.
    - **Agent döngüsü dışındaki doğrudan OpenAI API görevleri:** görseller,
      gömmeler, konuşma, gerçek zamanlı işlemler ve agent dışındaki diğer OpenAI API
      yüzeyleri için `OPENAI_API_KEY` yapılandırın.
    - **OpenAI agent API anahtarı kimlik doğrulaması:** sıralanmış bir `openai`
      API anahtarı profiliyle `/model openai/gpt-5.5`.
    - **Alt agent'lar:** kodlama görevlerini kendi `openai/gpt-5.5` modeline sahip,
      Codex odaklı bir agent'a yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.5 için hızlı modu nasıl yapılandırırım?">
    - **Oturum başına:** `openai/gpt-5.5` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode`
      değerini `true` olarak ayarlayın.
    - **Otomatik kesme:** `/fast auto` veya `params.fastMode: "auto"`, kesme
      noktasına kadar yeni model çağrılarını hızlı çalıştırır; sonraki yeniden
      deneme, geri dönüş, araç sonucu veya devam çağrılarını hızlı mod olmadan
      çalıştırır. Kesme süresi varsayılan olarak 60 saniyedir; modelde
      `params.fastAutoOnSeconds` ile değiştirin.

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

    Hızlı mod, yerel OpenAI Responses isteklerinde `service_tier = "priority"`
    olarak eşlenir; mevcut `service_tier` değerleri korunur ve hızlı mod
    `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz. Oturumdaki `/fast`
    geçersiz kılmaları yapılandırma varsayılanlarına göre önceliklidir.

    [Düşünme ve hızlı mod](/tr/tools/thinking) sayfasına ve [OpenAI](/tr/providers/openai)
    sağlayıcı sayfasındaki Gelişmiş yapılandırma altında yer alan Hızlı mod bölümüne
    bakın.

  </Accordion>

  <Accordion title='"Model ... is not allowed" iletisini gördükten sonra neden yanıt alamıyorum?'>
    `agents.defaults.models` ayarlanırsa `/model` ve oturum geçersiz kılmaları için
    **izin listesi** hâline gelir. Bu listenin dışındaki bir modeli seçmek normal
    yanıt yerine şunu döndürür:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Düzeltme: tam modeli `agents.defaults.models` alanına ekleyin, dinamik kataloglar
    için `"provider/*": {}` gibi bir sağlayıcı joker karakteri ekleyin, izin
    listesini kaldırın veya `/model list` içinden bir model seçin. Komutta ayrıca
    `--runtime codex` bulunuyorsa önce izin listesini güncelleyin, ardından aynı
    `/model provider/model --runtime codex` komutunu yeniden deneyin.

  </Accordion>

  <Accordion title='"Unknown model: minimax/MiniMax-M3" iletisini neden görüyorum?'>
    Daha eski bir OpenClaw sürümü kullanıyorsanız önce yükseltin (veya kaynak
    kodun `main` dalından çalıştırın) ve gateway'i yeniden başlatın —
    `MiniMax-M3` henüz yüklü sürümünüzün kataloğunda bulunmayabilir. Aksi takdirde
    MiniMax sağlayıcısı yapılandırılmamıştır (sağlayıcı girdisi veya kimlik
    doğrulama profili bulunamamıştır), bu nedenle model çözümlenemez. Tam düzeltme
    denetim listesi, sağlayıcı/model kimliği tablosu ve yapılandırma bloğu örneği
    için [MiniMax](/tr/providers/minimax) sağlayıcı sayfasındaki Sorun Giderme
    bölümüne bakın.

  </Accordion>

  <Accordion title="MiniMax'i varsayılan, OpenAI'ı ise karmaşık görevler için kullanabilir miyim?">
    Evet. MiniMax'i varsayılan olarak kullanın ve modelleri oturum başına
    değiştirin — geri dönüşler "zor görevler" için değil hatalar içindir; bu
    nedenle `/model` veya ayrı bir agent kullanın.

    **Seçenek A: oturum başına geçiş**

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

    Ardından `/model gpt`.

    **Seçenek B: ayrı agent'lar** — Agent A varsayılan olarak MiniMax'i, Agent B
    varsayılan olarak OpenAI'ı kullanır; agent'a göre yönlendirin veya geçiş yapmak
    için `/agent` kullanın.

    Belgeler: [Modeller](/tr/concepts/models), [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent),
    [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet — yalnızca hedef model `agents.defaults.models` içinde bulunduğunda
    uygulanan yerleşik kısaltmalardır:

    | Takma ad | Çözümlendiği değer |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Aynı ada sahip kendi takma adınız yerleşik olanı geçersiz kılar.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adları) nasıl tanımlar/geçersiz kılarım?">
    Takma adlar `agents.defaults.models.<modelId>.alias` konumunda bulunur:

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

    Ardından `/model sonnet` (veya desteklendiğinde `/<alias>`) bu model kimliğine
    çözümlenir.

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
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Başvurulan bir sağlayıcı/model için sağlayıcı anahtarının eksik olması çalışma
    zamanında kimlik doğrulama hatasına yol açar (ör. `No API key found for provider "zai"`).

    **Yeni bir agent ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Yeni bir agent'ın kimlik doğrulama deposu boştur — kimlik doğrulama agent
    başınadır ve şu konumda saklanır:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme: `openclaw agents add <id>` komutunu çalıştırın ve sihirbazda kimlik doğrulamayı yapılandırın veya
    yalnızca taşınabilir statik `api_key`/`token` profillerini ana
    ajanın deposundan kopyalayın. OAuth için yeni ajan kendi hesabına
    ihtiyaç duyduğunda bu ajandan oturum açın. Tüm `agentDir` yeniden kullanım
    ve kimlik bilgisi paylaşım kuralları için [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent)
    bölümüne bakın — `agentDir` dizinini asla ajanlar arasında yeniden kullanmayın.

  </Accordion>
</AccordionGroup>

## Model yük devretmesi ve "Tüm modeller başarısız oldu"

<AccordionGroup>
  <Accordion title="Yük devretme nasıl çalışır?">
    İki aşama vardır:

    1. Aynı sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model geri dönüşü**.

    Başarısız profillere bekleme süreleri (üstel geri çekilme) uygulanır; böylece bir
    sağlayıcı hız sınırına ulaştığında veya geçici olarak başarısız olduğunda OpenClaw
    yanıt vermeyi sürdürür.

    Hız sınırı grubu yalnızca `429` yanıtlarını kapsamaz: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` ve dönemsel
    kullanım aralığı sınırlarının (`weekly/monthly limit reached`) tümü
    yük devretmeyi gerektiren hız sınırları sayılır.

    Faturalandırma yanıtları her zaman `402` değildir ve bazı `402` yanıtları
    faturalandırma yoluna değil, geçici hata/hız sınırı grubuna girer. `401`/`403`
    yanıtlarındaki açık faturalandırma metinleri yine faturalandırma yoluna yönlendirilebilir;
    sağlayıcıya özgü metin eşleştiricileri (ör. OpenRouter `Key limit exceeded`) yalnızca
    kendi sağlayıcıları kapsamında kalır. Yeniden denenebilir bir kullanım aralığı veya
    kuruluş/çalışma alanı harcama sınırı gibi görünen bir `402` (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), uzun süreli faturalandırma devre dışı bırakması
    olarak değil `rate_limit` olarak değerlendirilir.

    Bağlam taşması hataları geri dönüş yoluna hiçbir şekilde girmez — `request_too_large`,
    `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` veya `ollama error: context length exceeded` gibi
    imzalar, model geri dönüşünü ilerletmek yerine Compaction/yeniden deneme yoluna gider.

    Genel sunucu hatası metni, "içinde bilinmeyen/hata geçen her şey" ifadesinden daha
    dar kapsamlıdır. Yük devretme sinyali sayılan sağlayıcı kapsamlı geçici biçimler:
    Anthropic'in yalın `An unknown error occurred` yanıtı, OpenRouter'ın yalın
    `Provider returned error` yanıtı, `Unhandled stop reason:
    error` gibi durdurma nedeni hataları, geçici sunucu metni (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    içeren JSON `api_error` yükleri ve sağlayıcı bağlamı eşleştiğinde
    `ModelNotReadyException` gibi sağlayıcının meşgul olduğunu belirten hatalardır.
    `LLM request failed with an unknown error.` gibi genel dahili geri dönüş metinleri
    ihtiyatlı biçimde ele alınır ve tek başına geri dönüşü tetiklemez.

  </Accordion>

  <Accordion title='"anthropic:default profili için kimlik bilgisi bulunamadı" ne anlama gelir?'>
    `anthropic:default` kimlik doğrulama profili kimliğinin beklenen kimlik doğrulama
    deposunda kimlik bilgisi yoktur.

    **Düzeltme kontrol listesi:**

    - Profillerin nerede bulunduğunu doğrulayın — güncel:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; eski:
      `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).
    - Gateway'in ortam değişkeninizi yüklediğini doğrulayın. Yalnızca kabuğunuzda ayarlanan
      `ANTHROPIC_API_KEY`, systemd/launchd üzerinden çalışan bir Gateway'e ulaşmaz —
      bunu `~/.openclaw/.env` dosyasına ekleyin veya `env.shellEnv` seçeneğini etkinleştirin.
    - Doğru ajanı düzenlediğinizi doğrulayın — çok ajanlı kurulumlarda birden fazla
      `auth-profiles.json` dosyası bulunur.
    - Yapılandırılmış modelleri ve sağlayıcının kimlik doğrulama durumunu görmek için
      `openclaw models status` komutunu çalıştırın.

    **"anthropic profili için kimlik bilgisi bulunamadı" durumunda (e-posta son eki yoksa):**

    Çalıştırma, Gateway'in bulamadığı bir Anthropic profiline sabitlenmiştir.

    - Claude CLI kullanın: Gateway ana makinesinde `openclaw models auth login --provider anthropic
      --method cli --set-default` komutunu çalıştırın.
    - Bunun yerine tercihen bir API anahtarı kullanın: Gateway ana makinesindeki
      `~/.openclaw/.env` dosyasına `ANTHROPIC_API_KEY` ekleyin, ardından eksik profili
      zorunlu kılan sabitlenmiş sıralamayı temizleyin:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Uzak mod: kimlik doğrulama profilleri dizüstü bilgisayarınızda değil, Gateway
      makinesinde bulunur — komutları orada çalıştırdığınızı doğrulayın.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de deneyip başarısız oldu?">
    Model yapılandırmanız Google Gemini'yi bir geri dönüş modeli olarak içeriyorsa
    (veya bir Gemini kısa adına geçtiyseniz), OpenClaw geri dönüş sırasında onu dener.
    Google kimlik bilgileri yapılandırılmamışsa `No API key found for provider
    "google"` hatası oluşur. Düzeltme: Google kimlik doğrulaması ekleyin veya Google
    modellerini `agents.defaults.model.fallbacks`/takma adlardan kaldırın.

    **LLM isteği reddedildi: düşünme imzası gerekli (Google Antigravity)**

    Neden: oturum geçmişinde imzasız düşünme blokları vardır (çoğunlukla
    yarıda kesilmiş/kısmi bir akıştan kaynaklanır); Google Antigravity düşünme
    bloklarında imza gerektirir. OpenClaw, Google Antigravity Claude için imzasız
    düşünme bloklarını kaldırır; sorun yine de ortaya çıkarsa yeni bir oturum başlatın
    veya bu ajan için `/thinking off` ayarını kullanın.

  </Accordion>
</AccordionGroup>

## Kimlik doğrulama profilleri: nedir ve nasıl yönetilir?

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token depolama, çok hesaplı kullanım kalıpları)

<AccordionGroup>
  <Accordion title="Kimlik doğrulama profili nedir?">
    Bir sağlayıcıya bağlı, adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı)
    ve şu konumda saklanır:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Gizli bilgileri göstermeden kaydedilmiş profilleri inceleyin: `openclaw models auth
    list` (isteğe bağlı olarak `--provider <id>` veya `--json`). Bkz.
    [Modeller CLI'si](/tr/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Yaygın profil kimlikleri nelerdir?">
    Sağlayıcı önekli biçimler: `anthropic:default` (e-posta kimliği olmadığında yaygındır),
    OAuth kimlikleri için `anthropic:<email>` veya seçtiğiniz özel bir kimlik
    (ör. `anthropic:work`).

  </Accordion>

  <Accordion title="İlk olarak hangi kimlik doğrulama profilinin deneneceğini denetleyebilir miyim?">
    Evet. `auth.order.<provider>` yapılandırması, sağlayıcı başına rotasyon sırasını
    belirler (yalnızca meta veriler — gizli bilgiler saklanmaz).

    OpenClaw, kısa bir **bekleme süresindeki** (hız sınırları, zaman aşımları,
    kimlik doğrulama hataları) veya daha uzun süreli **devre dışı** durumdaki
    (faturalandırma/yetersiz kredi) bir profili atlayabilir. `openclaw models status
    --json` ile inceleyin ve `auth.unusableProfiles` alanını kontrol edin.
    `auth.cooldowns.billingBackoffHours*` ile ayarlayın. Hız sınırı bekleme süreleri
    model kapsamlı olabilir — bir model için bekleme süresinde olan profil, aynı
    sağlayıcıdaki kardeş bir modele yine hizmet verebilir; faturalandırma/devre dışı
    bırakma aralıkları ise profilinin tamamını engeller.

    Ajan başına sıralama geçersiz kılması ayarlayın (bu ajanın `auth-state.json` dosyasında saklanır):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gerçekte nelerin deneneceğini doğrulayın: `openclaw models status --probe`.
    Açık sıralamada yer almayan kayıtlı bir profil, sessizce denenmek yerine
    `excluded_by_auth_order` olarak bildirilir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    - **OAuth / CLI oturumu**, sağlayıcının desteklediği durumlarda çoğunlukla abonelik
      erişimini kullanır. Anthropic için OpenClaw'ın Claude CLI arka ucu,
      Anthropic'in şu anda abonelik kullanım sınırlarından düşülen Agent SDK/programatik
      kullanım olarak değerlendirdiği Claude Code `claude -p` komutunu kullanır —
      güncel faturalandırma duraklatma durumu ve kaynak bağlantıları için
      [Anthropic](/tr/providers/anthropic) bölümüne bakın.
    - **API anahtarları**, token başına ödeme esaslı faturalandırmayı kullanır.

    Sihirbaz Anthropic Claude CLI'yi, OpenAI Codex OAuth'u ve API anahtarlarını destekler.

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS
- [SSS — hızlı başlangıç ve ilk çalıştırma kurulumu](/tr/help/faq-first-run)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretmesi](/tr/concepts/model-failover)
