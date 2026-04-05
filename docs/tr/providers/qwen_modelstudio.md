---
x-i18n:
    generated_at: "2026-04-05T14:04:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "Paketlenmiş qwen sağlayıcısı ve eski modelstudio uyumluluk yüzeyi için uç nokta ayrıntıları"
read_when:

- Qwen Cloud / Alibaba DashScope için uç nokta düzeyinde ayrıntı istiyorsunuz
- qwen sağlayıcısı için env var uyumluluk hikayesine ihtiyacınız var
- Standard (kullandıkça öde) veya Coding Plan uç noktasını kullanmak istiyorsunuz

---

# Qwen / Model Studio (Alibaba Cloud)

Bu sayfa, OpenClaw'ın paketlenmiş `qwen`
sağlayıcısının arkasındaki uç nokta eşlemesini belgelemektedir. Sağlayıcı, `qwen` kanonik
yüzey olurken `modelstudio` sağlayıcı kimliklerini, auth-choice kimliklerini ve
model referanslarını uyumluluk takma adları olarak çalışır durumda tutar.

<Info>

**`qwen3.6-plus`** gerekiyorsa **Standard (kullandıkça öde)** seçeneğini tercih edin. Coding
Plan kullanılabilirliği herkese açık Model Studio kataloğunun gerisinde kalabilir ve
Coding Plan API'si, model planınızın desteklenen model listesinde görünene kadar bir modeli reddedebilir.

</Info>

- Sağlayıcı: `qwen` (eski takma ad: `modelstudio`)
- Kimlik doğrulama: `QWEN_API_KEY`
- Kabul edilen diğerleri: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: OpenAI uyumlu

## Hızlı başlangıç

### Standard (kullandıkça öde)

```bash
# China endpoint
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan (abonelik)

```bash
# China endpoint
openclaw onboard --auth-choice qwen-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-api-key
```

Eski `modelstudio-*` auth-choice kimlikleri uyumluluk takma adları olarak hâlâ çalışır, ancak
kanonik onboarding kimlikleri yukarıda gösterilen `qwen-*` seçenekleridir.

Onboarding'den sonra varsayılan bir model ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Plan türleri ve uç noktalar

| Plan                       | Bölge  | Auth choice                | Uç nokta                                        |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (kullandıkça öde) | Çin    | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (kullandıkça öde) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonelik)     | Çin    | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonelik)     | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Sağlayıcı, auth choice seçiminize göre uç noktayı otomatik olarak seçer. Kanonik
seçenekler `qwen-*` ailesini kullanır; `modelstudio-*` yalnızca uyumluluk içindir.
Yapılandırmada özel bir `baseUrl` ile
geçersiz kılabilirsiniz.

Yerel Model Studio uç noktaları, paylaşılan `openai-completions` aktarımı üzerinde
akışlı kullanım uyumluluğunu duyurur. OpenClaw artık bunu uç nokta
yeteneklerine göre belirliyor; bu nedenle aynı yerel ana makinelere yönelen DashScope uyumlu özel sağlayıcı kimlikleri,
özellikle yerleşik `qwen` sağlayıcı kimliğini gerektirmek yerine
aynı akışlı kullanım davranışını devralır.

## API anahtarınızı alın

- **Anahtarları yönetin**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Belgeler**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Yerleşik katalog

OpenClaw şu anda şu paketlenmiş Qwen kataloğuyla gelir:

| Model ref                   | Girdi       | Bağlam    | Notlar                                             |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Varsayılan model                                   |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Bu modele ihtiyacınız varsa Standard uç noktaları tercih edin |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Qwen Max hattı                                     |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Kodlama                                            |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Kodlama                                            |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Reasoning etkin                                    |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Alibaba üzerinden Moonshot AI                      |

Bir model paketlenmiş katalogda mevcut olsa bile kullanılabilirlik
uç noktaya ve faturalandırma planına göre değişebilir.

Yerel akış uyumluluğu hem Coding Plan ana makineleri hem de
Standard DashScope uyumlu ana makineler için geçerlidir:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Qwen 3.6 Plus kullanılabilirliği

`qwen3.6-plus`, Standard (kullandıkça öde) Model Studio
uç noktalarında kullanılabilir:

- Çin: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Coding Plan uç noktaları `qwen3.6-plus` için "unsupported model" hatası döndürüyorsa,
Coding Plan uç noktası/anahtar çifti yerine Standard (kullandıkça öde) seçeneğine geçin.

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (launchd/systemd),
`QWEN_API_KEY` değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin,
`~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
