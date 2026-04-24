---
read_when:
    - GitHub Copilot'ı model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
summary: OpenClaw içinden device flow kullanarak GitHub Copilot'ta oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T09:26:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot, GitHub'ın AI kodlama asistanıdır. GitHub hesabınız ve planınız için Copilot
modellerine erişim sağlar. OpenClaw, Copilot'ı bir model
sağlayıcısı olarak iki farklı şekilde kullanabilir.

## OpenClaw içinde Copilot kullanmanın iki yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    GitHub token'ı almak için yerel device-login akışını kullanın, ardından OpenClaw çalıştığında bunu
    Copilot API token'larıyla değiş tokuş edin. Bu, **varsayılan** ve en basit yoldur;
    çünkü VS Code gerektirmez.

    <Steps>
      <Step title="Giriş komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir. İşlem tamamlanana kadar
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

  <Tab title="Copilot Proxy plugin'i (copilot-proxy)">
    Yerel köprü olarak **Copilot Proxy** VS Code uzantısını kullanın. OpenClaw,
    proxy'nin `/v1` uç noktasıyla konuşur ve orada yapılandırdığınız model listesini kullanır.

    <Note>
    Bunu, VS Code içinde zaten Copilot Proxy çalıştırıyorsanız veya
    bunun üzerinden yönlendirme yapmanız gerekiyorsa seçin. Plugin'i etkinleştirmeniz ve VS Code uzantısını çalışır durumda tutmanız gerekir.
    </Note>

  </Tab>
</Tabs>

## İsteğe bağlı bayraklar

| Bayrak          | Açıklama                                          |
| --------------- | ------------------------------------------------- |
| `--yes`         | Onay istemini atlar                               |
| `--set-default` | Sağlayıcının önerilen varsayılan modelini de uygular |

```bash
# Onayı atla
openclaw models auth login-github-copilot --yes

# Giriş yap ve varsayılan modeli tek adımda ayarla
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gerekli">
    Device-login akışı etkileşimli bir TTY gerektirir. Bunu
    etkileşimsiz bir betikte veya CI ardışık düzeninde değil, doğrudan bir
    terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot model kullanılabilirliği GitHub planınıza bağlıdır. Bir model
    reddedilirse başka bir kimlik deneyin (örneğin `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Taşıma seçimi">
    Claude model kimlikleri otomatik olarak Anthropic Messages taşımasını kullanır. GPT,
    o-serisi ve Gemini modelleri OpenAI Responses taşımasını korur. OpenClaw,
    model ref'e göre doğru taşımayı seçer.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot auth'u ortam değişkenlerinden şu
    öncelik sırasıyla çözer:

    | Öncelik | Değişken              | Notlar                               |
    | ------- | --------------------- | ------------------------------------ |
    | 1       | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özgü    |
    | 2       | `GH_TOKEN`            | GitHub CLI token'ı (fallback)        |
    | 3       | `GITHUB_TOKEN`        | Standart GitHub token'ı (en düşük)   |

    Birden fazla değişken ayarlandığında OpenClaw en yüksek öncelikli olanı kullanır.
    Device-login akışı (`openclaw models auth login-github-copilot`) kendi
    token'ını auth profile deposunda saklar ve tüm ortam
    değişkenlerine üstün gelir.

  </Accordion>

  <Accordion title="Token depolama">
    Giriş işlemi, auth profile deposunda bir GitHub token'ı saklar ve OpenClaw çalıştığında bunu
    bir Copilot API token'ıyla değiş tokuş eder. Token'ı
    elle yönetmeniz gerekmez.
  </Accordion>
</AccordionGroup>

<Warning>
Etkileşimli TTY gerektirir. Giriş komutunu başsız bir betik veya CI işi içinde
değil, doğrudan bir terminalde çalıştırın.
</Warning>

## Bellek araması embedding'leri

GitHub Copilot, [memory search](/tr/concepts/memory-search) için
bir embedding sağlayıcısı olarak da hizmet verebilir. Copilot aboneliğiniz varsa ve
giriş yaptıysanız, OpenClaw bunu ayrı bir API anahtarı olmadan embedding'ler için kullanabilir.

### Otomatik algılama

`memorySearch.provider` değeri `"auto"` olduğunda (varsayılan), GitHub Copilot
15. öncelikte denenir — yerel embedding'lerden sonra, OpenAI ve diğer ücretli
sağlayıcılardan önce. Bir GitHub token'ı varsa OpenClaw, kullanılabilir
embedding modellerini Copilot API'den keşfeder ve en iyisini otomatik olarak seçer.

### Açık yapılandırma

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

### Nasıl çalışır

1. OpenClaw GitHub token'ınızı çözer (ortam değişkenlerinden veya auth profile'dan).
2. Bunu kısa ömürlü bir Copilot API token'ıyla değiş tokuş eder.
3. Kullanılabilir embedding modellerini keşfetmek için Copilot `/models` uç noktasını sorgular.
4. En iyi modeli seçer (`text-embedding-3-small` modelini tercih eder).
5. Embedding isteklerini Copilot `/embeddings` uç noktasına gönderir.

Model kullanılabilirliği GitHub planınıza bağlıdır. Hiç embedding modeli
kullanılabilir değilse OpenClaw Copilot'ı atlar ve bir sonraki sağlayıcıyı dener.

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Auth ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
