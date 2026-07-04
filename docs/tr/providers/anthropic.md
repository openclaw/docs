---
read_when:
    - OpenClaw içinde Anthropic modellerini kullanmak istiyorsunuz
summary: OpenClaw'da Anthropic Claude'u API anahtarları veya Claude CLI aracılığıyla kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:30:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama rotasını destekler:

- **API anahtarı** — kullanıma dayalı faturalandırmayla doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı ana makinedeki mevcut Claude Code oturum açmasını yeniden kullanma

<Warning>
OpenClaw'ın Claude CLI arka ucu, kurulu Claude Code CLI'ı etkileşimsiz yazdırma modunda çalıştırır. Anthropic'in mevcut Claude Code dokümanları `claude -p` komutunu Agent SDK/programatik kullanım olarak tanımlar. Anthropic'in 15 Haziran 2026 destek güncellemesi, duyurulan Agent SDK faturalandırma değişikliğini duraklattı. Şimdilik Anthropic, Claude Agent SDK, `claude -p` ve üçüncü taraf uygulama kullanımının hâlâ bir aboneliğin kullanım sınırlarından düştüğünü söylüyor. Daha önce duyurulan aylık Agent SDK kredisi, Anthropic bu planı gözden geçirirken kullanılamaz.

Etkileşimli Claude Code hâlâ oturum açılmış Claude planı sınırlarından düşer. API anahtarı kimlik doğrulaması doğrudan kullandıkça öde API faturalandırması olarak kalır. Uzun ömürlü gateway ana makineleri, paylaşılan otomasyon ve öngörülebilir üretim harcamaları için bir Anthropic API anahtarı kullanın.

Abonelik faturalandırma davranışına güvenmeden önce Anthropic'in güncel destek makalelerini kontrol edin:

- [Claude Code CLI başvurusu](https://code.claude.com/docs/en/cli-usage)
- [Claude Agent SDK'yı Claude planınızla kullanın](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code'u Pro veya Max planınızla kullanın](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code'u Team veya Enterprise planınızla kullanın](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code maliyetlerini yönetin](https://code.claude.com/docs/en/costs)

</Warning>

## Başlarken

<Tabs>
  <Tab title="API anahtarı">
    **En uygun olduğu durum:** standart API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Veya anahtarı doğrudan geçirin:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **En uygun olduğu durum:** ayrı bir API anahtarı olmadan mevcut Claude CLI oturum açmasını yeniden kullanma.

    <Steps>
      <Step title="Claude CLI'ın kurulu ve oturum açmış olduğundan emin olun">
        Şununla doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw mevcut Claude CLI kimlik bilgilerini algılar ve yeniden kullanır.
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI arka ucuna yönelik kurulum ve çalışma zamanı ayrıntıları [CLI Arka Uçları](/tr/gateway/cli-backends) bölümündedir.
    </Note>

    <Warning>
    Claude CLI yeniden kullanımı, OpenClaw sürecinin Claude CLI oturum açmasıyla aynı ana makinede çalışmasını bekler. Docker kurulumları bir konteyner ana dizinini kalıcı hâle getirebilir ve orada Claude Code'a oturum açabilir; bkz.
    [Docker'da Claude CLI arka ucu](/tr/install/docker#claude-cli-backend-in-docker).
    [Podman](/tr/install/podman) gibi diğer konteyner kurulumları, ana makine
    `~/.claude` dizinini kurulum veya çalışma zamanına bağlamaz; orada bir Anthropic API anahtarı kullanın ya da
    [OpenAI Codex](/tr/providers/openai) gibi OpenClaw tarafından yönetilen OAuth'a sahip bir sağlayıcı seçin.
    </Warning>

    ### Yapılandırma örneği

    Kanonik Anthropic model ref'ini ve bir CLI çalışma zamanı geçersiz kılmasını tercih edin:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Eski `claude-cli/claude-opus-4-7` model ref'leri uyumluluk için hâlâ çalışır, ancak yeni yapılandırma sağlayıcı/model seçimini
    `anthropic/*` olarak tutmalı ve yürütme arka ucunu sağlayıcı/model çalışma zamanı ilkesine koymalıdır.

    ### Faturalandırma ve `claude -p`

    OpenClaw, Claude CLI çalıştırmaları için Claude Code'un etkileşimsiz `claude -p` yolunu kullanır. Anthropic şu anda bu yolu Agent SDK/programatik kullanım olarak ele alır:

    - Anthropic'in 15 Haziran 2026 destek güncellemesi, daha önce duyurulan
      ayrı Agent SDK kredi planını duraklattı.
    - Şimdilik, abonelik planı kapsamındaki Claude Agent SDK, `claude -p` ve üçüncü taraf
      uygulama kullanımı hâlâ oturum açılmış aboneliğin kullanım sınırlarından düşer.
    - Daha önce duyurulan aylık Agent SDK kredisi, Anthropic bu planı gözden geçirirken kullanılamaz.
    - Console/API anahtarı oturum açmaları kullandıkça öde API faturalandırmasını kullanır ve
      abonelik Agent SDK kredisini almaz.

    Duraklatma bildirimi için Anthropic'in [Agent SDK planı
    makalesine](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), abonelik davranışı için Claude Code planı makalelerindeki
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    ve
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    bölümlerine bakın.

    Anthropic, OpenClaw sürümü olmadan Claude Code faturalandırmasını ve hız sınırı davranışını değiştirebilir. Faturalandırma öngörülebilirliği önemli olduğunda `claude auth status`, `/status` ve
    Anthropic'in bağlantılı dokümanlarını kontrol edin.

    <Tip>
    Paylaşılan üretim otomasyonu için Claude CLI yerine bir Anthropic API anahtarı kullanın. OpenClaw ayrıca
    [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/zai) kaynaklı abonelik tarzı seçenekleri destekler.
    </Tip>

  </Tab>
</Tabs>

## Thinking varsayılanları (Claude Fable 5, 4.8 ve 4.6)

`anthropic/claude-fable-5` her zaman uyarlanabilir thinking kullanır ve varsayılan olarak `high`
çabayı kullanır. Anthropic bu model için thinking'in devre dışı bırakılmasına izin vermediğinden,
`/think off` ve `/think minimal` `low` çaba kullanır. OpenClaw ayrıca Fable 5 istekleri için özel
sıcaklık değerlerini atlar.

Claude Opus 4.8, OpenClaw'da thinking'i varsayılan olarak kapalı tutar. `/think high|xhigh|max` ile uyarlanabilir thinking'i açıkça etkinleştirdiğinizde OpenClaw, Anthropic'in Opus 4.8 çaba değerlerini gönderir; Claude 4.6 modelleri varsayılan olarak `adaptive` kullanır.

İleti başına `/think:<level>` ile veya model parametrelerinde geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
İlgili Anthropic dokümanları:
- [Uyarlanabilir thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Genişletilmiş thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Güvenlik reddi fallback'i (Claude Fable 5)

<Warning>
Claude Fable 5 kullanmak, Claude Opus 4.8'i de kullanmak anlamına gelir. Fable 5, bir isteği reddedebilen güvenlik sınıflandırıcılarıyla gelir ve Anthropic'in onayladığı kurtarma yolu, o turu `claude-opus-4-8` modeline hizmet ettirmektir. OpenClaw, doğrudan API anahtarı istekleri için bunu otomatik olarak kabul eder; bu nedenle bazı Fable turları Claude Opus 4.8 olarak yanıtlanır ve faturalandırılır. İlkeniz veya bütçeniz Opus tarafından sunulan turları kabul edemiyorsa `anthropic/claude-fable-5` seçmeyin.
</Warning>

### Bu neden var?

Fable 5 sınıflandırıcıları, kısıtlı alanlardaki isteklerde `stop_reason: "refusal"` döndürür ve zararsıza yakın çalışmalarda da yanlış pozitif verebilir (güvenlik
araçları, yaşam bilimleri veya hatta modelden ham akıl yürütmesini yeniden üretmesini istemek). Bir fallback olmadan tur, başka bir Claude modeli memnuniyetle hizmet verebilecek olsa bile bir hatayla ölür; Anthropic'in kendi ret iletisi API entegratörlerine bir fallback modeli yapılandırmalarını söyler.

### Nasıl çalışır?

1. `anthropic/claude-fable-5` modeline yapılan her doğrudan API anahtarı isteği için OpenClaw,
   Anthropic'in sunucu tarafı fallback katılımını gönderir: `server-side-fallback-2026-06-01` beta başlığı ve
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8, Anthropic'in Fable 5 için izin verdiği tek fallback hedefidir.
2. Yalnızca güvenlik sınıflandırıcısı reddi fallback'i tetikler. Hız sınırları,
   aşırı yükler ve sunucu hataları aynen önceki gibi davranır ve OpenClaw'ın normal [model failover](/tr/concepts/model-failover) akışından geçer.
3. Kurtarma aynı çağrının içinde gerçekleşir. Herhangi bir çıktıdan önce gelen ret,
   gecikme dışında görünmezdir; tüm yanıt Opus 4.8'den gelir. Akış ortası bir
   rette kısmi metin, fallback modelin devam ettiği önek olarak tutulurken, reddedilen modelin akıl yürütmesi ve araç çağrıları Anthropic'in yeniden oynatma kuralları uyarınca atılır (bunlar geri yankılanmamalı veya yürütülmemelidir).
4. Claude Opus 4.8 de reddederse tur, bu özellikten öncekiyle tamamen aynı şekilde reddi bir hata olarak yüzeye çıkarır.

Fallback Anthropic API düzeyinde gerçekleşir, bu yüzden `claude-opus-4-8` modelinin yapılandırılmış model listenizde veya fallback zincirinizde olması gerekmez; Fable uyumlu bir API anahtarı her zaman Opus'a hizmet verebilir.

### Gözlemlenebilirlik ve faturalandırma

- Fallback ile sunulan bir tur, asistan iletisinde `fromModel` ve `toModel` adlarını veren bir `provider_fallback` tanılaması kaydeder ve iletinin
  `responseModel` alanı `claude-opus-4-8` bildirir.
- Anthropic deneme başına faturalandırır: çıktıdan önce gelen ret ücretsizdir ve kurtarma
  Claude Opus 4.8 fiyatlarıyla faturalandırılır (şu anda Fable 5 fiyatlarının yarısı). OpenClaw'ın
  tur başına maliyet tahmini, eşleşmesi için fallback ile sunulan turları Opus fiyatlarıyla fiyatlandırır.
- Akış ortası bir ret, Anthropic tarafında zaten akışa verilmiş Fable kısmını ayrıca faturalandırır; bu bölüm API'nin deneme başına kullanımında bildirilir, ancak OpenClaw'ın tur başına tahminine katılmaz.

### Kapsam

`api.anthropic.com` karşısında API anahtarı kimlik doğrulamasıyla `anthropic/claude-fable-5` için geçerlidir. OAuth (Claude CLI abonelik yeniden kullanımı), proxy temel URL'leri,
Bedrock, Vertex ve Foundry istekleri değişmeden kalır ve orada retleri hâlâ hata olarak yüzeye çıkarır.

Canlı doğrulandı: Fable 5'ten ham düşünce zincirini yeniden üretmesini isteyen zararsız bir istem, fallback'ler olmadan gönderildiğinde `category: "reasoning_extraction"` ile reddedilir ve OpenClaw üzerinden gönderilen aynı istem, `provider_fallback` tanılaması eklenmiş normal, Opus tarafından sunulan bir yanıt döndürür.

Temel davranış için Anthropic'in [retler ve fallback
kılavuzuna](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) bakın.

## İstem önbelleğe alma

OpenClaw, API anahtarı kimlik doğrulaması için Anthropic'in istem önbelleğe alma özelliğini destekler.

| Değer               | Önbellek süresi | Açıklama                                      |
| ------------------- | --------------- | --------------------------------------------- |
| `"short"` (varsayılan) | 5 dakika      | API anahtarı kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat          | Genişletilmiş önbellek                        |
| `"none"`            | Önbelleğe alma yok | İstem önbelleğe almayı devre dışı bırakır   |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ajan başına önbellek geçersiz kılmaları">
    Temel ayarınız olarak model düzeyi parametreleri kullanın, ardından belirli ajanları `agents.list[].params` üzerinden geçersiz kılın:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Yapılandırma birleştirme sırası:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (eşleşen `id`, anahtara göre geçersiz kılar)

    Bu, aynı modeldeki başka bir ajan ani/düşük yeniden kullanım trafiği için önbelleğe almayı devre dışı bırakırken bir ajanın uzun ömürlü önbellek tutmasını sağlar.

  </Accordion>

  <Accordion title="Bedrock Claude notları">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`), yapılandırıldığında `cacheRetention` doğrudan geçişini kabul eder.
    - Anthropic olmayan Bedrock modelleri çalışma zamanında `cacheRetention: "none"` değerine zorlanır.
    - API anahtarı akıllı varsayılanları, açık bir değer ayarlanmadığında Claude-on-Bedrock referansları için `cacheRetention: "short"` değerini de başlangıçta ekler.

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Hızlı mod">
    OpenClaw'ın paylaşılan `/fast` anahtarı doğrudan Anthropic trafiğini destekler (`api.anthropic.com` için API anahtarı ve OAuth).

    | Komut | Şuna eşlenir |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Yalnızca doğrudan `api.anthropic.com` istekleri için enjekte edilir. Proxy rotaları `service_tier` değerine dokunmaz.
    - Açık `serviceTier` veya `service_tier` parametreleri, ikisi de ayarlandığında `/fast` değerini geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` değeri `standard` olarak çözümlenebilir.

    </Note>

  </Accordion>

  <Accordion title="Medya anlama (görüntü ve PDF)">
    Paketlenmiş Anthropic Plugin, görüntü ve PDF anlamayı kaydeder. OpenClaw,
    yapılandırılmış Anthropic kimlik doğrulamasından medya yeteneklerini otomatik olarak çözümler; ek
    yapılandırma gerekmez.

    | Özellik        | Değer                 |
    | --------------- | --------------------- |
    | Varsayılan model   | `claude-opus-4-8`     |
    | Desteklenen girdi | Görüntüler, PDF belgeleri |

    Bir konuşmaya görüntü veya PDF eklendiğinde, OpenClaw bunu otomatik olarak
    Anthropic medya anlama sağlayıcısı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M bağlam penceresi">
    Anthropic'in 1M bağlam penceresi, Opus 4.8, Opus 4.7, Opus 4.6 ve Sonnet 4.6 gibi
    GA uyumlu Claude 4.x modellerinde kullanılabilir. OpenClaw bu modelleri otomatik olarak
    1M boyutunda ayarlar:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Eski yapılandırmalar `params.context1m: true` değerini koruyabilir, ancak OpenClaw artık
    kullanımdan kaldırılmış `context-1m-2025-08-07` beta başlığını göndermez. Bu değere sahip eski `anthropicBeta` yapılandırma
    girdileri, istek başlığı çözümlemesi sırasında yok sayılır ve
    desteklenmeyen eski Claude modelleri normal bağlam pencerelerinde kalır.

    `params.context1m: true`, uygun GA uyumlu Opus ve Sonnet modelleri için
    Claude CLI arka ucuna da (`claude-cli/*`) uygulanır; böylece bu CLI oturumlarının
    çalışma zamanı bağlam penceresi doğrudan API davranışıyla eşleşecek şekilde korunur.

    <Warning>
    Anthropic kimlik bilgilerinizde uzun bağlam erişimi gerektirir. OAuth/abonelik belirteci kimlik doğrulaması gerekli Anthropic beta başlıklarını korur, ancak OpenClaw eski yapılandırmada kalmışsa kullanımdan kaldırılmış 1M beta başlığını kaldırır.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M bağlamı">
    `anthropic/claude-opus-4-8` ve `claude-cli` varyantı varsayılan olarak 1M bağlam
    penceresine sahiptir; `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 hataları / belirteç aniden geçersiz">
    Anthropic belirteç kimlik doğrulamasının süresi dolar ve iptal edilebilir. Yeni kurulumlar için bunun yerine Anthropic API anahtarı kullanın.
  </Accordion>

  <Accordion title='"anthropic" sağlayıcısı için API anahtarı bulunamadı'>
    Anthropic kimlik doğrulaması **ajan başınadır**; yeni ajanlar ana ajanın anahtarlarını devralmaz. Bu ajan için onboarding'i yeniden çalıştırın (veya Gateway ana makinesinde bir API anahtarı yapılandırın), ardından `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='"anthropic:default" profili için kimlik bilgisi bulunamadı'>
    Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` çalıştırın. Onboarding'i yeniden çalıştırın veya bu profil yolu için bir API anahtarı yapılandırın.
  </Accordion>

  <Accordion title="Kullanılabilir kimlik doğrulama profili yok (tümü bekleme süresinde)">
    `auth.unusableProfiles` için `openclaw models status --json` çıktısını kontrol edin. Anthropic hız sınırı bekleme süreleri modele özgü olabilir, bu yüzden kardeş bir Anthropic modeli hâlâ kullanılabilir olabilir. Başka bir Anthropic profili ekleyin veya bekleme süresinin bitmesini bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="CLI arka uçları" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI arka ucu kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="İstem önbelleğe alma" href="/tr/reference/prompt-caching" icon="database">
    Sağlayıcılar arasında istem önbelleğe almanın nasıl çalıştığı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgilerini yeniden kullanım kuralları.
  </Card>
</CardGroup>
