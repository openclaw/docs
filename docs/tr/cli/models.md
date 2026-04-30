---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcının kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, geri dönüşler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-04-30T09:13:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Model keşfi, tarama ve yapılandırma (varsayılan model, geri dönüşler, kimlik doğrulama profilleri).

İlgili:

- Sağlayıcılar + modeller: [Modeller](/tr/providers/models)
- Model seçimi kavramları + `/models` slash komutu: [Modeller kavramı](/tr/concepts/models)
- Sağlayıcı kimlik doğrulama kurulumu: [Başlarken](/tr/start/getting-started)

## Yaygın komutlar

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`, çözümlenmiş varsayılan/geri dönüşleri ve bir kimlik doğrulama genel görünümünü gösterir.
Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda, OAuth/API anahtarı durumu bölümü sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü hook'lardan gelir; aksi halde OpenClaw, kimlik doğrulama profillerinden, env'den veya config'den eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
`--json` çıktısında `auth.providers`, env/config/store farkındalığı olan sağlayıcı genel görünümüdür; `auth.oauth` ise yalnızca auth-store profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama yoklamaları çalıştırmak için `--probe` ekleyin.
Yoklamalar gerçek isteklerdir (token tüketebilir ve rate limit'leri tetikleyebilir).
Yapılandırılmış bir agent'ın model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Atlandığında komut, ayarlıysa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerini, aksi halde yapılandırılmış varsayılan agent'ı kullanır.
Yoklama satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir alias kabul eder.
- `models list` salt okunurdur: config'i, kimlik doğrulama profillerini, mevcut katalog durumunu ve sağlayıcıya ait katalog satırlarını okur, ancak `models.json` dosyasını yeniden yazmaz.
- `Auth` sütunu sağlayıcı düzeyindedir ve salt okunurdur. Yerel kimlik doğrulama profili meta verilerinden, env işaretçilerinden, yapılandırılmış sağlayıcı anahtarlarından, yerel sağlayıcı işaretçilerinden, AWS Bedrock env/profil işaretçilerinden ve Plugin sentetik kimlik doğrulama meta verilerinden hesaplanır; sağlayıcı runtime'ını yüklemez, keychain sırlarını okumaz, sağlayıcı API'lerini çağırmaz veya model başına kesin yürütme hazırlığını kanıtlamaz.
- `models list --all --provider <id>`, o sağlayıcıyla henüz kimlik doğrulaması yapmamış olsanız bile Plugin manifestlerinden veya paketlenmiş sağlayıcı katalog meta verilerinden sağlayıcıya ait statik katalog satırlarını içerebilir. Bu satırlar, eşleşen kimlik doğrulama yapılandırılana kadar yine de kullanılamaz olarak görünür.
- Geniş `models list --all`, sağlayıcı runtime ek hook'larını yüklemeden manifest katalog satırlarını registry satırlarının üzerine birleştirir. Sağlayıcı filtreli manifest hızlı yolları yalnızca `static` olarak işaretlenen sağlayıcıları kullanır; `refreshable` olarak işaretlenen sağlayıcılar registry/cache destekli kalır ve manifest satırlarını ek olarak iliştirir, `runtime` olarak işaretlenen sağlayıcılar ise registry/runtime keşfinde kalır.
- `models list`, yerel model meta verilerini ve runtime sınırlarını ayrı tutar. Tablo çıktısında `Ctx`, etkili bir runtime sınırı yerel context penceresinden farklı olduğunda `contextTokens/contextWindow` gösterir; JSON satırları, bir sağlayıcı bu sınırı sunduğunda `contextTokens` içerir.
- `models list --provider <id>`, `moonshot` veya `openai-codex` gibi sağlayıcı id'sine göre filtreler. Etkileşimli sağlayıcı seçicilerindeki `Moonshot AI` gibi görünen etiketleri kabul etmez.
- Model ref'leri **ilk** `/` üzerinden bölünerek ayrıştırılır. Model ID'si `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini dahil edin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw girdiyi önce bir alias olarak, ardından bu kesin model id'si için benzersiz bir yapılandırılmış sağlayıcı eşleşmesi olarak çözümler ve ancak bundan sonra bir kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eskimiş kaldırılmış-sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/model çiftine geri döner.
- `models status`, gizli olmayan placeholder'lar için kimlik doğrulama çıktısında (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) bunları sır olarak maskelemek yerine `marker(<value>)` gösterebilir.

### Modelleri tara

`models scan`, OpenRouter'ın herkese açık `:free` kataloğunu okur ve adayları geri dönüş kullanımı için sıralar. Kataloğun kendisi herkese açık olduğundan, yalnızca meta veri taramaları bir OpenRouter anahtarı gerektirmez.

Varsayılan olarak OpenClaw, canlı model çağrılarıyla araç ve görüntü desteğini yoklamaya çalışır. OpenRouter anahtarı yapılandırılmamışsa komut yalnızca meta veri çıktısına geri döner ve `:free` modellerin yoklamalar ve inference için yine de `OPENROUTER_API_KEY` gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; config/sır araması yok)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (katalog isteği ve yoklama başına zaman aşımı)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` ve `--set-image` canlı yoklamalar gerektirir; yalnızca meta veri tarama sonuçları bilgilendirme amaçlıdır ve config'e uygulanmaz.

### Modellerin durumu

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış kimlik doğrulama profillerinin canlı yoklaması)
- `--probe-provider <name>` (tek bir sağlayıcıyı yokla)
- `--probe-profile <id>` (tekrarlanabilir veya virgülle ayrılmış profil id'leri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış agent id'si; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerini geçersiz kılar)

`--json`, stdout'u JSON payload'u için ayrılmış tutar. Kimlik doğrulama profili, sağlayıcı ve başlangıç tanılamaları stderr'e yönlendirilir; böylece script'ler stdout'u doğrudan `jq` gibi araçlara aktarabilir.

Yoklama durumu kovaları:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenmesi gereken yoklama ayrıntı/neden kodu durumları:

- `excluded_by_auth_order`: depolanmış bir profil vardır, ancak açık `auth.order.<provider>` onu atlamıştır; bu yüzden yoklama denemek yerine dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: profil mevcut ancak uygun/çözümlenebilir değildir.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw bu sağlayıcı için yoklanabilir bir model adayı çözememiştir.

## Alias'lar + geri dönüşler

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

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz sağlayıcıya bağlı olarak bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı) başlatabilir veya sizi manuel token yapıştırmaya yönlendirebilir.

`models auth login`, bir sağlayıcı Plugin'inin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır. Hangi sağlayıcıların yüklü olduğunu görmek için `openclaw plugins list` kullanın.
Kimlik doğrulama sonuçlarını belirli bir yapılandırılmış agent store'una yazmak için `openclaw models auth --agent <id> <subcommand>` kullanın. Üst `--agent` bayrağı `add`, `login`, `setup-token`, `paste-token` ve `login-github-copilot` tarafından dikkate alınır.

Örnekler:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notlar:

- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri sunan sağlayıcılar için genel token komutları olarak kalır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token kimlik doğrulama yöntemini çalıştırır (sağlayıcı bir tane sunuyorsa varsayılan olarak o sağlayıcının `setup-token` yöntemi kullanılır).
- `paste-token`, başka yerde veya otomasyondan oluşturulmuş bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değerini sorar ve `--profile-id` geçmediğiniz sürece bunu varsayılan profil id'si `<provider>:manual` konumuna yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden mutlak token süresi sonunu depolar.
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına tekrar izin verildiğini söyledi; bu yüzden OpenClaw, Anthropic yeni bir ilke yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylanmış kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılabilir kalır; ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` komutunu tercih eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretmesi](/tr/concepts/model-failover)
