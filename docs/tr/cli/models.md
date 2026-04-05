---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, yedekler, kimlik doğrulama)'
title: models
x-i18n:
    generated_at: "2026-04-05T13:49:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Model keşfi, tarama ve yapılandırma (varsayılan model, yedekler, kimlik doğrulama profilleri).

İlgili:

- Sağlayıcılar + modeller: [Models](/providers/models)
- Sağlayıcı kimlik doğrulama kurulumu: [Başlarken](/start/getting-started)

## Yaygın komutlar

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`, çözümlenen varsayılan modeli/yedekleri ve bir kimlik doğrulama genel görünümünü gösterir.
Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda, OAuth/API anahtarı durumu bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mevcut olduğunda
sağlayıcıya özgü hook'lardan gelir; aksi halde OpenClaw, auth profillerinden, env'den veya config'den
eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama probları çalıştırmak için `--probe` ekleyin.
Problar gerçek isteklerdir (token tüketebilir ve oran sınırlarını tetikleyebilir).
Yapılandırılmış bir agent'ın model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Belirtilmezse,
komut ayarlıysa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır, aksi halde
yapılandırılmış varsayılan agent kullanılır.
Prob satırları auth profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma adı kabul eder.
- Model başvuruları ilk `/` karakterine göre bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı belirtmezseniz OpenClaw, girdiyi önce bir takma ad olarak çözümler, ardından
  tam model kimliği için yapılandırılmış sağlayıcılar arasında benzersiz bir eşleşme olarak değerlendirir ve ancak ondan sonra
  kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner.
  Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
  eski kaldırılmış-sağlayıcı varsayılanını göstermekte ısrar etmek yerine ilk yapılandırılmış sağlayıcı/modele
  geri döner.
- `models status`, kimlik doğrulama çıktısında gizli olmayan yer tutucular için (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) bunları gizli bilgiler olarak maskelemek yerine `marker(<value>)` gösterebilir.

### `models status`

Seçenekler:

- `--json`
- `--plain`
- `--check` (`1` ile çıkar=sona ermiş/eksik, `2` ile çıkar=süresi yakında dolacak)
- `--probe` (yapılandırılmış auth profillerinin canlı proba tabi tutulması)
- `--probe-provider <name>` (tek bir sağlayıcıyı probla)
- `--probe-profile <id>` (tekrarlanan veya virgülle ayrılmış profil kimlikleri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış agent kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

Prob durum grupları:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenebilecek prob ayrıntı/gerekçe kodu durumları:

- `excluded_by_auth_order`: depolanan bir profil vardır, ancak açık
  `auth.order.<provider>` bunu dışlamıştır; bu nedenle prob denemek yerine
  dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil mevcut ama uygun/çözümlenebilir değil.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw bu sağlayıcı için
  problanabilir bir model adayı çözememiştir.

## Takma adlar + yedekler

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Kimlik doğrulama profilleri

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz
sağlayıcıya bağlı olarak bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı) başlatabilir
veya sizi manuel token yapıştırmaya yönlendirebilir.

`models auth login`, bir sağlayıcı eklentisinin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır.
Hangi sağlayıcıların kurulu olduğunu görmek için `openclaw plugins list` kullanın.

Örnekler:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

Notlar:

- `login --provider anthropic --method cli --set-default`, yerel bir Claude
  CLI oturum açmasını yeniden kullanır ve ana Anthropic varsayılan model yolunu standart bir
  `claude-cli/claude-*` başvurusuna yeniden yazar.
- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri sunan sağlayıcılar için
  genel token komutları olmaya devam eder.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token kimlik doğrulama
  yöntemini çalıştırır (sağlayıcı bunu sunuyorsa varsayılan olarak o sağlayıcının `setup-token`
  yöntemini kullanır).
- `paste-token`, başka bir yerde veya otomasyondan oluşturulmuş bir token dizgesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değeri için istemde bulunur ve
  `--profile-id` vermezseniz bunu varsayılan profil kimliği `<provider>:manual` içine
  yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi
  göreli bir süreden mutlak bir token sona erme zamanı saklar.
- Anthropic faturalama notu: Anthropic'in herkese açık CLI belgelerine dayanarak Claude Code CLI geri dönüşünün yerel, kullanıcı tarafından yönetilen otomasyon için muhtemelen izinli olduğuna inanıyoruz. Bununla birlikte, Anthropic'in üçüncü taraf harness politikası, harici ürünlerde abonelik destekli kullanım konusunda yeterince belirsizlik yarattığından, bunu üretim için önermiyoruz. Anthropic ayrıca **4 Nisan 2026, 12:00 PM PT / 8:00 PM BST** tarihinde OpenClaw kullanıcılarını **OpenClaw** Claude-login yolunun üçüncü taraf harness kullanımı sayıldığı ve abonelikten ayrı olarak faturalandırılan **Extra Usage** gerektirdiği konusunda bilgilendirdi.
- Anthropic `setup-token` / `paste-token`, eski/el ile kullanılan bir OpenClaw yolu olarak yeniden kullanılabilir durumdadır. Bunları, Anthropic'in OpenClaw kullanıcılarına bu yolun **Extra Usage** gerektirdiğini bildirdiği beklentisiyle kullanın.
