---
read_when:
    - Hata raporu veya destek talebi hazırlama
    - Gateway çökmeleri, yeniden başlatmaları, bellek baskısı veya aşırı büyük yüklerde hata ayıklama
    - Kaydedilen veya sansürlenen tanılama verilerini inceleme
summary: Hata raporları için paylaşılabilir Gateway tanılama paketleri oluşturun
title: Tanılama dışa aktarımı
x-i18n:
    generated_at: "2026-07-12T11:43:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw, hata raporları için yerel bir tanılama `.zip` dosyası oluşturabilir: arındırılmış Gateway
durumu, sistem sağlığı, günlükler, yapılandırma yapısı ve yakın zamandaki yük içermeyen kararlılık olayları.

İncelenene kadar tanılama paketlerini gizli bilgiler gibi değerlendirin. Yükler ve kimlik bilgileri
tasarım gereği karartılır, ancak paket yine de yerel Gateway günlüklerini ve
ana makine düzeyindeki çalışma zamanı durumunu özetler.

## Hızlı başlangıç

```bash
openclaw gateway diagnostics export
```

Yazılan zip dosyasının yolunu görüntüler. Bir çıktı yolu seçin:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Otomasyon için:

```bash
openclaw gateway diagnostics export --json
```

## Sohbet komutu

Sahipler, kopyalanıp yapıştırılabilir tek bir destek raporu olarak yerel bir
Gateway dışa aktarımı istemek için herhangi bir konuşmada `/diagnostics [note]` çalıştırabilir:

1. İsteğe bağlı kısa bir notla birlikte `/diagnostics` gönderin (`/diagnostics hatalı araç seçimi`).
2. OpenClaw bir giriş mesajı gönderir ve
   `openclaw gateway diagnostics export --json` komutunu çalıştıracak tek bir açık yürütme onayı ister. Tanılamaya
   tümüne izin veren bir kuralla onay vermeyin.
3. Onayın ardından OpenClaw; yerel paket yolu, bildirim
   özeti, gizlilik notları ve ilgili oturum kimlikleriyle yanıt verir.

Grup sohbetlerinde sahip yine `/diagnostics` çalıştırabilir, ancak OpenClaw
dışa aktarma sonucunu, onay istemlerini ve Codex oturum/ileti dizisi dökümünü
sahibe özel olarak gönderir. Grup yalnızca tanılamanın özel olarak gönderildiğini
belirten kısa bir bildirim görür. Sahibe ulaşan özel bir yol yoksa komut güvenli biçimde
başarısız olur ve sahibin komutu bir DM üzerinden çalıştırmasını ister.

Etkin oturum yerel OpenAI Codex çalıştırma altyapısını kullandığında aynı yürütme
onayı, OpenClaw'ın bildiği Codex ileti dizileri için OpenAI'a geri bildirim yüklemesini de
kapsar. Bu yükleme yerel Gateway zip dosyasından ayrıdır ve yalnızca
Codex çalıştırma altyapısı oturumlarında gerçekleşir. Onay istemi, onay vermenin
Codex oturum veya ileti dizisi kimliklerini listelemeden Codex geri bildirimi de gönderdiğini belirtir. Onayın
ardından yanıt; kanalları, OpenClaw oturum kimliklerini, Codex ileti dizisi kimliklerini ve
OpenAI'a gönderilen ileti dizileri için yerel sürdürme komutlarını listeler. Onayı reddetmek veya
yok saymak; dışa aktarımı, Codex geri bildirim yüklemesini ve
Codex kimlik listesini atlar.

Bu, Codex hata ayıklama döngüsünü kısaltır: bir kanalda hatalı davranışı fark edin,
`/diagnostics` çalıştırın, bir kez onaylayın, raporu paylaşın ve ardından ileti dizisini
kendiniz incelemek istiyorsanız görüntülenen
`codex resume <thread-id>` komutunu yerel olarak çalıştırın. Bkz. [Codex çalıştırma altyapısı](/tr/plugins/codex-harness#inspect-codex-threads-locally).

## Dışa aktarımın içeriği

- `summary.md`: destek için insan tarafından okunabilir genel bakış.
- `diagnostics.json`: yapılandırma, günlükler, durum, sistem sağlığı
  ve kararlılık verilerinin makine tarafından okunabilir özeti.
- `manifest.json`: dışa aktarma meta verileri ve dosya listesi.
- Arındırılmış yapılandırma yapısı ve gizli olmayan yapılandırma ayrıntıları.
- Arındırılmış günlük özetleri ve yakın zamandaki karartılmış günlük satırları.
- En iyi çabayla alınan Gateway durum ve sistem sağlığı anlık görüntüleri.
- `stability/latest.json`: mevcut olduğunda en yeni kalıcı kararlılık paketi.

Dışa aktarım, Gateway sağlıksız olduğunda da kullanışlıdır: durum/sistem sağlığı
istekleri başarısız olursa yerel günlükler, yapılandırma yapısı ve en son kararlılık paketi
mevcut olduklarında yine toplanır.

## Gizlilik modeli

Saklananlar: alt sistem adları, plugin kimlikleri, sağlayıcı kimlikleri, kanal kimlikleri, yapılandırılmış
modlar, durum kodları, süreler, bayt sayıları, kuyruk durumu, bellek ölçümleri,
arındırılmış günlük meta verileri, karartılmış operasyonel mesajlar, yapılandırma yapısı ve
gizli olmayan özellik ayarları.

Atlanan veya karartılanlar: sohbet metni, istemler, talimatlar, webhook gövdeleri, araç
çıktıları, kimlik bilgileri, API anahtarları, belirteçler, çerezler, gizli değerler, ham
istek/yanıt gövdeleri, hesap kimlikleri, mesaj kimlikleri, ham oturum kimlikleri,
ana makine adları ve yerel kullanıcı adları.

Bir günlük mesajı kullanıcı, sohbet, istem veya araç yükü metnine benzediğinde
dışa aktarım yalnızca bir mesajın atlandığı bilgisini ve bayt sayısını saklar.

## Kararlılık kaydedicisi

Gateway, tanılama etkin olduğunda varsayılan olarak sınırlı ve yük içermeyen bir kararlılık akışı
kaydeder. İçeriği değil, operasyonel olguları yakalar.

Aynı Heartbeat, olay döngüsü veya CPU doygun göründüğünde canlılığı da
örnekleyerek olay döngüsü gecikmesi, olay döngüsü kullanımı,
CPU çekirdeği oranı, etkin/bekleyen/kuyruktaki oturum sayıları, geçerli
başlatma/çalışma zamanı aşaması (biliniyorsa), son aşama aralıkları ve
sınırlı iş etiketleriyle `diagnostic.liveness.warning` olayları yayar. Bunlar yalnızca
iş beklerken veya kuyruktayken ya da etkin iş, devamlı olay döngüsü
gecikmesiyle çakıştığında Gateway `warn` düzeyinde günlük satırlarına dönüşür;
aksi takdirde `debug` düzeyinde günlüğe kaydedilir. Boşta canlılık örnekleri yine tanılama
olayları olarak kaydedilir, ancak kendi başlarına hiçbir zaman uyarıya yükseltilmez.

Başlatma aşamaları, duvar saati ve CPU zamanlamasıyla birlikte
`diagnostic.phase.completed` olayları yayar. Takılmış gömülü çalıştırma tanılaması, son köprü
ilerlemesi sonlandırıcı göründüğünde (örneğin ham bir yanıt
öğesi veya yanıt tamamlama olayı) ancak Gateway gömülü çalıştırmayı hâlâ
etkin kabul ettiğinde `terminalProgressStale=true` olarak işaretler.

Canlı kaydediciyi inceleyin:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Önemli bir çıkış, kapatma zaman aşımı veya yeniden başlatma sırasında başlatma hatasından sonra
en yeni kalıcı paketi inceleyin:

```bash
openclaw gateway stability --bundle latest
```

En yeni kalıcı paketten bir tanılama zip dosyası oluşturun:

```bash
openclaw gateway stability --bundle latest --export
```

Olaylar mevcut olduğunda kalıcı paketler `~/.openclaw/logs/stability/` altında bulunur.

## Yararlı seçenekler

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Bayrak                  | Varsayılan                                                                    | Açıklama                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Belirli bir zip yoluna (veya dizine) yaz.                   |
| `--log-lines <count>`   | `5000`                                                                        | Dahil edilecek en fazla arındırılmış günlük satırı sayısı.  |
| `--log-bytes <bytes>`   | `1000000`                                                                     | İncelenecek en fazla günlük baytı.                          |
| `--url <url>`           | -                                                                             | Durum/sistem sağlığı anlık görüntüleri için Gateway WebSocket URL'si. |
| `--token <token>`       | -                                                                             | Durum/sistem sağlığı anlık görüntüleri için Gateway belirteci. |
| `--password <password>` | -                                                                             | Durum/sistem sağlığı anlık görüntüleri için Gateway parolası. |
| `--timeout <ms>`        | `3000`                                                                        | Durum/sistem sağlığı anlık görüntüsü zaman aşımı.           |
| `--no-stability-bundle` | kapalı                                                                        | Kalıcı kararlılık paketi aramasını atla.                    |
| `--json`                | kapalı                                                                        | Makine tarafından okunabilir dışa aktarma meta verilerini görüntüle. |

## Tanılamayı devre dışı bırakma

Tanılama varsayılan olarak etkindir. Kararlılık kaydedicisini ve
tanılama olayı toplamayı devre dışı bırakmak için:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tanılamayı devre dışı bırakmak hata raporu ayrıntılarını azaltır; normal
Gateway günlük kaydını etkilemez.

Kritik bellek baskısı anlık görüntüleri varsayılan olarak kapalıdır. Normal tanılama
olaylarına ek olarak OOM öncesi kararlılık anlık görüntüsünü yakalamak için:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Bunu yalnızca kritik bellek baskısı sırasında ek dosya sistemi taramasını ve
anlık görüntü yazımını kaldırabilecek ana makinelerde kullanın. Anlık görüntü kapalıyken de
normal bellek baskısı olayları RSS, heap, eşik ve büyüme olgularını (`rss_threshold`,
`heap_threshold`, `rss_growth`) kaydeder.

## İlgili

- [Sistem sağlığı denetimleri](/tr/gateway/health)
- [Gateway CLI](/tr/cli/gateway#gateway-diagnostics-export)
- [Gateway protokolü](/tr/gateway/protocol#rpc-method-families)
- [Günlük kaydı](/tr/logging)
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) - tanılamayı bir toplayıcıya akışla göndermek için ayrı süreç
