---
read_when:
    - Mantis Slack masaüstü kalite güvencesini GitHub'dan veya yerel olarak çalıştırma
    - Yavaş Mantis Slack masaüstü çalıştırmalarında hata ayıklama
    - Kaynak, önceden hazırlanmış veya sıcak kiralama modunu seçme
    - Bir PR'ye ekran görüntüsü ve video kanıtı gönderme
summary: 'Operatör çalışma kitabı: Mantis Slack masaüstü QA için GitHub dispatch, yerel CLI, sıcak VNC kiralamaları, hydrate modları, zamanlama yorumlama, yapılar ve hata yönetimi.'
title: Mantis Slack masaüstü operasyon kılavuzu
x-i18n:
    generated_at: "2026-05-06T09:08:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack masaüstü QA, Linux masaüstü, VNC kurtarma, Slack Web, gerçek bir OpenClaw Gateway, ekran görüntüleri, videolar ve PR kanıt yorumu gerektiren Slack sınıfı hatalar için gerçek UI kulvarıdır.

Birim testleri veya başsız Slack canlı kulvarı hatayı kanıtlayamadığında kullanın.

## Depolama modeli

Mantis üç farklı depolama katmanı kullanır:

- Sağlayıcı imajı: Crabbox tarafından sahiplenilir ve bulut sağlayıcı hesabında saklanır. Chrome/Chromium, ffmpeg, scrot, Node/corepack/pnpm, yerel derleme araçları ve boş önbellek dizinleri gibi makine yeteneklerini içerir.
- Sıcak kiralama durumu: Geçerli operatör oturumu tarafından sahiplenilir. Kiralama canlıyken oturum açılmış bir tarayıcı profili, `/var/cache/crabbox/pnpm` ve hazırlanmış bir kaynak checkout içerebilir.
- Mantis artifact'leri: OpenClaw çalıştırması tarafından sahiplenilir. `.artifacts/qa-e2e/mantis/...` altında bulunurlar, ardından GitHub Actions bunları yükler ve Mantis GitHub App PR üzerinde satır içi kanıt yorumu yapar.

Sırları, tarayıcı çerezlerini, Slack oturum açma durumunu, depo checkout'larını, `node_modules` veya `dist/` öğelerini asla önceden hazırlanmış bir sağlayıcı imajına koymayın.

## GitHub dispatch

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

İzin verilen `candidate_ref` değerleri, workflow canlı kimlik bilgileri kullandığı için özellikle dardır: geçerli `main` ataları, release tag'leri veya `openclaw/openclaw` içinden açık bir PR head'i.

Workflow şunları yazar:

- yüklenen artifact: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- Mantis GitHub App'ten satır içi PR yorumu;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log` ve `ffmpeg.log` gibi uzak loglar.

PR yorumu, gizli `<!-- mantis-slack-desktop-smoke -->` işaretçisiyle yerinde güncellenir.

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

VNC kurtarma için VM'yi tutun:

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

Sıcak bir kiralamayı yeniden kullanın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

`--hydrate-mode prehydrated` seçeneğini yalnızca yeniden kullanılan uzak çalışma alanında zaten `node_modules` ve derlenmiş bir `dist/` olduğunda kullanın. Bunlar eksikse Mantis kapalı şekilde başarısız olur.

## Hydrate modları

| Mod           | Ne zaman kullanılır                       | Uzak davranış                                                                        | Ödünleşim                                                |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `source`      | Normal PR kanıtı, soğuk makineler, CI     | VM içinde `pnpm install --frozen-lockfile --prefer-offline` ve `pnpm build` çalıştırır | En yavaş, en güçlü kaynak checkout kanıtı                |
| `prehydrated` | Yeniden kullanılan bir kiralamayı bilinçli olarak hazırladığınızda | Var olan `node_modules` ve `dist/` gerektirir; kurulum/derlemeyi atlar               | Hızlıdır, ancak yalnızca operatör kontrollü sıcak kiralamalar için geçerlidir |

GitHub Actions, VM çalıştırmasından önce aday checkout'u her zaman hazırlar. pnpm store'u OS, Node sürümü ve lockfile'a göre önbelleğe alınır. VM kaynak çalıştırması da varsa `/var/cache/crabbox/pnpm` kullanır.

## Zamanlama yorumu

`mantis-slack-desktop-smoke-report.md` faz zamanlamalarını içerir:

- `crabbox.warmup`: bulut sağlayıcı açılışı, masaüstü/tarayıcı hazır oluşu ve SSH.
- `crabbox.inspect`: kiralama metadata araması.
- `credentials.prepare`: Convex kimlik bilgisi kiralamasının alınması.
- `crabbox.remote_run`: eşitleme, tarayıcı başlatma, OpenClaw kurulum/derleme veya hydrate doğrulaması, Gateway başlatma, ekran görüntüsü ve video yakalama.
- `artifacts.copy`: VM'den rsync ile geri kopyalama.

Mantis, OpenClaw Gateway'in canlı olduğunu ve kurulumun tamamlandığını kanıtlayan metadata'yı kopyaladıktan sonra Crabbox sıfır olmayan bir uzak durum döndürürse `crabbox.remote_run` `accepted` olarak işaretlenebilir. `accepted` değerini başarısız senaryo olarak değil, açıklamalı başarılı geçiş olarak değerlendirin.

Çalıştırma yavaşsa:

- warmup baskınsa: daha iyi bir Crabbox sağlayıcı imajı önceden hazırlayın veya öne çıkarın;
- `source` içinde remote_run baskınsa: sıcak bir kiralama kullanın, pnpm store yeniden kullanımını iyileştirin veya makine ön koşullarını sağlayıcı imajına taşıyın;
- `prehydrated` içinde remote_run baskınsa: uzak çalışma alanı aslında hazır değildir veya Gateway/tarayıcı/Slack kurulumu yavaştır;
- artifact kopyalama baskınsa: video boyutunu ve artifact dizini içeriklerini inceleyin.

## Kanıt kontrol listesi

İyi bir PR yorumu şunları göstermelidir:

- senaryo kimliği ve aday SHA;
- GitHub Actions çalıştırma URL'si;
- artifact URL'si;
- satır içi ekran görüntüsü;
- varsa satır içi animasyonlu önizleme;
- tam MP4 ve kırpılmış MP4 bağlantıları;
- başarılı/başarısız durumu;
- ekli raporda zamanlama özeti.

Ekran görüntülerini veya videoları depoya commit etmeyin. Bunları GitHub Actions artifact'lerinde veya PR yorumunda tutun.

## Hata yönetimi

Workflow VM çalıştırmasından önce başarısız olursa önce Actions job'unu inceleyin. Tipik nedenler güvenilmeyen `candidate_ref`, eksik ortam sırları veya aday kurulum/derleme hatasıdır.

VM çalıştırması başarısız olur ama ekran görüntüleri geri kopyalanmışsa şunları inceleyin:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Çalıştırma kiralamayı tuttuysa raporun `crabbox vnc ...` komutuyla VNC açın. İşiniz bittiğinde kiralamayı durdurun:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Slack oturum açma süresi dolduysa tutulan bir kiralamada VNC içinde onarın ve `--lease-id` ile yeniden çalıştırın. Bu tarayıcı profilini sağlayıcı imajına koymayın.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation)
- [Slack kanalı](/tr/channels/slack)
- [Test etme](/tr/help/testing)
