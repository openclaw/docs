---
read_when:
    - OpenClaw'da Anthropic modellerini kullanmak istiyorsunuz
    - Eşleştirilmiş bilgisayarlar arasında Claude CLI veya Claude Desktop oturumlarına göz atmak istiyorsunuz
summary: OpenClaw'da API anahtarları veya Claude CLI aracılığıyla Anthropic Claude kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T17:51:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama yolu destekler:

- **API anahtarı** - kullanıma dayalı faturalandırmayla Anthropic API'sine doğrudan erişim (`anthropic/*` modelleri)
- **Claude CLI** - aynı ana makinedeki mevcut bir Claude Code oturumunu yeniden kullanır

## Kullanım ve maliyet takibi

OpenClaw, kullanılabilir Anthropic kimlik bilgisini algılar ve eşleşen kullanım yüzeyini seçer:

- Claude aboneliği/kurulum kimlik bilgileri, kota dönemlerini ve isteğe bağlı ek kullanım bütçesini gösterir.
- `ANTHROPIC_ADMIN_KEY` veya `ANTHROPIC_ADMIN_API_KEY`, günlük harcama, token/önbellek toplamları, en çok kullanılan modeller ve maliyet kategorileri dâhil olmak üzere sağlayıcının bildirdiği 30 günlük kuruluş maliyetini ve Messages API kullanımını Control UI **Kullanım** bölümünde gösterir.
- Anthropic sağlayıcı profilinde saklanan bir `sk-ant-admin...` kimlik bilgisi, otomatik olarak Admin API anahtarı olarak algılanır.

Admin API maliyet geçmişi, Anthropic'in [Kullanım ve Maliyet API'sinden](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) gelir. Bu, OpenClaw'ın oturumdan türetilen tahmini maliyetinden ayrı, gerçek sağlayıcı faturalandırmasıdır.

<Warning>
OpenClaw'ın Claude CLI arka ucu, yüklü Claude Code CLI'yi etkileşimsiz
yazdırma modunda (`claude -p`) çalıştırır. Anthropic'in güncel Claude Code belgeleri
bu modu Agent SDK/programatik kullanım olarak tanımlar. Anthropic'in 15 Haziran 2026
tarihli destek güncellemesi, duyurulan ayrı Agent SDK faturalandırma değişikliğini duraklattı: Claude
Agent SDK, `claude -p` ve üçüncü taraf uygulama kullanımı hâlâ oturum açılmış
aboneliğin kullanım sınırlarından düşer ve daha önce duyurulan aylık Agent SDK
kredisi, Anthropic bu planı gözden geçirirken kullanılamaz.

Etkileşimli Claude Code da oturum açılmış Claude planının sınırlarından düşer.
API anahtarıyla kimlik doğrulama, doğrudan kullandıkça öde faturalandırmasıdır ve bu plana bağlı değildir.
Uzun süre çalışan gateway ana makineleri, paylaşılan otomasyon ve öngörülebilir üretim
harcamaları için bir Anthropic API anahtarı kullanın.

Anthropic'in güncel destek makaleleri, bir OpenClaw sürümü olmadan bu davranışı
değiştirebilir:

- [Claude Code CLI başvurusu](https://code.claude.com/docs/en/cli-usage)
- [Claude Agent SDK'yi Claude planınızla kullanma](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code'u Pro veya Max planınızla kullanma](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code'u Team veya Enterprise planınızla kullanma](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code maliyetlerini yönetme](https://code.claude.com/docs/en/costs)

</Warning>

## Başlarken

<Tabs>
  <Tab title="API anahtarı">
    **En uygun kullanım:** standart API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard
        # şunu seçin: Anthropic API key
        ```

        Ya da anahtarı doğrudan iletin:

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
    **En uygun kullanım:** ayrı bir API anahtarı olmadan mevcut bir Claude CLI oturumunu yeniden kullanma.

    <Steps>
      <Step title="Claude CLI'nin kurulu olduğundan ve oturum açıldığından emin olun">
        Şununla doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard
        # şunu seçin: Claude CLI
        ```

        OpenClaw, mevcut Claude CLI kimlik bilgilerini algılar ve yeniden kullanır.
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI arka ucunun kurulum ve çalışma zamanı ayrıntıları [CLI Arka Uçları](/tr/gateway/cli-backends) bölümündedir.
    </Note>

    <Warning>
    Claude CLI'nin yeniden kullanılması, OpenClaw işleminin Claude CLI oturumuyla
    aynı ana makinede çalışmasını gerektirir. Docker kurulumları, bir konteyner ana dizinini kalıcı hâle getirip
    orada Claude Code'a giriş yapabilir; bkz.
    [Docker'da Claude CLI arka ucu](/tr/install/docker#claude-cli-backend-in-docker).
    [Podman](/tr/install/podman) gibi diğer konteyner kurulumları, ana makine
    `~/.claude` dizinini kuruluma veya çalışma zamanına bağlamaz; buralarda bir Anthropic API anahtarı kullanın veya
    [OpenAI Codex](/tr/providers/openai) gibi OpenClaw tarafından yönetilen OAuth'a sahip
    bir sağlayıcı seçin.
    </Warning>

    ### Kurulum token'ı alma

    Claude Code'un kurulu olduğu herhangi bir makinede `claude setup-token` komutunu çalıştırın. Bu komut,
    `sk-ant-oat01-` ile başlayan uzun ömürlü bir token yazdırır.

    İlk kurulum sırasında macOS uygulamasında **Connect with an API key or token** altında
    **Anthropic setup-token** seçeneğini belirleyerek token'ı yapıştırın veya şunu kullanın:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Yapılandırma örneği

    Standart Anthropic model başvurusunu ve bir CLI çalışma zamanı geçersiz kılmasını tercih edin:

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

    Eski `claude-cli/claude-opus-4-7` model başvuruları uyumluluk için
    çalışmaya devam eder; ancak yeni yapılandırma, sağlayıcı/model seçimini
    `anthropic/*` olarak tutmalı ve yürütme arka ucunu sağlayıcı/model çalışma zamanı politikasına koymalıdır.

    ### Faturalandırma ve `claude -p`

    OpenClaw, Claude CLI çalıştırmaları için Claude Code'un etkileşimsiz `claude -p` yolunu
    kullanır. Anthropic şu anda bu yolu Agent SDK/programatik kullanım olarak değerlendirir:

    - Anthropic'in 15 Haziran 2026 tarihli destek güncellemesi, daha önce duyurulan
      ayrı Agent SDK kredi planını duraklattı.
    - Abonelik planındaki Claude Agent SDK, `claude -p` ve üçüncü taraf uygulama kullanımı,
      hâlâ oturum açılmış aboneliğin kullanım sınırlarından düşer.
    - Daha önce duyurulan aylık Agent SDK kredisi, Anthropic
      bu planı gözden geçirirken kullanılamaz.
    - Console/API anahtarı oturumları, kullandıkça öde API faturalandırmasını kullanır ve
      abonelik Agent SDK kredisini almaz.

Duraklatma bildirimi için Anthropic'in [Agent SDK planı
makalesine](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan);
abonelik davranışı için Claude Code'un
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
ve
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
planı makalelerine bakın.

Anthropic, bir OpenClaw sürümü olmadan Claude Code faturalandırma ve hız sınırı
davranışını değiştirebilir. Faturalandırma öngörülebilirliği önemli olduğunda `claude auth status`, `/status` ve
Anthropic'in bağlantı verilen belgelerini kontrol edin.

    <Tip>
    Paylaşılan üretim otomasyonu için Claude CLI yerine bir Anthropic API anahtarı
    kullanın. OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve
    [Z.AI / GLM](/tr/providers/zai) kaynaklı abonelik tarzı seçenekleri destekler.
    </Tip>

  </Tab>
</Tabs>

## Bilgisayarlar arasındaki Claude oturumları

Paketle gelen Anthropic plugin'i, normal oturumlar kenar çubuğuna bir **Claude Code**
grubu ekler. Satırlar normal Sohbet bölmesinde açılır. Gateway'de ve bağlı node
ana makinelerinde arşivlenmemiş Claude Code oturumlarını keşfeder:

- Claude CLI oturumları, geçerli proje dizini kayıtlarından ve sınırlı meta veri
  öneki `~/.claude/projects/` altında yan zincir olmayan bir `sdk-cli`
  oturumunu tanımlayan güncel JSONL dosyalarından gelir.
- Claude Desktop oturumları, meta verileri aynı Claude Code oturum kimliğine işaret ettiğinde
  Desktop başlığını, etkinlik zamanını ve arşiv durumunu kullanır.
- Yalnızca CLI oturumunda arşiv bayrağı bulunmaz; bu nedenle dökümü mevcut olduğu
  sürece görünür kalır.

Keşif için ek OpenClaw yapılandırması gerekmez. Anthropic plugin'i
paketle gelir ve varsayılan olarak etkindir; yerel bir macOS node'u, yerel
`~/.claude/projects/` dizini mevcut olduğunda salt okunur Claude oturum komutlarını duyurur.
Bu komutlar ilk göründüğünde node eşleştirme yükseltmesini onaylayın.

Kenar çubuğu, satırları Gateway veya eşleştirilmiş node ana makinelerine göre gruplandırır, her ana makineden
en yeni sınırlı sayfayla başlar ve normal 30 saniyelik
aralıkla yenilenir. Daha fazla geçmişi olan her ana makine için sonraki sayfayı eklemek üzere
bir katalog grubunun altındaki **Daha fazla oturum yükle** seçeneğini kullanın; eklenen satırlar görünür kalır ve
yenilemeler sırasında aynı derinliğe kadar yeniden getirilir. Katalog istemcileri
`sessions.catalog.list` kullanır; bir satırı açmak `sessions.catalog.read` kullanır.

Terminal devralma, `claude` değerini hizmet/arka plan işlemi PATH'inden önce sahip ana makine kullanıcısının oturum açma kabuğu
PATH'inden çözümler. Bu, uygulama tarafından başlatılan oturumların
operatörün normal bir terminalde kullandığı Claude CLI ile uyumlu kalmasını sağlar.

Bir satır seçildiğinde önce en yeni döküm sayfası okunur. **Daha eski döküm
öğelerini yükle**, belirsiz bir bayt imlecini izler ve tüm geçmişi yüklemek yerine
JSONL dosyasından başka bir sınırlı bölümü okur. Normal kullanıcı, asistan,
akıl yürütme, araç çağrısı ve araç sonucu içerikleri korunur. Node/Gateway güvenlik tavanından
büyük tekil bir öğe, açıkça kesilmiş olarak işaretlenir.

Gateway'e yerel bir `claude-cli` satırında normal yazma alanına yazmak,
`sessions.catalog.continue` çağrısını yapar. OpenClaw, yerel katalog kaydını yeniden çözümler,
modeli kilitli yerel bir oturum oluşturur veya yeniden kullanır, en fazla 200 görünür
öğeyi ya da 512 KiB'ı içe aktarır ve Claude CLI bağlamasını başlatır. İlk tur
`--fork-session` ile sürdürülür; Claude çatala yeni bir oturum kimliği atar, böylece sonraki turlar
çatalı kullanır ve kaynak oturum değiştirilmeden kalır.

Başsız bir node ana makinesi de aşağıdaki node'a özgü ayarı etkinleştirip
node ana makinesini yeniden başlatarak Claude CLI satırlarının sürdürülebilmesini sağlayabilir:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node, yalnızca ayar etkinleştirildiğinde ve yerel `claude` yürütülebilir dosyası
çözümlendiğinde `agent.cli.claude.run.v1` duyurur. OpenClaw, katalog kaydını bu node'da yeniden çözümler,
aynı sınırlı geçmişi içe aktarır ve benimsenen oturumu node'a ve katalog tarafından bildirilen
çalışma dizinine bağlar. Her tur, ilgili node'un Claude dosyalarını ve oturumunu kullanarak node'un
gerçek `claude -p` işlemini çalıştırır. Node'un yürütme onayı politikası yine geçerlidir;
Gateway bu katılımı zorlayamaz.

Node sürdürme v1 yalnızca tek seferliktir. Gateway geri döngü MCP yapılandırmasını ve
Gateway Skills plugin'i bağımsız değişkenlerini atlar, bir Gateway dökümünden yeniden başlangıç yapmaz ve
eklerle görselleri reddeder. Claude Desktop satırları yalnızca görüntülenebilir olarak kalır. Yerel
macOS uygulama node'ları da uygulama çalıştırma komutunu duyurana kadar yalnızca görüntülenebilir olarak kalır.

<Note>
Eşleştirilmiş node Claude oturumları, başsız node açıkça
`agent.cli.claude.run.v1` duyurmadığı sürece salt okunur kalır. OpenClaw, Claude Desktop
meta verilerini veya Claude oturum arşivlerini hiçbir zaman değiştirmez. Sayfa, kimliği doğrulanmış
`node.invoke` kullandığı için yazma kapsamına sahip bir operatör bağlantısı gerektirir; listeleme ve okuma,
sürdürmenin etkinleştirildiği bir node'da bile salt okunur kalır.
</Note>

Node komutu ve güvenlik sınırı için [Node'lar: Claude oturumları ve dökümleri](/tr/nodes#claude-sessions-and-transcripts)
bölümüne bakın.

## Düşünme varsayılanları (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 ve 4.6)

`anthropic/claude-sonnet-5`, varsayılan olarak `high` efor düzeyinde uyarlanabilir düşünmeyi kullanır.
Düşünmeyi devre dışı bırakmak için `/think off`, modelin daha yüksek
yerel efor düzeyleri içinse `/think xhigh|max` kullanın. Anthropic bu modelde
söz konusu istek özelliklerini desteklemediğinden OpenClaw, Sonnet 5 için manuel
düşünme bütçelerini, özel örnekleme parametrelerini, asistan ön doldurmalarını ve Priority Tier'ı göndermez.
Katalog, 31 Ağustos 2026'ya kadar Anthropic'in başlangıç `$2/$10` girdi/çıktı fiyatlandırmasını kullanır;
standart `$3/$15` fiyatlandırması 1 Eylül 2026'da başlar.

`anthropic/claude-fable-5` her zaman uyarlanabilir düşünmeyi kullanır ve varsayılan efor düzeyi `high`
olarak belirlenmiştir. Anthropic bu model için düşünmenin devre dışı bırakılmasına izin vermediğinden
`/think off` ve `/think minimal` bunun yerine `low` efor düzeyiyle eşleştirilir. Anthropic,
düşünmenin etkin olduğu hiçbir istekte sıcaklık geçersiz kılmasını kabul etmediğinden OpenClaw ayrıca
Fable 5 isteklerinde özel sıcaklık değerlerini göndermez.

`anthropic/claude-mythos-5`, aynı sürekli etkin
uyarlanabilir düşünme sözleşmesine sahip, sınırlı erişimli bir modeldir. OpenClaw varsayılan olarak `high` kullanır,
`/think off` ve `/think minimal` değerlerini `low` ile eşleştirir ve çağıran tarafından seçilen örnekleme parametrelerini göndermez.
Katalog; modelin 1.000.000 tokenlık bağlam penceresini, 128.000 tokenlık çıktı
sınırını, görüntü girdisini ve `$10/$50` girdi/çıktı fiyatlandırmasını yayımlar.

Claude Opus 4.8'de düşünme, OpenClaw'da varsayılan olarak kapalı kalır. Uyarlanabilir düşünmeyi
`/think high|xhigh|max` ile açıkça etkinleştirdiğinizde OpenClaw,
Anthropic'in Opus 4.8 efor değerlerini gönderir; Claude 4.6 modelleri (Opus 4.6 ve Sonnet 4.6)
varsayılan olarak `adaptive` kullanır.

Her mesaj için `/think:<level>` ile veya model parametrelerinde geçersiz kılın:

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
İlgili Anthropic belgeleri:
- [Uyarlanabilir düşünme](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Genişletilmiş düşünme](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Güvenlik reddi yedek modeli (Claude Fable 5)

<Warning>
Claude Fable 5 kullanmak, Claude Opus 4.8'i de kullanmak anlamına gelir. Fable 5,
bir isteği reddedebilen güvenlik sınıflandırıcılarıyla sunulur ve Anthropic'in onayladığı
kurtarma yöntemi, söz konusu isteği `claude-opus-4-8` modelinin yanıtlamasıdır. OpenClaw,
doğrudan API anahtarı isteklerinde buna otomatik olarak katılır; dolayısıyla bazı Fable istekleri
Claude Opus 4.8 tarafından yanıtlanır ve bu model üzerinden faturalandırılır. İlkeniz veya bütçeniz
Opus tarafından yanıtlanan isteklere izin vermiyorsa `anthropic/claude-fable-5` seçmeyin.
</Warning>

### Bunun var olma nedeni

Fable 5 sınıflandırıcıları, kısıtlı alanlardaki istekler için `stop_reason: "refusal"` döndürür
ve zararsız konulara yakın çalışmalarda da yanlış pozitif sonuç verir (güvenlik
araçları, yaşam bilimleri ve hatta modelden ham muhakemesini yeniden üretmesini
istemek gibi). Yedek model olmadan, başka bir Claude modeli isteği memnuniyetle
yanıtlayabilecek olsa bile istek bir hatayla sonlanır; Anthropic'in kendi ret mesajı,
API entegratörlerine bir yedek model yapılandırmalarını söyler.

### Nasıl çalışır?

1. `anthropic/claude-fable-5` modeline doğrudan API anahtarıyla gönderilen her istek için OpenClaw,
   Anthropic'in sunucu tarafındaki yedek model katılımını gönderir:
   `server-side-fallback-2026-06-01` beta üst bilgisi ve
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8, Anthropic'in
   Fable 5 için izin verdiği tek yedek hedeftir.
2. Yalnızca güvenlik sınıflandırıcısının reddi yedek modeli tetikler. Hız sınırları,
   aşırı yükler ve sunucu hataları daha önceki gibi davranır ve
   OpenClaw'ın normal [model yük devretme](/tr/concepts/model-failover) sürecinden geçer.
3. Kurtarma aynı çağrı içinde gerçekleşir. Herhangi bir çıktıdan önceki ret,
   gecikme dışında görünmez; yanıtın tamamı Opus 4.8'den gelir. Akışın ortasında
   gerçekleşen bir rette kısmi metin, yedek modelin devam edeceği önek olarak korunurken
   reddedilen modelin muhakemesi ve araç çağrıları Anthropic'in yeniden oynatma kuralları
   uyarınca atılır (bunlar geri yansıtılmamalı veya
   yürütülmemelidir).
4. Claude Opus 4.8 de reddederse istek, bu özellikten önce olduğu gibi
   reddi hata olarak gösterir.

Yedek modele geçiş Anthropic API düzeyinde gerçekleştiğinden `claude-opus-4-8`,
yapılandırılmış model listenizde veya yedek zincirinizde bulunmak zorunda değildir; Fable özellikli
bir API anahtarı her zaman Opus'u kullanabilir.

### Gözlemlenebilirlik ve faturalandırma

- Yedek model tarafından yanıtlanan bir istek, asistan mesajına
  `fromModel` ve `toModel` adlarını belirten bir `provider_fallback` tanılaması kaydeder ve mesajın
  `responseModel` alanı `claude-opus-4-8` bildirir.
- Anthropic her denemeyi ayrı faturalandırır: çıktıdan önceki ret ücretsizdir ve kurtarma
  Claude Opus 4.8 tarifeleriyle (şu anda Fable 5 tarifelerinin yarısı) faturalandırılır. OpenClaw'ın
  istek başına maliyet tahmini, bununla uyumlu olması için yedek model tarafından yanıtlanan istekleri Opus tarifeleriyle hesaplar.
- Akışın ortasındaki bir ret, Anthropic tarafında daha önce akışla gönderilmiş Fable kısmi
  çıktısının da ayrıca faturalandırılmasına neden olur; bu bölüm API'nin deneme başına
  kullanımında bildirilir ancak OpenClaw'ın istek başına tahminine dahil edilmez.

### Kapsam

`api.anthropic.com` adresine API anahtarıyla kimlik doğrulama üzerinden yapılan
`anthropic/claude-fable-5` istekleri için geçerlidir. OAuth (Claude CLI aboneliğinin yeniden kullanılması), proxy temel URL'leri,
Bedrock, Vertex ve Foundry istekleri değişmez ve retleri hata olarak
göstermeye devam eder.

Canlı olarak doğrulandı: Fable 5'ten ham düşünce zincirini yeniden üretmesini isteyen
zararsız bir istem, yedek modeller olmadan gönderildiğinde `category: "reasoning_extraction"` ile reddedilir;
aynı istem OpenClaw üzerinden gönderildiğinde ise `provider_fallback` tanılaması eklenmiş,
Opus tarafından sağlanan normal bir yanıt döndürür.

Temel davranış için Anthropic'in [retler ve yedek model
kılavuzuna](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) bakın.

## İstem önbelleğe alma

OpenClaw, API anahtarıyla kimlik doğrulamada Anthropic'in istem önbelleğe alma özelliğini destekler.

| Değer               | Önbellek süresi | Açıklama                            |
| ------------------- | --------------- | ----------------------------------- |
| `"short"` (varsayılan) | 5 dakika        | API anahtarıyla kimlik doğrulamada otomatik olarak uygulanır |
| `"long"`            | 1 saat           | Genişletilmiş önbellek              |
| `"none"`            | Önbelleğe alma yok | İstem önbelleğe almayı devre dışı bırakır |

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
    Temel değer olarak model düzeyindeki parametreleri kullanın, ardından belirli ajanlar için `agents.list[].params` aracılığıyla geçersiz kılın:

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

    Bu, bir aracının uzun ömürlü bir önbellek tutmasına olanak tanırken aynı modeldeki başka bir aracının ani yoğunluklu/düşük yeniden kullanım oranlı trafik için önbelleğe almayı devre dışı bırakmasını sağlar.

  </Accordion>

  <Accordion title="Bedrock Claude notları">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`) yapılandırıldığında `cacheRetention` doğrudan aktarımını kabul eder.
    - Anthropic dışı Bedrock modelleri çalışma zamanında `cacheRetention: "none"` değerine zorlanır.
    - API anahtarı akıllı varsayılanları, açık bir değer ayarlanmadığında Bedrock üzerindeki Claude referansları için `cacheRetention: "short"` değerini de başlangıç değeri olarak belirler.

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Hızlı mod">
    OpenClaw'ın paylaşılan `/fast` anahtarı, `api.anthropic.com` hedefine doğrudan API anahtarı trafiği için Anthropic'in `service_tier` alanını ayarlar.

    | Komut | Eşlendiği değer |
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
    - Yalnızca bir API anahtarıyla yapılan doğrudan `api.anthropic.com` isteklerine uygulanır. OAuth/abonelik belirteci isteklerine ve proxy rotalarına hiçbir zaman `service_tier` alanı eklenmez.
    - Açık `serviceTier` veya `service_tier` parametreleri, ikisi de ayarlandığında `/fast` değerini geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"`, `standard` olarak çözümlenebilir.

    </Note>

  </Accordion>

  <Accordion title="Medya anlama (görüntü ve PDF)">
    Paketle gelen Anthropic plugin'i görüntü ve PDF anlama özelliğini kaydeder. OpenClaw,
    yapılandırılan Anthropic kimlik doğrulamasından medya yeteneklerini otomatik olarak
    çözümler; ek yapılandırma gerekmez.

    | Özellik          | Değer                 |
    | ---------------- | --------------------- |
    | Varsayılan model | `claude-opus-4-8`     |
    | Desteklenen girdi | Görüntüler, PDF belgeleri |

    Bir konuşmaya görüntü veya PDF eklendiğinde OpenClaw, bunu otomatik olarak
    Anthropic medya anlama sağlayıcısı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M bağlam penceresi">
    Claude Sonnet 5, Mythos 5 ve Fable 5, tam olarak 1.000.000 tokenlık bir girdi
    penceresine sahiptir ve 128.000'e kadar çıktı tokenını destekler. Anthropic'in 1M bağlam
    penceresi, uyarlanabilir düşünme özelliğine sahip Claude 4.x modellerinde de genel kullanıma sunulmuştur: Opus 4.8,
    Opus 4.7, Opus 4.6 ve Sonnet 4.6. OpenClaw bu modellerin boyutlarını
    otomatik olarak belirler; `params.context1m` gerekmez:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Eski yapılandırmalar `params.context1m: true` değerini koruyabilir; bu,
    bu modeller için zararsız ve etkisizdir ve OpenClaw artık kullanımdan kaldırılmış
    `context-1m-2025-08-07` beta üstbilgisini hiçbir durumda göndermez. Bu değere sahip eski `anthropicBeta` yapılandırma
    girdileri, istek üstbilgisi çözümlemesi sırasında kaldırılır ve
    desteklenmeyen eski Claude modelleri normal bağlam pencerelerini kullanmayı sürdürür.

    `params.context1m: true`, Claude CLI arka ucu
    (`claude-cli/*`) için de aynı şekilde davranır: genel kullanıma uygun Opus ve Sonnet modelleri zaten
    1M pencereyi otomatik olarak alır; dolayısıyla parametre burada da isteğe bağlıdır.

    <Warning>
    Anthropic kimlik bilgilerinizde uzun bağlam erişimi gerektirir. OAuth/abonelik belirteci kimlik doğrulaması, gerekli Anthropic beta üstbilgilerini korur; ancak eski yapılandırmada kalmışsa OpenClaw kullanımdan kaldırılan 1M beta üstbilgisini kaldırır.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M bağlamı">
    `anthropic/claude-opus-4-8` ve onun `claude-cli` varyantı varsayılan olarak 1M bağlam
    penceresine sahiptir; `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 hataları / belirtecin aniden geçersizleşmesi">
    Anthropic belirteciyle kimlik doğrulamanın süresi dolar ve bu kimlik doğrulama iptal edilebilir. Yeni kurulumlarda bunun yerine bir Anthropic API anahtarı kullanın.
  </Accordion>

  <Accordion title='"anthropic" sağlayıcısı için API anahtarı bulunamadı'>
    Anthropic kimlik doğrulaması **aracı başınadır**; yeni aracılar ana aracının anahtarlarını devralmaz. Bu aracı için ilk katılım sürecini yeniden çalıştırın (veya Gateway ana makinesinde bir API anahtarı yapılandırın), ardından `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='"anthropic:default" profili için kimlik bilgisi bulunamadı'>
    Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` komutunu çalıştırın. İlk katılım sürecini yeniden çalıştırın veya bu profil yolu için bir API anahtarı yapılandırın.
  </Accordion>

  <Accordion title="Kullanılabilir kimlik doğrulama profili yok (tümü bekleme süresinde)">
    `auth.unusableProfiles` için `openclaw models status --json` öğesini kontrol edin. Anthropic hız sınırı bekleme süreleri model kapsamlı olabilir; bu nedenle aynı gruptaki başka bir Anthropic modeli hâlâ kullanılabilir. Başka bir Anthropic profili ekleyin veya bekleme süresinin dolmasını bekleyin.
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
    Claude CLI arka uç kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="İstem önbelleğe alma" href="/tr/reference/prompt-caching" icon="database">
    İstem önbelleğe almanın sağlayıcılar genelinde nasıl çalıştığı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgilerini yeniden kullanma kuralları.
  </Card>
</CardGroup>
