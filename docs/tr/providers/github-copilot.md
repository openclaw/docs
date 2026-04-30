---
read_when:
    - GitHub Copilot’ı bir model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
summary: Cihaz akışını veya etkileşimsiz belirteç içe aktarmayı kullanarak OpenClaw üzerinden GitHub Copilot’ta oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T09:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot, GitHub'ın AI kodlama asistanıdır. GitHub hesabınız ve planınız için Copilot
modellerine erişim sağlar. OpenClaw, Copilot'ı iki farklı şekilde model
sağlayıcısı olarak kullanabilir.

## Copilot'ı OpenClaw içinde kullanmanın iki yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    Bir GitHub belirteci almak için yerel cihazla oturum açma akışını kullanın, ardından OpenClaw
    çalışırken bunu Copilot API belirteçleriyle değiştirin. Bu, VS Code gerektirmediği için
    **varsayılan** ve en basit yoldur.

    <Steps>
      <Step title="Oturum açma komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir. Tamamlanana kadar
        terminali açık tutun.
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

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    Yerel köprü olarak **Copilot Proxy** VS Code uzantısını kullanın. OpenClaw,
    proxy'nin `/v1` uç noktasıyla iletişim kurar ve orada yapılandırdığınız model listesini kullanır.

    <Note>
    Copilot Proxy'yi zaten VS Code içinde çalıştırıyorsanız veya bunun üzerinden yönlendirme yapmanız
    gerekiyorsa bunu seçin. Plugin'i etkinleştirmeniz ve VS Code uzantısını çalışır durumda tutmanız gerekir.
    </Note>

  </Tab>
</Tabs>

## İsteğe bağlı bayraklar

| Bayrak          | Açıklama                                            |
| --------------- | --------------------------------------------------- |
| `--yes`         | Onay istemini atla                                  |
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

`--auth-choice` değerini atlayabilirsiniz; `--github-copilot-token` geçirmek,
GitHub Copilot sağlayıcısı kimlik doğrulama seçimini çıkarımlar. Bayrak atlanırsa ilk kurulum
sırasıyla `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, ardından `GITHUB_TOKEN` değerlerine geri döner.
`auth-profiles.json` içinde düz metin yerine env destekli bir `tokenRef` depolamak için
`COPILOT_GITHUB_TOKEN` ayarlanmışken `--secret-input-mode ref` kullanın.

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gerekir">
    Cihazla oturum açma akışı etkileşimli bir TTY gerektirir. Bunu etkileşimsiz bir betikte
    veya CI hattında değil, doğrudan terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot model kullanılabilirliği GitHub planınıza bağlıdır. Bir model reddedilirse
    başka bir ID deneyin (örneğin `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Aktarım seçimi">
    Claude model ID'leri otomatik olarak Anthropic Messages aktarımını kullanır. GPT,
    o-series ve Gemini modelleri OpenAI Responses aktarımını korur. OpenClaw,
    model ref değerine göre doğru aktarımı seçer.
  </Accordion>

  <Accordion title="İstek uyumluluğu">
    OpenClaw, Copilot aktarımlarında yerleşik sıkıştırma, araç sonucu ve görüntü takip turları
    dahil olmak üzere Copilot IDE tarzı istek üst bilgileri gönderir. Bu davranış Copilot'ın API'sine karşı
    doğrulanmadıkça, Copilot için sağlayıcı düzeyinde Responses devamını etkinleştirmez.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot kimlik doğrulamasını ortam değişkenlerinden aşağıdaki
    öncelik sırasına göre çözümler:

    | Öncelik | Değişken              | Notlar                           |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özel |
    | 2        | `GH_TOKEN`            | GitHub CLI belirteci (geri dönüş) |
    | 3        | `GITHUB_TOKEN`        | Standart GitHub belirteci (en düşük) |

    Birden fazla değişken ayarlandığında, OpenClaw en yüksek öncelikli olanı kullanır.
    Cihazla oturum açma akışı (`openclaw models auth login-github-copilot`), belirtecini
    kimlik doğrulama profili deposunda saklar ve tüm ortam değişkenlerine göre önceliklidir.

  </Accordion>

  <Accordion title="Belirteç depolama">
    Oturum açma işlemi, kimlik doğrulama profili deposunda bir GitHub belirteci saklar ve OpenClaw
    çalışırken bunu Copilot API belirteciyle değiştirir. Belirteci elle yönetmeniz gerekmez.
  </Accordion>
</AccordionGroup>

<Warning>
Cihazla oturum açma komutu etkileşimli bir TTY gerektirir. Başsız kurulum gerektiğinde
etkileşimsiz ilk kurulumu kullanın.
</Warning>

## Bellek araması gömmeleri

GitHub Copilot, [bellek araması](/tr/concepts/memory-search) için bir gömme sağlayıcısı olarak da
hizmet verebilir. Bir Copilot aboneliğiniz varsa ve oturum açtıysanız, OpenClaw bunu ayrı bir API anahtarı
olmadan gömmeler için kullanabilir.

### Otomatik algılama

`memorySearch.provider` `"auto"` olduğunda (varsayılan), GitHub Copilot
15 önceliğinde denenir -- yerel gömmelerden sonra, ancak OpenAI ve diğer ücretli sağlayıcılardan önce.
Bir GitHub belirteci mevcutsa, OpenClaw Copilot API'den kullanılabilir
gömme modellerini keşfeder ve en iyisini otomatik olarak seçer.

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

1. OpenClaw, GitHub belirtecinizi çözümler (env değişkenlerinden veya kimlik doğrulama profilinden).
2. Bunu kısa ömürlü bir Copilot API belirteciyle değiştirir.
3. Kullanılabilir gömme modellerini keşfetmek için Copilot `/models` uç noktasını sorgular.
4. En iyi modeli seçer (`text-embedding-3-small` tercih edilir).
5. Gömme isteklerini Copilot `/embeddings` uç noktasına gönderir.

Model kullanılabilirliği GitHub planınıza bağlıdır. Kullanılabilir gömme modeli yoksa,
OpenClaw Copilot'ı atlar ve sonraki sağlayıcıyı dener.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref değerlerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
