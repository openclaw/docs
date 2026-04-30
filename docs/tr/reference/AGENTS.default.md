---
read_when:
    - Yeni bir OpenClaw ajan oturumu başlatma
    - Varsayılan Skills’i etkinleştirme veya denetleme
summary: Kişisel asistan kurulumu için varsayılan OpenClaw ajan talimatları ve Skills listesi
title: Varsayılan AGENTS.md
x-i18n:
    generated_at: "2026-04-30T09:43:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - OpenClaw Kişisel Asistan (varsayılan)

## İlk çalıştırma (önerilir)

OpenClaw, agent için ayrılmış bir çalışma alanı dizini kullanır. Varsayılan: `~/.openclaw/workspace` (`agents.defaults.workspace` üzerinden yapılandırılabilir).

1. Çalışma alanını oluşturun (zaten yoksa):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Varsayılan çalışma alanı şablonlarını çalışma alanına kopyalayın:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. İsteğe bağlı: kişisel asistan skill listesini istiyorsanız, AGENTS.md dosyasını bu dosyayla değiştirin:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. İsteğe bağlı: `agents.defaults.workspace` ayarını belirleyerek farklı bir çalışma alanı seçin (`~` desteklenir):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Güvenlik varsayılanları

- Dizinleri veya gizli bilgileri sohbete dökmeyin.
- Açıkça istenmedikçe yıkıcı komutlar çalıştırmayın.
- Harici mesajlaşma yüzeylerine kısmi/akış yanıtları göndermeyin (yalnızca nihai yanıtlar).

## Oturum başlangıcı (zorunlu)

- `SOUL.md`, `USER.md` ve `memory/` içindeki bugün+dün dosyalarını okuyun.
- Varsa `MEMORY.md` dosyasını okuyun.
- Bunu yanıt vermeden önce yapın.

## Ruh (zorunlu)

- `SOUL.md` kimliği, tonu ve sınırları tanımlar. Güncel tutun.
- `SOUL.md` dosyasını değiştirirseniz kullanıcıya söyleyin.
- Her oturumda yeni bir örneksiniz; süreklilik bu dosyalarda yaşar.

## Paylaşılan alanlar (önerilir)

- Kullanıcının sesi değilsiniz; grup sohbetlerinde veya herkese açık kanallarda dikkatli olun.
- Özel verileri, iletişim bilgilerini veya dahili notları paylaşmayın.

## Bellek sistemi (önerilir)

- Günlük kayıt: `memory/YYYY-MM-DD.md` (gerekirse `memory/` oluşturun).
- Uzun vadeli bellek: kalıcı gerçekler, tercihler ve kararlar için `MEMORY.md`.
- Küçük harfli `memory.md` yalnızca eski onarım girdisidir; iki kök dosyayı bilerek birlikte tutmayın.
- Oturum başlangıcında, varsa bugün + dün + `MEMORY.md` dosyasını okuyun.
- Kaydedin: kararlar, tercihler, kısıtlar, açık döngüler.
- Açıkça istenmedikçe gizli bilgilerden kaçının.

## Araçlar ve Skills

- Araçlar Skills içinde bulunur; ihtiyaç duyduğunuzda her skill’in `SKILL.md` dosyasını izleyin.
- Ortama özgü notları `TOOLS.md` içinde tutun (Skills için Notlar).

## Yedekleme ipucu (önerilir)

Bu çalışma alanını Clawd’ın “belleği” olarak görüyorsanız, `AGENTS.md` ve bellek dosyalarınızın yedeklenmesi için bunu bir git reposu yapın (ideal olarak özel).

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw ne yapar?

- Asistanın sohbetleri okuyup yazabilmesi, bağlam getirebilmesi ve host Mac üzerinden skills çalıştırabilmesi için WhatsApp Gateway + Pi kodlama agent’ını çalıştırır.
- macOS uygulaması izinleri (ekran kaydı, bildirimler, mikrofon) yönetir ve paketlenmiş ikili dosyası üzerinden `openclaw` CLI’ını sunar.
- Doğrudan sohbetler varsayılan olarak agent’ın `main` oturumunda birleşir; gruplar `agent:<agentId>:<channel>:group:<id>` olarak ayrı kalır (odalar/kanallar: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat’ler arka plan görevlerini canlı tutar.

## Temel Skills (Ayarlar → Skills içinde etkinleştirin)

- **mcporter** — Harici skill arka uçlarını yönetmek için araç sunucusu çalışma zamanı/CLI.
- **Peekaboo** — İsteğe bağlı AI görsel analiziyle hızlı macOS ekran görüntüleri.
- **camsnap** — RTSP/ONVIF güvenlik kameralarından kareler, klipler veya hareket uyarıları yakalayın.
- **oracle** — Oturum tekrarı ve tarayıcı kontrolü içeren OpenAI’a hazır agent CLI.
- **eightctl** — Uykunuzu terminalden kontrol edin.
- **imsg** — iMessage ve SMS gönderin, okuyun, akışa alın.
- **wacli** — WhatsApp CLI: eşitleme, arama, gönderme.
- **discord** — Discord eylemleri: tepki, çıkartmalar, anketler. `user:<id>` veya `channel:<id>` hedeflerini kullanın (yalın sayısal id’ler belirsizdir).
- **gog** — Google Suite CLI: Gmail, Takvim, Drive, Kişiler.
- **spotify-player** — Arama/kuyruğa alma/oynatmayı kontrol etme için terminal Spotify istemcisi.
- **sag** — mac tarzı say UX ile ElevenLabs konuşma; varsayılan olarak hoparlörlere akış yapar.
- **Sonos CLI** — Sonos hoparlörlerini (keşif/durum/oynatma/ses düzeyi/gruplama) script’lerden kontrol edin.
- **blucli** — BluOS oynatıcılarını script’lerden oynatın, gruplayın ve otomatikleştirin.
- **OpenHue CLI** — Sahneler ve otomasyonlar için Philips Hue aydınlatma kontrolü.
- **OpenAI Whisper** — Hızlı dikte ve sesli mesaj dökümleri için yerel konuşmadan metne dönüştürme.
- **Gemini CLI** — Hızlı soru-cevap için terminalden Google Gemini modelleri.
- **agent-tools** — Otomasyonlar ve yardımcı script’ler için yardımcı araç takımı.

## Kullanım notları

- Script yazmak için `openclaw` CLI’ını tercih edin; Mac uygulaması izinleri yönetir.
- Kurulumları Skills sekmesinden çalıştırın; ikili dosya zaten varsa düğmeyi gizler.
- Asistanın hatırlatmalar zamanlayabilmesi, gelen kutularını izleyebilmesi ve kamera yakalamalarını tetikleyebilmesi için Heartbeat’leri etkin tutun.
- Canvas UI, yerel bindirmelerle tam ekran çalışır. Kritik kontrolleri sol üst/sağ üst/alt kenarlara yerleştirmekten kaçının; düzende açık kenar boşlukları ekleyin ve güvenli alan iç boşluklarına güvenmeyin.
- Tarayıcı tabanlı doğrulama için OpenClaw tarafından yönetilen Chrome profiliyle `openclaw browser` (sekmeler/durum/ekran görüntüsü) kullanın.
- DOM incelemesi için `openclaw browser eval|query|dom|snapshot` kullanın (makine çıktısına ihtiyaç duyduğunuzda `--json`/`--out` ile).
- Etkileşimler için `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` kullanın (click/type snapshot ref’leri gerektirir; CSS seçicileri için `evaluate` kullanın).

## İlgili

- [Agent çalışma alanı](/tr/concepts/agent-workspace)
- [Agent çalışma zamanı](/tr/concepts/agent)
