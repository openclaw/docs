---
read_when:
    - GitHub Copilot'ı bir model provider olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
summary: Cihaz akışını kullanarak OpenClaw içinden GitHub Copilot'ta oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T14:03:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## GitHub Copilot nedir?

GitHub Copilot, GitHub'ın yapay zeka destekli kodlama asistanıdır. GitHub
hesabınız ve planınız için Copilot modellerine erişim sağlar. OpenClaw,
Copilot'ı iki farklı şekilde model provider olarak kullanabilir.

## Copilot'ı OpenClaw içinde kullanmanın iki yolu

### 1) Yerleşik GitHub Copilot provider'ı (`github-copilot`)

Yerel cihaz giriş akışını kullanarak bir GitHub token'ı alın, ardından OpenClaw çalışırken
bunu Copilot API token'larıyla değiştirin. Bu, **varsayılan** ve en basit yoldur
çünkü VS Code gerektirmez.

### 2) Copilot Proxy plugin'i (`copilot-proxy`)

**Copilot Proxy** VS Code uzantısını yerel bir köprü olarak kullanın. OpenClaw,
proxy'nin `/v1` endpoint'i ile konuşur ve orada yapılandırdığınız model listesini kullanır. Bunu,
zaten VS Code içinde Copilot Proxy çalıştırıyorsanız veya yönlendirmeyi onun üzerinden yapmanız gerekiyorsa seçin.
Plugin'i etkinleştirmeniz ve VS Code uzantısını çalışır durumda tutmanız gerekir.

GitHub Copilot'ı (`github-copilot`) bir model provider olarak kullanın. Giriş komutu
GitHub cihaz akışını çalıştırır, bir auth profili kaydeder ve yapılandırmanızı bu
profili kullanacak şekilde günceller.

## CLI kurulumu

```bash
openclaw models auth login-github-copilot
```

Bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir. Tamamlanana kadar
terminali açık tutun.

### İsteğe bağlı bayraklar

```bash
openclaw models auth login-github-copilot --yes
```

Provider'ın önerilen varsayılan modelini de tek adımda uygulamak için bunun yerine
genel auth komutunu kullanın:

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## Varsayılan model ayarlama

```bash
openclaw models set github-copilot/gpt-4o
```

### Yapılandırma parçacığı

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Notlar

- Etkileşimli bir TTY gerektirir; doğrudan bir terminalde çalıştırın.
- Copilot model kullanılabilirliği planınıza bağlıdır; bir model reddedilirse
  başka bir kimlik deneyin (örneğin `github-copilot/gpt-4.1`).
- Claude model kimlikleri otomatik olarak Anthropic Messages aktarımını kullanır; GPT, o-series
  ve Gemini modelleri OpenAI Responses aktarımını kullanmaya devam eder.
- Giriş, auth profil deposunda bir GitHub token'ı saklar ve OpenClaw çalışırken bunu bir
  Copilot API token'ı ile değiştirir.
