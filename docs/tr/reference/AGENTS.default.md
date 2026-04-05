---
read_when:
    - Yeni bir OpenClaw ajan oturumu başlatma
    - Varsayılan Skills etkinleştirme veya denetleme
summary: Kişisel asistan kurulumu için varsayılan OpenClaw ajan talimatları ve beceri listesi
title: Varsayılan AGENTS.md
x-i18n:
    generated_at: "2026-04-05T14:05:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw Kişisel Asistanı (varsayılan)

## İlk çalıştırma (önerilir)

OpenClaw, ajan için özel bir çalışma alanı dizini kullanır. Varsayılan: `~/.openclaw/workspace` (`agents.defaults.workspace` üzerinden yapılandırılabilir).

1. Çalışma alanını oluşturun (zaten mevcut değilse):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Varsayılan çalışma alanı şablonlarını çalışma alanına kopyalayın:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. İsteğe bağlı: kişisel asistan beceri listesini istiyorsanız AGENTS.md dosyasını bu dosyayla değiştirin:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. İsteğe bağlı: `agents.defaults.workspace` ayarlayarak farklı bir çalışma alanı seçin (`~` desteklenir):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Varsayılan güvenlik ayarları

- Dizinleri veya gizli bilgileri sohbete dökmeyin.
- Açıkça istenmedikçe yıkıcı komutlar çalıştırmayın.
- Harici mesajlaşma yüzeylerine kısmi/akışlı yanıtlar göndermeyin (yalnızca nihai yanıtlar).

## Oturum başlangıcı (zorunlu)

- `SOUL.md`, `USER.md` ve `memory/` içindeki bugün+dünü okuyun.
- Varsa `MEMORY.md` dosyasını okuyun; yalnızca `MEMORY.md` yoksa küçük harfli `memory.md` dosyasına geri dönün.
- Bunu yanıt vermeden önce yapın.

## Ruh (zorunlu)

- `SOUL.md`, kimliği, tonu ve sınırları tanımlar. Güncel tutun.
- `SOUL.md` dosyasını değiştirirseniz kullanıcıya söyleyin.
- Her oturumda yeni bir örneksiniz; süreklilik bu dosyalarda yaşar.

## Paylaşılan alanlar (önerilir)

- Kullanıcının sesi siz değilsiniz; grup sohbetlerinde veya herkese açık kanallarda dikkatli olun.
- Özel verileri, iletişim bilgilerini veya dahili notları paylaşmayın.

## Bellek sistemi (önerilir)

- Günlük kayıt: `memory/YYYY-MM-DD.md` (`gerekirse `memory/` oluşturun).
- Uzun süreli bellek: kalıcı gerçekler, tercihler ve kararlar için `MEMORY.md`.
- Küçük harfli `memory.md` yalnızca eski sistemler için geri dönüş seçeneğidir; iki kök dosyayı bilerek bir arada tutmayın.
- Oturum başlangıcında bugün + dün + varsa `MEMORY.md`, aksi takdirde `memory.md` dosyasını okuyun.
- Kaydedin: kararlar, tercihler, kısıtlamalar, açık döngüler.
- Açıkça istenmedikçe gizli bilgileri kaydetmeyin.

## Araçlar ve beceriler

- Araçlar becerilerin içinde bulunur; ihtiyaç duyduğunuzda her becerinin `SKILL.md` dosyasını izleyin.
- Ortama özgü notları `TOOLS.md` içinde tutun (Skills için Notlar).

## Yedekleme ipucu (önerilir)

Bu çalışma alanını Clawd’ın “hafızası” olarak görüyorsanız, `AGENTS.md` ve bellek dosyalarınızın yedeklendiğinden emin olmak için bunu bir git deposu yapın (tercihen özel).
__OC_I18N_900004__
## OpenClaw Ne Yapar

- Asistanın sohbetleri okuyup yazabilmesi, bağlam alabilmesi ve ana Mac üzerinden beceriler çalıştırabilmesi için WhatsApp gateway + Pi kodlama ajanını çalıştırır.
- macOS uygulaması izinleri yönetir (ekran kaydı, bildirimler, mikrofon) ve paketlenmiş ikili dosyası üzerinden `openclaw` CLI’ını sunar.
- Doğrudan sohbetler varsayılan olarak ajanın `main` oturumunda birleşir; gruplar `agent:<agentId>:<channel>:group:<id>` olarak yalıtılmış kalır (odalar/kanallar: `agent:<agentId>:<channel>:channel:<id>`); heartbeat’ler arka plan görevlerini canlı tutar.

## Çekirdek Skills (Ayarlar → Skills içinde etkinleştirin)

- **mcporter** — Harici beceri arka uçlarını yönetmek için araç sunucusu çalışma zamanı/CLI.
- **Peekaboo** — İsteğe bağlı AI görsel analiziyle hızlı macOS ekran görüntüleri.
- **camsnap** — RTSP/ONVIF güvenlik kameralarından kareler, klipler veya hareket uyarıları yakalayın.
- **oracle** — Oturum yeniden oynatma ve tarayıcı kontrolü ile OpenAI uyumlu ajan CLI’ı.
- **eightctl** — Uykunuzu terminalden kontrol edin.
- **imsg** — iMessage ve SMS gönderin, okuyun, akışını izleyin.
- **wacli** — WhatsApp CLI: eşitleme, arama, gönderme.
- **discord** — Discord işlemleri: tepki, çıkartmalar, anketler. `user:<id>` veya `channel:<id>` hedeflerini kullanın (yalın sayısal kimlikler belirsizdir).
- **gog** — Google Suite CLI: Gmail, Takvim, Drive, Kişiler.
- **spotify-player** — Arama/kuyruk/oynatım kontrolü için terminal Spotify istemcisi.
- **sag** — mac tarzı konuşma deneyimiyle ElevenLabs konuşma; varsayılan olarak hoparlörlere akış yapar.
- **Sonos CLI** — Betiklerden Sonos hoparlörlerini kontrol edin (keşif/durum/oynatım/ses düzeyi/gruplama).
- **blucli** — Betiklerden BluOS oynatıcıları oynatın, gruplayın ve otomatikleştirin.
- **OpenHue CLI** — Sahne ve otomasyonlar için Philips Hue aydınlatma kontrolü.
- **OpenAI Whisper** — Hızlı dikte ve sesli mesaj dökümleri için yerel konuşmadan metne dönüştürme.
- **Gemini CLI** — Hızlı Soru-Cevap için terminalden Google Gemini modelleri.
- **agent-tools** — Otomasyonlar ve yardımcı betikler için yardımcı araç takımı.

## Kullanım Notları

- Betik yazımı için `openclaw` CLI’ını tercih edin; izinleri mac uygulaması yönetir.
- Kurulumları Skills sekmesinden çalıştırın; ikili dosya zaten mevcutsa düğmeyi gizler.
- Asistanın hatırlatıcı planlayabilmesi, gelen kutularını izleyebilmesi ve kamera yakalamalarını tetikleyebilmesi için heartbeat’leri etkin tutun.
- Canvas UI tam ekran ve yerel kaplamalarla çalışır. Kritik kontrolleri sol üst/sağ üst/alt kenarlara yerleştirmeyin; düzende açık kenar boşlukları ekleyin ve güvenli alan iç boşluklarına güvenmeyin.
- Tarayıcı tabanlı doğrulama için OpenClaw tarafından yönetilen Chrome profiliyle `openclaw browser` kullanın (sekmeler/durum/ekran görüntüsü).
- DOM incelemesi için `openclaw browser eval|query|dom|snapshot` kullanın (makine çıktısına ihtiyaç duyduğunuzda `--json`/`--out` kullanın).
- Etkileşimler için `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` kullanın (`click`/`type` snapshot başvuruları gerektirir; CSS seçicileri için `evaluate` kullanın).
