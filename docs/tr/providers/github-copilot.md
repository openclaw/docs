---
read_when:
    - GitHub Copilot'u model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
    - Yerleşik Copilot sağlayıcısı, Copilot SDK harness ve Copilot Proxy arasında seçim yapıyorsunuz
summary: Cihaz akışını veya etkileşimsiz belirteç içe aktarmayı kullanarak OpenClaw üzerinden GitHub Copilot'ta oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-28T01:10:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot, GitHub'ın AI kodlama asistanıdır. GitHub hesabınız ve planınız için Copilot
modellerine erişim sağlar. OpenClaw, Copilot'ı üç farklı şekilde model
sağlayıcısı veya aracı çalışma zamanı olarak kullanabilir.

## OpenClaw'da Copilot kullanmanın üç yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    GitHub token'ı almak için yerel cihazla oturum açma akışını kullanın, ardından OpenClaw çalıştığında bunu
    Copilot API token'larıyla değiştirin. Bu **varsayılan** ve en basit yoldur
    çünkü VS Code gerektirmez.

    <Steps>
      <Step title="Oturum açma komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir. İşlem
        tamamlanana kadar terminali açık tutun.
      </Step>
      <Step title="Varsayılan model ayarlayın">
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

  <Tab title="Copilot SDK harness Plugin'i (copilot)">
    Seçili `github-copilot/*` modelleri için düşük seviyeli aracı döngüsünü GitHub'ın
    Copilot CLI ve SDK'sının yönetmesini istediğinizde harici `@openclaw/copilot`
    Plugin'ini kurun.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Ardından bir modeli veya sağlayıcıyı çalışma zamanına dahil edin:

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

    Bu aracı dönüşleri için yerel Copilot CLI oturumları, SDK tarafından yönetilen iş parçacığı
    durumu ve Copilot'a ait compaction istediğinizde bunu seçin. Tam çalışma zamanı sözleşmesi için
    [Copilot SDK harness](/tr/plugins/copilot) bölümüne bakın.

  </Tab>

  <Tab title="Copilot Proxy Plugin'i (copilot-proxy)">
    Yerel köprü olarak **Copilot Proxy** VS Code uzantısını kullanın. OpenClaw,
    proxy'nin `/v1` uç noktasıyla konuşur ve orada yapılandırdığınız model listesini kullanır.

    <Note>
    Copilot Proxy'yi zaten VS Code içinde çalıştırıyorsanız veya trafiği onun üzerinden yönlendirmeniz
    gerekiyorsa bunu seçin. Plugin'i etkinleştirmeli ve VS Code uzantısını çalışır durumda tutmalısınız.
    </Note>

  </Tab>
</Tabs>

## İsteğe bağlı bayraklar

| Bayrak          | Açıklama                                            |
| --------------- | --------------------------------------------------- |
| `--yes`         | Onay istemini atla                                  |
| `--set-default` | Sağlayıcının önerilen varsayılan modelini de uygula |

```bash
# Onayı atla
openclaw models auth login-github-copilot --yes

# Tek adımda oturum aç ve varsayılan modeli ayarla
openclaw models auth login --provider github-copilot --method device --set-default
```

## Etkileşimsiz ilk kurulum

Copilot için zaten bir GitHub OAuth erişim token'ınız varsa, başsız kurulum sırasında
`openclaw onboard --non-interactive` ile içe aktarın:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice` değerini atlayabilirsiniz; `--github-copilot-token` geçirmek,
GitHub Copilot sağlayıcısı kimlik doğrulama seçimini çıkarır. Bayrak atlanırsa, ilk kurulum
sırasıyla `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, ardından `GITHUB_TOKEN` değerlerine geri döner. Düz metin yerine
`auth-profiles.json` içinde env destekli bir `tokenRef` saklamak için `COPILOT_GITHUB_TOKEN` ayarlanmış halde
`--secret-input-mode ref` kullanın.

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gerekli">
    Cihazla oturum açma akışı etkileşimli bir TTY gerektirir. Bunu etkileşimsiz bir betikte
    veya CI işlem hattında değil, doğrudan bir terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot model kullanılabilirliği GitHub planınıza bağlıdır. Bir model
    reddedilirse başka bir ID deneyin (örneğin `github-copilot/gpt-5.5`). Güncel model listesi için
    GitHub'ın [Copilot planına göre desteklenen modeller](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    sayfasına bakın.
  </Accordion>

  <Accordion title="Copilot API'den canlı katalog yenileme">
    Cihazla oturum açma (veya env-var) kimlik doğrulama yolu bir GitHub token'ı çözdüğünde,
    OpenClaw model kataloğunu isteğe bağlı olarak `${baseUrl}/models` üzerinden yeniler
    (VS Code Copilot'ın kullandığı aynı uç nokta); böylece çalışma zamanı
    hesap bazlı yetkilendirmeyi ve doğru bağlam pencerelerini manifest
    değişimi olmadan izler. Yeni yayımlanan Copilot modelleri OpenClaw
    yükseltmesi olmadan görünür hale gelir ve bağlam pencereleri gerçek model bazlı sınırları yansıtır
    (örn. gpt-5.x serisi için 400k, dahili
    `claude-opus-*-1m` varyantları için 1M).

    Paketlenmiş statik katalog; keşif devre dışı olduğunda, kullanıcının GitHub kimlik doğrulama profili olmadığında,
    token değişimi başarısız olduğunda veya `/models` HTTPS çağrısı hata verdiğinde görünür geri dönüş olarak kalır.
    Tamamen statik manifest kataloğuna dayanmak ve bundan çıkmak için (çevrimdışı / hava boşluklu senaryolar):

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
    doğru aktarımı model ref değerine göre seçer.
  </Accordion>

  <Accordion title="İstek uyumluluğu">
    OpenClaw, yerleşik compaction, araç sonucu ve görüntü takip dönüşleri dahil olmak üzere Copilot aktarımlarında
    Copilot IDE tarzı istek başlıkları gönderir. Bu davranış Copilot API'ye karşı doğrulanmadıkça
    Copilot için sağlayıcı düzeyinde Responses devamını etkinleştirmez.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot kimlik doğrulamasını ortam değişkenlerinden aşağıdaki
    öncelik sırasına göre çözer:

    | Öncelik | Değişken              | Notlar                           |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özel |
    | 2        | `GH_TOKEN`            | GitHub CLI token'ı (geri dönüş)  |
    | 3        | `GITHUB_TOKEN`        | Standart GitHub token'ı (en düşük) |

    Birden çok değişken ayarlandığında OpenClaw en yüksek öncelikli olanı kullanır.
    Cihazla oturum açma akışı (`openclaw models auth login-github-copilot`) token'ını
    kimlik doğrulama profili deposunda saklar ve tüm ortam değişkenlerine göre önceliklidir.

  </Accordion>

  <Accordion title="Token depolama">
    Oturum açma işlemi, kimlik doğrulama profili deposunda bir GitHub token'ı saklar ve OpenClaw çalıştığında bunu
    bir Copilot API token'ıyla değiştirir. Token'ı elle yönetmeniz gerekmez.
  </Accordion>
</AccordionGroup>

<Warning>
Cihazla oturum açma komutu etkileşimli bir TTY gerektirir. Başsız kurulum gerektiğinde
etkileşimsiz ilk kurulumu kullanın.
</Warning>

## Bellek arama embedding'leri

GitHub Copilot, [bellek araması](/tr/concepts/memory-search) için
embedding sağlayıcısı olarak da hizmet verebilir. Copilot aboneliğiniz varsa ve
oturum açtıysanız, OpenClaw bunu ayrı bir API anahtarı olmadan embedding'ler için kullanabilir.

### Yapılandırma

GitHub Copilot embedding'lerini kullanmak için `memorySearch.provider` değerini açıkça ayarlayın.
Bir GitHub token'ı mevcutsa, OpenClaw kullanılabilir embedding modellerini
Copilot API'den keşfeder ve en iyisini otomatik olarak seçer.

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

1. OpenClaw GitHub token'ınızı çözer (env değişkenlerinden veya kimlik doğrulama profilinden).
2. Bunu kısa ömürlü bir Copilot API token'ıyla değiştirir.
3. Kullanılabilir embedding modellerini keşfetmek için Copilot `/models` uç noktasını sorgular.
4. En iyi modeli seçer (`text-embedding-3-small` tercih edilir).
5. Embedding isteklerini Copilot `/embeddings` uç noktasına gönderir.

Model kullanılabilirliği GitHub planınıza bağlıdır. Hiç embedding modeli
yoksa OpenClaw Copilot'ı atlar ve sonraki sağlayıcıyı dener.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref değerlerini ve yük devri davranışını seçme.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
