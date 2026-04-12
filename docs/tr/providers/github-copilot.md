---
read_when:
    - GitHub Copilot'u model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
summary: Cihaz akışını kullanarak OpenClaw içinden GitHub Copilot'ta oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-12T23:30:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51fee006e7d4e78e37b0c29356b0090b132de727d99b603441767d3fb642140b
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot, GitHub'ın AI kodlama yardımcısıdır. GitHub hesabınız ve planınız için Copilot
modellerine erişim sağlar. OpenClaw, Copilot'u iki farklı şekilde model
sağlayıcısı olarak kullanabilir.

## OpenClaw içinde Copilot kullanmanın iki yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    Yerel cihaz giriş akışını kullanarak bir GitHub token alın, ardından OpenClaw çalışırken bunu
    Copilot API token'larıyla değiş tokuş edin. Bu, **varsayılan** ve en basit yoldur
    çünkü VS Code gerektirmez.

    <Steps>
      <Step title="Giriş komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sizden bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir. Tamamlanana kadar
        terminali açık tutun.
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        Veya yapılandırmada:

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code uzantısını yerel bir köprü olarak kullanın. OpenClaw,
    proxy'nin `/v1` uç noktasıyla konuşur ve orada yapılandırdığınız model listesini kullanır.

    <Note>
    Bunu, VS Code içinde zaten Copilot Proxy çalıştırıyorsanız veya trafiği onun
    üzerinden yönlendirmeniz gerekiyorsa seçin. Plugin'i etkinleştirmeniz ve VS Code uzantısını çalışır durumda tutmanız gerekir.
    </Note>

  </Tab>
</Tabs>

## İsteğe bağlı bayraklar

| Bayrak         | Açıklama                                             |
| -------------- | ---------------------------------------------------- |
| `--yes`        | Onay istemini atlar                                  |
| `--set-default` | Sağlayıcının önerilen varsayılan modelini de uygular |

```bash
# Onayı atla
openclaw models auth login-github-copilot --yes

# Tek adımda giriş yap ve varsayılan modeli ayarla
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gerekli">
    Cihaz giriş akışı etkileşimli bir TTY gerektirir. Bunu etkileşimsiz bir betikte veya CI işlem hattında değil,
    doğrudan bir terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot model kullanılabilirliği GitHub planınıza bağlıdır. Bir model
    reddedilirse başka bir kimlik deneyin (örneğin `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Taşıma seçimi">
    Claude model kimlikleri Anthropic Messages taşımasını otomatik olarak kullanır. GPT,
    o-serisi ve Gemini modelleri OpenAI Responses taşımasını korur. OpenClaw,
    model başvurusuna göre doğru taşımayı seçer.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot kimlik doğrulamasını ortam değişkenlerinden şu
    öncelik sırasıyla çözümler:

    | Öncelik | Değişken              | Notlar                             |
    | -------- | --------------------- | ---------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özgü |
    | 2        | `GH_TOKEN`            | GitHub CLI token'ı (yedek)         |
    | 3        | `GITHUB_TOKEN`        | Standart GitHub token'ı (en düşük) |

    Birden fazla değişken ayarlandığında OpenClaw en yüksek öncelikli olanı kullanır.
    Cihaz giriş akışı (`openclaw models auth login-github-copilot`),
    token'ını kimlik doğrulama profil deposunda saklar ve tüm ortam
    değişkenlerinden önceliklidir.

  </Accordion>

  <Accordion title="Token depolama">
    Giriş, bir GitHub token'ını kimlik doğrulama profil deposunda saklar ve OpenClaw çalışırken bunu
    bir Copilot API token'ıyla değiş tokuş eder. Token'ı
    elle yönetmeniz gerekmez.
  </Accordion>
</AccordionGroup>

<Warning>
Etkileşimli bir TTY gerektirir. Giriş komutunu __OC_I18N_900000__ doğrudan bir terminalde çalıştırın,
headless bir betik veya CI işi içinde değil.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devralma davranışını seçme.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanma kuralları.
  </Card>
</CardGroup>
