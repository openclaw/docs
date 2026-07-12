---
read_when:
    - GitHub Copilot'ı model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
    - Yerleşik Copilot sağlayıcısı, Copilot SDK çalışma düzeneği ve Copilot Proxy arasında seçim yapıyorsunuz.
summary: Cihaz akışını veya etkileşimsiz token içe aktarmayı kullanarak OpenClaw üzerinden GitHub Copilot'ta oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T12:39:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot, GitHub'ın yapay zekâ destekli kodlama asistanıdır. GitHub
hesabınız ve planınız kapsamındaki Copilot modellerine erişim sağlar. OpenClaw,
Copilot'ı model sağlayıcısı veya ajan çalışma zamanı olarak üç farklı şekilde
kullanabilir.

## OpenClaw'da Copilot'ı kullanmanın üç yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    Bir GitHub belirteci almak için yerel cihazla oturum açma akışını kullanın;
    ardından OpenClaw çalışırken bu belirteç Copilot API belirteçleriyle değiştirilir.
    VS Code gerektirmediği için bu, **varsayılan** ve en basit yoldur.

    <Steps>
      <Step title="Oturum açma komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir.
        İşlem tamamlanana kadar terminali açık tutun.
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Veya yapılandırmada:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot SDK çalıştırma düzeneği plugini (copilot)">
    Seçili `github-copilot/*` modellerinde düşük seviyeli ajan döngüsünü GitHub'ın
    Copilot CLI ve SDK'sının yönetmesini istediğinizde harici `@openclaw/copilot`
    pluginini yükleyin.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Ardından bir modeli veya sağlayıcıyı çalışma zamanına açıkça dahil edin:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Bu ajan turları için yerel Copilot CLI oturumları, SDK tarafından yönetilen
    iş parçacığı durumu ve Copilot tarafından yönetilen Compaction istediğinizde
    bunu seçin. Açık `agentRuntime` katılımı olmadan `github-copilot/*` modelleri
    yerleşik sağlayıcıyı kullanmaya devam eder. Çalışma zamanı sözleşmesinin
    tamamı için [Copilot SDK çalıştırma düzeneği](/tr/plugins/copilot) sayfasına bakın.

  </Tab>

  <Tab title="Copilot Proxy plugini (copilot-proxy)">
    Yerel köprü olarak **Copilot Proxy** VS Code uzantısını kullanın. OpenClaw,
    proxy'nin `/v1` uç noktasıyla (varsayılan `http://localhost:3000/v1`) iletişim
    kurar ve yapılandırdığınız model listesini kullanır.

    `copilot-proxy` plugini OpenClaw ile birlikte gelir ve varsayılan olarak etkindir.
    Temel URL'yi ve model kimliklerini şu komutla yapılandırın:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    VS Code'da zaten Copilot Proxy çalıştırıyorsanız veya trafiği onun üzerinden
    yönlendirmeniz gerekiyorsa bunu seçin. VS Code uzantısı çalışmaya devam etmelidir.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (veri yerleşimi)

Kuruluşunuz veri yerleşimli bir GitHub Enterprise kiracısı (`your-org.ghe.com`
gibi bir `*.ghe.com` ana bilgisayarı) kullanıyorsa Copilot, herkese açık
`github.com` yerine kiracıya özel uç noktalarda bulunur. OpenClaw bunu birinci
sınıf bir kimlik doğrulama seçeneği olarak sunar; böylece URL'leri elle
düzenlemeniz gerekmez.

<Steps>
  <Step title="Enterprise kimlik doğrulama seçeneğini belirleyin">
    İlk katılımda veya `openclaw models auth` içinde
    **GitHub Copilot (Enterprise / data residency)** seçeneğini belirleyin.
    Enterprise alan adınız istenir (örneğin `your-org.ghe.com`), ardından cihazla
    oturum açma işlemi bu kiracı üzerinden yürütülür.

    Yalnızca kiracı kökünü (`your-org.ghe.com`) girin. `api.your-org.ghe.com`
    veya `copilot-api.your-org.ghe.com` gibi türetilmiş hizmet ana bilgisayarları
    kabul edilmez; OpenClaw bu uç noktaları kiracı kökünden otomatik olarak türetir.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="Alan adı yapılandırmada kalıcı olarak saklanır">
    Seçilen ana bilgisayar sağlayıcı parametreleri altında saklanır; böylece
    sonraki belirteç yenilemeleri ve tamamlamalar otomatik olarak kiracıyı hedefler:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

Cihaz akışı, belirteç değişimi ve tamamlamalar sırasıyla
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` ve
`https://copilot-api.your-org.ghe.com` adreslerine çözümlenir. Veri yerleşimi
belirteçleri bir kiracı damgası taşır ve proxy ipucu içermez; bu nedenle
tamamlamaların temel URL'si herkese açık uç nokta yerine kiracının Copilot ana
bilgisayarına geri döner.

<Note>
Alan adını değiştirmek her zaman cihazla oturum açma işlemini yeniden çalıştırır.
Zaten saklanmış bir Copilot belirteciniz varken farklı bir alan adı seçerseniz
(herkese açık `github.com` ↔ bir `*.ghe.com` kiracısı veya bir kiracıdan diğerine),
OpenClaw mevcut belirteci yeniden kullanmaz; belirtecin yapılandırmaya yazılan alan
adıyla sınırlandırılması için yeni bir oturum açmayı zorunlu kılar. *Aynı* alan
adı için oturum açmayı yeniden çalıştırdığınızda mevcut belirteci yeniden kullanma
seçeneği sunulmaya devam eder. Herkese açık `github.com` alan adına geri dönmek,
kalıcı `githubDomain` değerini temizleyerek yapılandırmayı varsayılana döndürür.
</Note>

<Note>
`COPILOT_GITHUB_DOMAIN` ortam değişkeni, alan adını çözümleyen tüm Copilot
yollarında çözümlenen alan adını geçersiz kılar: Enterprise cihazla oturum açma
(`--method device-enterprise`), bağımsız
`openclaw models auth login-github-copilot` kısayolu, belirteç yenileme, gömmeler
ve tamamlamalar. Tamamen ekransız veya CI kurulumları için bunu `*.ghe.com` ana
bilgisayarınıza ayarlayın. Herkese açık `github.com` kullanmak için ayarlamayın
(ve yapılandırma parametresini eklemeyin). Oturum açma işlemleri, belirteci
oluşturdukları alan adını kalıcı olarak saklar (ve herkese açık `github.com`
üzerinden oturum açarken temizler); böylece ortam değişkeni kaldırıldıktan sonra
bile yönlendirme doğru kalır.
</Note>

## İsteğe bağlı bayraklar

| Komut                                                                  | Bayrak          | Açıklama                                                    |
| ---------------------------------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Mevcut kimlik doğrulama profilinin üzerine sormadan yaz      |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Sağlayıcının önerdiği varsayılan modeli de uygula            |

```bash
# Yeniden oturum açma onayını atla
openclaw models auth login-github-copilot --yes

# Tek adımda oturum aç ve varsayılan modeli ayarla
openclaw models auth login --provider github-copilot --method device --set-default
```

## Etkileşimsiz ilk katılım

Cihazla oturum açma akışı etkileşimli bir TTY gerektirir. Ekransız kurulum için
mevcut bir GitHub OAuth erişim belirtecini `openclaw onboard --non-interactive`
ile içe aktarın:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice` bayrağını da atlayabilirsiniz; `--github-copilot-token`
iletilmesi GitHub Copilot sağlayıcısının kimlik doğrulama seçeneğini belirler.
Bayrak belirtilmezse ilk katılım sırasıyla `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
ve ardından `GITHUB_TOKEN` değişkenlerine geri döner. Belirteci
`auth-profiles.json` içinde düz metin yerine ortam değişkeni destekli bir
`tokenRef` olarak saklamak için `COPILOT_GITHUB_TOKEN` ayarlanmışken
`--secret-input-mode ref` kullanın.

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gereklidir">
    Cihazla oturum açma akışı etkileşimli bir TTY gerektirir. Etkileşimsiz bir
    betikte veya CI işlem hattında değil, doğrudan bir terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot modellerinin kullanılabilirliği GitHub planınıza bağlıdır. Bir model
    reddedilirse başka bir kimlik deneyin (örneğin `github-copilot/gpt-5.5`).
    Güncel model listesi için GitHub'ın
    [Copilot planına göre desteklenen modeller](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    sayfasına bakın.
  </Accordion>

  <Accordion title="Copilot API'den canlı katalog yenileme">
    Cihazla oturum açma (veya ortam değişkeni) kimlik doğrulama yolu bir GitHub
    belirtecini çözümledikten sonra OpenClaw, çalışma zamanının bildirim dosyası
    değişiklikleri olmadan hesap bazlı yetkileri ve doğru bağlam pencerelerini
    izlemesi için model kataloğunu isteğe bağlı olarak `${baseUrl}/models`
    uç noktasından (VS Code Copilot'ın kullandığı uç noktayla aynı) yeniler.
    Yeni yayımlanan Copilot modelleri OpenClaw yükseltmesi olmadan görünür hâle
    gelir ve bağlam pencereleri model başına gerçek sınırları yansıtır (örneğin
    gpt-5.x serisi için 400 bin, dahili `claude-opus-*-1m` çeşitleri için 1 milyon).

    Keşif devre dışı bırakıldığında, kullanıcının GitHub kimlik doğrulama profili
    bulunmadığında, belirteç değişimi başarısız olduğunda veya `/models` HTTPS
    çağrısı hata verdiğinde paketle gelen statik katalog görünür geri dönüş
    seçeneği olarak kalır. Bu işlevi devre dışı bırakıp tamamen statik bildirim
    dosyası kataloğuna dayanmak için (çevrimdışı / hava boşluklu senaryolar):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Aktarım seçimi">
    Claude model kimlikleri Anthropic Messages aktarımını otomatik olarak kullanır.
    Gemini modelleri OpenAI Chat Completions aktarımını kullanır; GPT ve o-serisi
    modeller OpenAI Responses aktarımını kullanmaya devam eder. OpenClaw, model
    referansına göre doğru aktarımı seçer.
  </Accordion>

  <Accordion title="İstek uyumluluğu">
    OpenClaw, Copilot aktarımlarında Copilot IDE tarzı istek üstbilgileri
    (VS Code düzenleyici/plugin sürümleri ve `vscode-chat` entegrasyon kimliği)
    gönderir, araç sonucu takip turlarını ajan tarafından başlatılmış olarak
    işaretler ve bir tur görüntü girdisi taşıdığında Copilot görüntü üstbilgisini
    ayarlar.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot kimlik doğrulamasını ortam değişkenlerinden aşağıdaki
    öncelik sırasına göre çözümler:

    | Öncelik | Değişken               | Notlar                                      |
    | ------- | ---------------------- | ------------------------------------------- |
    | 1       | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özel           |
    | 2       | `GH_TOKEN`             | GitHub CLI belirteci (geri dönüş seçeneği)  |
    | 3       | `GITHUB_TOKEN`         | Standart GitHub belirteci (en düşük)        |

    Birden fazla değişken ayarlandığında OpenClaw en yüksek öncelikli olanı
    kullanır. Cihazla oturum açma akışı
    (`openclaw models auth login-github-copilot`), belirtecini kimlik doğrulama
    profili deposunda saklar ve tüm ortam değişkenlerinden önce gelir.

  </Accordion>

  <Accordion title="Belirteç depolama">
    Oturum açma işlemi, kimlik doğrulama profili deposunda (`github-copilot:github`
    profil kimliğiyle) bir GitHub belirteci saklar ve OpenClaw çalışırken bunu
    kısa ömürlü bir Copilot API belirteciyle değiştirir. Belirteci elle yönetmeniz
    gerekmez.
  </Accordion>
</AccordionGroup>

## Bellek araması gömmeleri

GitHub Copilot, [bellek araması](/tr/concepts/memory-search) için gömme sağlayıcısı
olarak da hizmet verebilir. Copilot aboneliğiniz varsa ve oturum açtıysanız
OpenClaw, ayrı bir API anahtarı olmadan gömmeler için Copilot'ı kullanabilir.

### Yapılandırma

GitHub Copilot gömmelerini kullanmak için `memorySearch.provider` değerini açıkça
ayarlayın. Bir GitHub belirteci mevcutsa OpenClaw, kullanılabilir gömme modellerini
Copilot API'den keşfeder ve en iyi olanı otomatik olarak seçer.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // İsteğe bağlı: otomatik keşfedilen modeli geçersiz kıl
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Nasıl çalışır?

1. OpenClaw, GitHub belirtecinizi (ortam değişkenlerinden veya kimlik doğrulama profilinden) çözümler.
2. Bunu kısa ömürlü bir Copilot API belirteciyle değiştirir.
3. Kullanılabilir gömme modellerini keşfetmek için Copilot `/models` uç noktasını sorgular.
4. En iyi modeli seçer (tercih sırası: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Gömme isteklerini Copilot `/embeddings` uç noktasına gönderir.

Model kullanılabilirliği GitHub planınıza bağlıdır. Kullanılabilir gömme modeli
yoksa OpenClaw, Copilot'ı atlar ve sonraki sağlayıcıyı dener.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgilerini yeniden kullanma kuralları.
  </Card>
</CardGroup>
