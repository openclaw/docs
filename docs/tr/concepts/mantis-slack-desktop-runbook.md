---
read_when:
    - Mantis Slack masaüstü QA’sını GitHub’dan veya yerel olarak çalıştırma
    - Yavaş Mantis Slack masaüstü çalıştırmalarında hata ayıklama
    - Kaynak, önceden doldurulmuş veya warm-lease modunu seçme
    - Bir PR'ye ekran görüntüsü ve video kanıtı gönderme
summary: 'Mantis Slack masaüstü QA için operatör çalışma kitabı: GitHub dispatch, yerel CLI, sıcak VNC kiralamaları, hydrate modları, zamanlama yorumu, yapıtlar ve hata yönetimi.'
title: Mantis Slack masaüstü çalışma kılavuzu
x-i18n:
    generated_at: "2026-06-28T00:28:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack masaüstü QA, Linux masaüstü, VNC kurtarma, Slack Web, gerçek bir OpenClaw Gateway, ekran görüntüleri, videolar ve PR kanıt yorumu gerektiren Slack sınıfı hatalar için gerçek UI hattıdır.

Birim testleri veya başsız Slack canlı hattı hatayı kanıtlayamadığında kullanın.

## Depolama modeli

Mantis üç farklı depolama katmanı kullanır:

- Sağlayıcı imajı: Crabbox tarafından sahiplenilir ve bulut sağlayıcısı hesabında saklanır.
  Chrome/Chromium, ffmpeg, scrot, Node/corepack/pnpm, yerel derleme araçları ve boş önbellek dizinleri gibi makine yeteneklerini içerir.
- Sıcak kira durumu: geçerli operatör oturumu tarafından sahiplenilir. Kira canlıyken oturum açılmış bir tarayıcı profili, `/var/cache/crabbox/pnpm` ve hazırlanmış bir kaynak checkout içerebilir.
- Mantis artifact'leri: OpenClaw çalıştırması tarafından sahiplenilir. Bunlar
  `.artifacts/qa-e2e/mantis/...` altında yaşar, ardından GitHub Actions bunları yükler ve Mantis GitHub App PR üzerinde satır içi kanıt yorumu yapar.

Gizli bilgileri, tarayıcı çerezlerini, Slack oturum açma durumunu, depo checkout'larını,
`node_modules` veya `dist/` dizinini asla önceden hazırlanmış bir sağlayıcı imajına koymayın.

## GitHub tetikleme

Workflow'u `main` üzerinden çalıştırın:

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

İzin verilen `candidate_ref` değerleri, workflow canlı kimlik bilgileri kullandığı için kasıtlı olarak dardır: geçerli `main` ataları, release tag'leri veya `openclaw/openclaw` içinden açık bir PR head'i.

Workflow şunları yazar:

- yüklenen artifact: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- Mantis GitHub App'ten satır içi PR yorumu;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` ve `ffmpeg.log` gibi uzak loglar.

PR yorumu gizli `<!-- mantis-slack-desktop-smoke -->` işaretçisiyle yerinde güncellenir.

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

VNC kurtarma için VM'i tutun:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

VNC açın:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Sıcak bir kirayı yeniden kullanın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

`--hydrate-mode prehydrated` seçeneğini yalnızca yeniden kullanılan uzak çalışma alanında zaten `node_modules` ve derlenmiş bir `dist/` olduğunda kullanın. Bunlar eksikse Mantis kapalı şekilde başarısız olur.

Yerel Slack onay UI'sini kanıtlayın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Onay denetim noktası modu `--gateway-setup` ile karşılıklı olarak dışlayıcıdır. Açık onay denetim noktası `--scenario` bayrakları geçirmediğiniz sürece isteğe bağlı `slack-approval-exec-native` ve `slack-approval-plugin-native` senaryolarını çalıştırır; diğer Slack senaryoları VM başlamadan önce reddedilir. Slack QA runner, her denetim noktası JSON dosyasını gözlemlediği gerçek Slack API mesajından yazar, ardından uzak izleyici bu mesaj snapshot'ını
`approval-checkpoints/<scenario>-pending.png` ve
`approval-checkpoints/<scenario>-resolved.png` içine render eder. Herhangi bir denetim noktası JSON'u, mesaj kanıtı, ack JSON'u veya render edilmiş ekran görüntüsü eksik ya da boşsa çalıştırma başarısız olur.

Soğuk GitHub Actions kiralarında Slack Web çerezleri yoktur, bu yüzden tarayıcı yakalaması Slack oturum açma sayfasına düşebilir. Onay denetim noktası kanıtı için
`slack-desktop-smoke.png` yerine render edilmiş denetim noktası görsellerine ve Slack QA artifact'lerine güvenin. Tarayıcı ekran görüntüsünün bizzat Slack Web'i göstermesi gerektiğinde yalnızca elle oturum açılmış Slack Web profiline sahip tutulan sıcak kira kullanın.

## Hydrate modları

| Mod           | Ne zaman kullanılır                       | Uzak davranış                                                                        | Ödünleşim                                               |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `source`      | Normal PR kanıtı, soğuk makineler, CI     | VM içinde `pnpm install --frozen-lockfile --prefer-offline` ve `pnpm build` çalıştırır | En yavaş, en güçlü kaynak-checkout kanıtı               |
| `prehydrated` | Yeniden kullanılan bir kirayı bilerek hazırladığınızda | Mevcut `node_modules` ve `dist/` gerektirir; install/build adımlarını atlar          | Hızlıdır, ancak yalnızca operatör kontrollü sıcak kiralar için geçerlidir |

GitHub Actions, VM çalıştırmasından önce aday checkout'u her zaman hazırlar. pnpm store'u OS, Node sürümü ve lockfile'a göre önbelleğe alınır. VM kaynak çalıştırması da mevcut olduğunda `/var/cache/crabbox/pnpm` kullanır.

## Zamanlama yorumlama

`mantis-slack-desktop-smoke-report.md` faz zamanlamalarını içerir:

- `crabbox.warmup`: bulut sağlayıcısı başlatma, masaüstü/tarayıcı hazır olma ve SSH.
- `crabbox.inspect`: kira metadata araması.
- `credentials.prepare`: Convex kimlik bilgisi kirası edinimi.
- `crabbox.remote_run`: sync, tarayıcı başlatma, OpenClaw install/build veya hydrate doğrulaması, Gateway başlatma, ekran görüntüsü ve video yakalama.
- `artifacts.copy`: VM'den geri rsync.

Crabbox, Mantis'in OpenClaw Gateway kurulumunun tamamlandığını veya Slack QA komutunun kendisinin başarıyla çıktığını kanıtlayan metadata'yı kopyalamasından sonra sıfır olmayan bir uzak durum döndürdüğünde `crabbox.remote_run` `accepted` olarak işaretlenebilir. `accepted` değerini başarısız bir senaryo değil, açıklamalı geçiş olarak değerlendirin.

Çalıştırma yavaşsa:

- warmup baskınsa: daha iyi bir Crabbox sağlayıcı imajını önceden hazırlayın veya terfi ettirin;
- `source` içinde remote_run baskınsa: sıcak kira kullanın, pnpm store yeniden kullanımını iyileştirin veya makine önkoşullarını sağlayıcı imajına taşıyın;
- `prehydrated` içinde remote_run baskınsa: uzak çalışma alanı aslında hazır değildir ya da Gateway/tarayıcı/Slack kurulumu yavaştır;
- artifact kopyalama baskınsa: video boyutunu ve artifact dizini içeriklerini inceleyin.

## Kanıt kontrol listesi

İyi bir PR yorumu şunları göstermelidir:

- senaryo id'si ve aday SHA;
- GitHub Actions çalıştırma URL'si;
- artifact URL'si;
- satır içi onay denetim noktası ekran görüntüsü veya oturum açılmış sıcak kiradan bir Slack Web ekran görüntüsü;
- mevcut olduğunda satır içi animasyonlu önizleme;
- tam MP4 ve kırpılmış MP4 bağlantıları;
- geçme/kalma durumu;
- ekli raporda zamanlama özeti.

Ekran görüntülerini veya videoları depoya commit etmeyin. Bunları GitHub Actions artifact'lerinde veya PR yorumunda tutun.

## Hata işleme

Workflow VM çalıştırmasından önce başarısız olursa önce Actions işini inceleyin. Tipik nedenler güvenilmeyen `candidate_ref`, eksik environment gizli bilgileri veya aday install/build hatasıdır.

VM çalıştırması başarısız olur ancak ekran görüntüleri geri kopyalanırsa şunları inceleyin:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Çalıştırma kirayı tuttuysa rapordaki `crabbox vnc ...` komutuyla VNC açın.
İşiniz bittiğinde kirayı durdurun:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Slack oturumu süresi dolduysa bunu tutulan bir kirada VNC içinde onarın ve `--lease-id` ile yeniden çalıştırın. Bu tarayıcı profilini sağlayıcı imajına işlemeyin.

## İlgili

- [QA genel bakış](/tr/concepts/qa-e2e-automation)
- [Slack kanalı](/tr/channels/slack)
- [Test etme](/tr/help/testing)
