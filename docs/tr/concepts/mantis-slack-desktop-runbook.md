---
read_when:
    - Mantis Slack masaüstü kalite güvencesini GitHub üzerinden veya yerel olarak çalıştırma
    - Yavaş Mantis Slack masaüstü çalıştırmalarında hata ayıklama
    - Kaynak, önceden hazırlanmış veya sıcak kiralama modunu seçme
    - Ekran görüntüsü ve video kanıtlarını bir PR'ye gönderme
summary: 'Mantis Slack masaüstü kalite güvencesi için operatör çalışma kılavuzu: GitHub tetikleme, yerel CLI, hazır VNC kiralamaları, hazırlama modları, zamanlama yorumlama, yapıtlar ve hata yönetimi.'
title: Mantis Slack masaüstü çalışma kılavuzu
x-i18n:
    generated_at: "2026-07-12T12:13:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack masaüstü QA, Linux masaüstü, VNC ile kurtarma, Slack Web, gerçek bir OpenClaw gateway'i, ekran görüntüleri, videolar ve PR kanıt yorumu gerektiren Slack sınıfı hatalar için gerçek kullanıcı arayüzü hattıdır. Birim testleri veya başsız Slack canlı hattı hatayı kanıtlayamadığında bunu kullanın.

## Depolama modeli

Mantis üç depolama katmanı kullanır:

- **Sağlayıcı imajı** - Crabbox'a aittir ve bulut sağlayıcısı hesabında depolanır. Makine yeteneklerini (Chrome/Chromium, ffmpeg, scrot, Node/corepack/pnpm, yerel derleme araçları) ve boş önbellek dizinlerini içerir.
- **Sıcak kiralama durumu** - geçerli operatör oturumuna aittir. Kiralama etkin olduğu sürece oturum açılmış bir tarayıcı profilini, `/var/cache/crabbox/pnpm` dizinini ve hazırlanmış bir kaynak deposu çalışma kopyasını barındırabilir.
- **Mantis yapıtları** - OpenClaw çalıştırmasına aittir. `.artifacts/qa-e2e/mantis/...` altında bulunur; GitHub Actions bunları yükler ve Mantis GitHub App, PR'a satır içi kanıt yorumu ekler.

Gizli bilgileri, tarayıcı çerezlerini, Slack oturum açma durumunu, depo çalışma kopyalarını, `node_modules` veya `dist/` dizinlerini hiçbir zaman sağlayıcı imajına gömmeyin.

## GitHub tetikleme

İş akışını `main` üzerinden çalıştırın:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

İş akışı canlı kimlik bilgileri kullandığından `candidate_ref` kısıtlanmıştır: geçerli `main` geçmişine, bir sürüm etiketine veya `openclaw/openclaw` içindeki açık bir PR'ın başına çözümlenmelidir.

İş akışı şunları üretir:

- yüklenen `mantis-slack-desktop-smoke-<run-id>-<attempt>` yapıtı
- Mantis GitHub App tarafından eklenen satır içi PR yorumu
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- uzak günlükler: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

PR yorumu, gizli `<!-- mantis-slack-desktop-smoke -->` işaretçisi aracılığıyla yerinde güncellenir.

## Yerel CLI

Soğuk kaynak kanıtı:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

VNC ile kurtarma için sanal makineyi koruyun:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

VNC'yi açın:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Sıcak bir kiralamayı yeniden kullanın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

`--hydrate-mode prehydrated` seçeneğini yalnızca yeniden kullanılan uzak çalışma alanında zaten `node_modules` ve derlenmiş bir `dist/` bulunduğunda kullanın; aksi takdirde Mantis güvenli biçimde başarısız olur.

Yerel Slack onay kullanıcı arayüzünü kanıtlayın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` ile `--gateway-setup` birlikte kullanılamaz. Açık bir onay denetim noktası `--scenario` değeri vermediğiniz sürece isteğe bağlı `slack-approval-exec-native` ve `slack-approval-plugin-native` senaryolarını çalıştırır; diğer Slack senaryoları sanal makine başlamadan önce reddedilir. Slack QA çalıştırıcısı, gözlemlediği gerçek Slack API mesajından her denetim noktası JSON dosyasını yazar; ardından uzak izleyici bu mesajı `approval-checkpoints/<scenario>-pending.png` ve `approval-checkpoints/<scenario>-resolved.png` dosyalarına işler. Herhangi bir denetim noktası JSON'u, mesaj kanıtı, alındı JSON'u veya işlenmiş ekran görüntüsü eksik ya da boşsa çalıştırma başarısız olur.

Soğuk GitHub Actions kiralamalarında Slack Web çerezleri bulunmadığından tarayıcı yakalaması Slack oturum açma ekranına ulaşabilir. Onay denetim noktası kanıtı için `slack-desktop-smoke.png` yerine işlenmiş denetim noktası görüntülerine ve Slack QA yapıtlarına güvenin. Tarayıcı ekran görüntüsünün bizzat Slack Web'i göstermesi gerektiğinde yalnızca Slack Web profilinde elle oturum açılmış ve korunan sıcak bir kiralama kullanın.

## Hazırlama modları

| Mod           | Kullanım durumu                            | Uzak davranış                                                                          | Ödünleşim                                                     |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `source`      | Normal PR kanıtı, soğuk makineler, CI      | Sanal makine içinde `pnpm install --frozen-lockfile --prefer-offline` ve `pnpm build` çalıştırır | En yavaş, en güçlü kaynak çalışma kopyası kanıtı               |
| `prehydrated` | Yeniden kullanılan bir kiralamayı bilerek hazırladığınızda | Mevcut `node_modules` ve `dist/` gerektirir; kurulumu/derlemeyi atlar                   | Hızlıdır, ancak yalnızca operatör denetimindeki sıcak kiralamalar için geçerlidir |

GitHub Actions, sanal makine çalıştırmasından önce aday çalışma kopyasını her zaman hazırlar. pnpm deposu işletim sistemine, Node sürümüne ve kilit dosyasına göre önbelleğe alınır. Sanal makinedeki `source` çalıştırması da mevcut olduğunda `/var/cache/crabbox/pnpm` dizinini yeniden kullanır.

## Zamanlama yorumu

`mantis-slack-desktop-smoke-report.md` aşama sürelerini içerir:

- `crabbox.warmup` - bulut sağlayıcısının başlatılması, masaüstü/tarayıcı hazırlığı, SSH.
- `crabbox.inspect` - kiralama meta verisi sorgulaması.
- `credentials.prepare` - Convex kimlik bilgisi kiralamasının edinilmesi.
- `crabbox.remote_run` - eşitleme, tarayıcının başlatılması, OpenClaw kurulumu/derlemesi veya hazırlama doğrulaması, gateway'in başlatılması, ekran görüntüsü ve video yakalama.
- `artifacts.copy` - sanal makineden rsync ile geri kopyalama.

Crabbox sıfır olmayan bir uzak durum döndürdüğünde ancak Mantis, OpenClaw gateway kurulumunun tamamlandığını veya Slack QA komutunun başarıyla çıktığını kanıtlayan meta verileri kopyaladığında `crabbox.remote_run`, `accepted` gösterebilir. `accepted` durumunu başarısız bir senaryo olarak değil, açıklamalı geçiş olarak değerlendirin.

Bir çalıştırma yavaşsa:

- Hazırlık baskınsa: daha iyi bir Crabbox sağlayıcı imajını önceden oluşturun veya yükseltin.
- `source` modunda `remote_run` baskınsa: sıcak bir kiralama kullanın, pnpm deposunun yeniden kullanımını iyileştirin veya makine ön koşullarını sağlayıcı imajına taşıyın.
- `prehydrated` modunda `remote_run` baskınsa: uzak çalışma alanı gerçekte hazır değildir ya da gateway/tarayıcı/Slack kurulumu yavaştır.
- Yapıt kopyalama baskınsa: video boyutunu ve yapıt dizininin içeriğini inceleyin.

## Kanıt denetim listesi

İyi bir PR yorumu şunları gösterir:

- senaryo kimliği ve aday SHA
- GitHub Actions çalıştırma URL'si ve yapıt URL'si
- satır içi onay denetim noktası ekran görüntüsü veya oturum açılmış sıcak kiralamadan alınan bir Slack Web ekran görüntüsü
- varsa satır içi animasyonlu önizleme
- tam MP4 ve kırpılmış MP4 bağlantıları
- başarılı/başarısız durumu ve raporun zamanlama özeti

Ekran görüntülerini veya videoları depoya işlemeyin. Bunları GitHub Actions yapıtlarında veya PR yorumunda tutun.

## Hata işleme

İş akışı sanal makine çalıştırmasından önce başarısız olursa önce Actions işini inceleyin. Yaygın nedenler: güvenilmeyen `candidate_ref`, eksik ortam gizli bilgileri veya adayın kurulum/derleme hatası.

Sanal makine çalıştırması başarısız olur ancak ekran görüntüleri geri kopyalanırsa şunları inceleyin:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Çalıştırma kiralamayı koruduysa rapordaki `crabbox vnc ...` komutuyla VNC'yi açın, ardından işiniz bittiğinde kiralamayı durdurun:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Slack oturumu sona erdiyse korunan bir kiralamada VNC üzerinden düzeltin ve `--lease-id` ile yeniden çalıştırın. Bu tarayıcı profilini sağlayıcı imajına gömmeyin.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation)
- [Slack kanalı](/tr/channels/slack)
- [Test etme](/tr/help/testing)
