---
read_when:
    - GitHub Copilot'u model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
summary: Cihaz akışını veya etkileşimsiz belirteç içe aktarmayı kullanarak OpenClaw'dan GitHub Copilot'ta oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-10T19:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot, GitHub'ın AI kodlama asistanıdır. GitHub hesabınız ve planınız için Copilot
modellerine erişim sağlar. OpenClaw, Copilot'u iki farklı şekilde model
sağlayıcısı olarak kullanabilir.

## OpenClaw'da Copilot'u kullanmanın iki yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    GitHub belirteci almak için yerel cihazla oturum açma akışını kullanın, ardından OpenClaw çalıştığında bunu
    Copilot API belirteçleriyle değiştirin. Bu, VS Code gerektirmediği için **varsayılan** ve en basit yoldur.

    <Steps>
      <Step title="Oturum açma komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir. İşlem tamamlanana kadar
        terminali açık tutun.
      </Step>
      <Step title="Varsayılan model belirleyin">
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

  <Tab title="Copilot Proxy Plugin'i (copilot-proxy)">
    Yerel köprü olarak **Copilot Proxy** VS Code uzantısını kullanın. OpenClaw, proxy'nin
    `/v1` uç noktasıyla iletişim kurar ve orada yapılandırdığınız model listesini kullanır.

    <Note>
    VS Code'da zaten Copilot Proxy çalıştırıyorsanız veya trafiği onun üzerinden yönlendirmeniz gerekiyorsa bunu seçin.
    Plugin'i etkinleştirmeniz ve VS Code uzantısını çalışır durumda tutmanız gerekir.
    </Note>

  </Tab>
</Tabs>

## İsteğe bağlı bayraklar

| Bayrak          | Açıklama                                            |
| --------------- | --------------------------------------------------- |
| `--yes`         | Onay istemini atla                                 |
| `--set-default` | Sağlayıcının önerilen varsayılan modelini de uygula |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Etkileşimsiz ilk kurulum

Copilot için zaten bir GitHub OAuth erişim belirteciniz varsa, başsız kurulum sırasında
`openclaw onboard --non-interactive` ile içe aktarın:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice` seçeneğini atlayabilirsiniz; `--github-copilot-token` iletildiğinde
GitHub Copilot sağlayıcı kimlik doğrulama seçimi çıkarımsanır. Bayrak atlanırsa, ilk kurulum
sırasıyla `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, ardından `GITHUB_TOKEN` değerlerine geri döner. Düz metin yerine
`auth-profiles.json` içinde env destekli bir `tokenRef` depolamak için `COPILOT_GITHUB_TOKEN` ayarlanmışken
`--secret-input-mode ref` kullanın.

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gerekli">
    Cihazla oturum açma akışı etkileşimli bir TTY gerektirir. Bunu etkileşimsiz bir betik veya CI işlem hattında değil,
    doğrudan terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot model kullanılabilirliği GitHub planınıza bağlıdır. Bir model reddedilirse
    başka bir ID deneyin (örneğin `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Copilot API'den canlı katalog yenileme">
    Cihazla oturum açma (veya env-var) kimlik doğrulama yolu bir GitHub belirtecini çözdükten sonra,
    OpenClaw model kataloğunu talep üzerine `${baseUrl}/models`
    üzerinden yeniler (VS Code Copilot'un kullandığı aynı uç nokta); böylece çalışma zamanı
    manifesto değişimi olmadan hesap başına yetkilendirmeyi ve doğru bağlam pencerelerini izler.
    Yeni yayımlanan Copilot modelleri OpenClaw yükseltmesi olmadan görünür hale gelir ve
    bağlam pencereleri gerçek model başına sınırları yansıtır
    (ör. gpt-5.x serisi için 400k, dahili
    `claude-opus-*-1m` varyantları için 1M).

    Keşif devre dışıysa, kullanıcının GitHub kimlik doğrulama profili yoksa, belirteç değişimi
    başarısız olursa veya `/models` HTTPS çağrısı hata verirse paketlenen statik katalog görünür yedek olarak kalır.
    Tamamen statik manifesto kataloğuna güvenmek ve bundan çıkmak için (çevrimdışı / air-gapped senaryolar):

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
    Claude model ID'leri Anthropic Messages aktarımını otomatik olarak kullanır. GPT,
    o-series ve Gemini modelleri OpenAI Responses aktarımını korur. OpenClaw
    doğru aktarımı model ref'e göre seçer.
  </Accordion>

  <Accordion title="İstek uyumluluğu">
    OpenClaw, yerleşik Compaction, araç sonucu ve görüntü takip turları dahil olmak üzere
    Copilot aktarımlarında Copilot IDE tarzı istek üst bilgileri gönderir. Bu davranış
    Copilot API'sine karşı doğrulanmadıkça, Copilot için sağlayıcı düzeyinde Responses devamını
    etkinleştirmez.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot kimlik doğrulamasını ortam değişkenlerinden aşağıdaki öncelik sırasıyla çözer:

    | Öncelik | Değişken              | Notlar                           |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özgü |
    | 2        | `GH_TOKEN`            | GitHub CLI belirteci (yedek)     |
    | 3        | `GITHUB_TOKEN`        | Standart GitHub belirteci (en düşük) |

    Birden fazla değişken ayarlandığında OpenClaw en yüksek öncelikli olanı kullanır.
    Cihazla oturum açma akışı (`openclaw models auth login-github-copilot`)
    belirtecini kimlik doğrulama profili deposunda saklar ve tüm ortam
    değişkenlerine göre önceliklidir.

  </Accordion>

  <Accordion title="Belirteç depolama">
    Oturum açma, kimlik doğrulama profili deposunda bir GitHub belirteci saklar ve OpenClaw çalıştığında bunu
    bir Copilot API belirteciyle değiştirir. Belirteci elle yönetmeniz gerekmez.
  </Accordion>
</AccordionGroup>

<Warning>
Cihazla oturum açma komutu etkileşimli bir TTY gerektirir. Başsız kurulum gerektiğinde etkileşimsiz
ilk kurulumu kullanın.
</Warning>

## Bellek araması embedding'leri

GitHub Copilot, [bellek araması](/tr/concepts/memory-search) için
embedding sağlayıcısı olarak da hizmet verebilir. Bir Copilot aboneliğiniz varsa ve oturum açtıysanız,
OpenClaw bunu ayrı bir API anahtarı olmadan embedding'ler için kullanabilir.

### Otomatik algılama

`memorySearch.provider` `"auto"` olduğunda (varsayılan), GitHub Copilot
öncelik 15'te denenir -- yerel embedding'lerden sonra, ancak OpenAI ve diğer ücretli
sağlayıcılardan önce. Bir GitHub belirteci kullanılabiliyorsa, OpenClaw kullanılabilir
embedding modellerini Copilot API'den keşfeder ve en iyisini otomatik olarak seçer.

### Açık yapılandırma

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Nasıl çalışır

1. OpenClaw GitHub belirtecinizi çözer (env vars veya kimlik doğrulama profilinden).
2. Bunu kısa ömürlü bir Copilot API belirteciyle değiştirir.
3. Kullanılabilir embedding modellerini keşfetmek için Copilot `/models` uç noktasını sorgular.
4. En iyi modeli seçer (`text-embedding-3-small` tercih edilir).
5. Embedding isteklerini Copilot `/embeddings` uç noktasına gönderir.

Model kullanılabilirliği GitHub planınıza bağlıdır. Kullanılabilir embedding modeli yoksa,
OpenClaw Copilot'u atlar ve sonraki sağlayıcıyı dener.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
