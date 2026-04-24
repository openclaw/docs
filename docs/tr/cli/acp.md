---
read_when:
    - ACP tabanlı IDE entegrasyonlarını ayarlama
    - ACP oturum yönlendirmesini Gateway'e hata ayıklama
summary: IDE entegrasyonları için ACP köprüsünü çalıştırın
title: ACP
x-i18n:
    generated_at: "2026-04-24T09:00:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Bir OpenClaw Gateway ile konuşan [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) köprüsünü çalıştırın.

Bu komut, IDE'ler için stdio üzerinden ACP konuşur ve istemleri WebSocket
üzerinden Gateway'e iletir. ACP oturumlarını Gateway oturum anahtarlarıyla eşlenmiş halde tutar.

`openclaw acp`, tam ACP-yerel bir düzenleyici çalışma zamanı değil, Gateway destekli bir ACP köprüsüdür.
Oturum yönlendirmesine, istem teslimine ve temel akış
güncellemelerine odaklanır.

Harici bir MCP istemcisinin bir ACP koşum oturumu barındırmak yerine doğrudan OpenClaw kanal
konuşmalarıyla konuşmasını istiyorsanız,
bunun yerine [`openclaw mcp serve`](/tr/cli/mcp) kullanın.

## Bu ne değildir

Bu sayfa sıkça ACP koşum oturumlarıyla karıştırılır.

`openclaw acp` şu anlama gelir:

- OpenClaw bir ACP sunucusu olarak hareket eder
- bir IDE veya ACP istemcisi OpenClaw'a bağlanır
- OpenClaw bu işi bir Gateway oturumuna iletir

Bu, [ACP Agents](/tr/tools/acp-agents) sayfasından farklıdır; orada OpenClaw
`acpx` üzerinden Codex veya Claude Code gibi harici bir koşumu çalıştırır.

Hızlı kural:

- düzenleyici/istemci ACP ile OpenClaw'la konuşmak istiyorsa: `openclaw acp` kullanın
- OpenClaw, Codex/Claude/Gemini'yi bir ACP koşumu olarak başlatmalıysa: `/acp spawn` ve [ACP Agents](/tr/tools/acp-agents) kullanın

## Uyumluluk Matrisi

| ACP alanı                                                             | Durum       | Notlar                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Uygulandı   | Stdio üzerinden Gateway chat/send + abort ile çekirdek köprü akışı.                                                                                                                                                                                   |
| `listSessions`, slash komutları                                       | Uygulandı   | Oturum listesi Gateway oturum durumuna karşı çalışır; komutlar `available_commands_update` üzerinden ilan edilir.                                                                                                                                     |
| `loadSession`                                                         | Kısmi       | ACP oturumunu bir Gateway oturum anahtarına yeniden bağlar ve saklanan kullanıcı/asistan metin geçmişini yeniden oynatır. Araç/sistem geçmişi henüz yeniden oluşturulmaz.                                                                            |
| İstem içeriği (`text`, gömülü `resource`, resimler)                   | Kısmi       | Metin/kaynaklar sohbet girdisine düzleştirilir; resimler Gateway ekleri hâline gelir.                                                                                                                                                                 |
| Oturum modları                                                        | Kısmi       | `session/set_mode` desteklenir ve köprü; düşünce düzeyi, araç ayrıntı seviyesi, muhakeme, kullanım ayrıntısı ve yükseltilmiş eylemler için başlangıç Gateway destekli oturum denetimlerini sunar. Daha geniş ACP-yerel kip/yapılandırma yüzeyleri hâlâ kapsam dışıdır. |
| Oturum bilgisi ve kullanım güncellemeleri                             | Kısmi       | Köprü, önbelleğe alınmış Gateway oturum anlık görüntülerinden `session_info_update` ve en iyi çabayla `usage_update` bildirimleri yayar. Kullanım yaklaşık değerdir ve yalnızca Gateway token toplamlarını güncel olarak işaretlediğinde gönderilir. |
| Araç akışı                                                            | Kısmi       | `tool_call` / `tool_call_update` olayları; Gateway araç bağımsız değişkenleri/sonuçları bunları ortaya çıkardığında ham G/Ç, metin içeriği ve en iyi çabayla dosya konumlarını içerir. Gömülü terminaller ve daha zengin diff-yerel çıktı hâlâ sunulmaz. |
| Oturum başına MCP sunucuları (`mcpServers`)                           | Desteklenmiyor | Köprü modu, oturum başına MCP sunucusu isteklerini reddeder. Bunun yerine MCP'yi OpenClaw gateway veya aracı üzerinde yapılandırın.                                                                                                                 |
| İstemci dosya sistemi yöntemleri (`fs/read_text_file`, `fs/write_text_file`) | Desteklenmiyor | Köprü, ACP istemci dosya sistemi yöntemlerini çağırmaz.                                                                                                                                                                                                |
| İstemci terminal yöntemleri (`terminal/*`)                            | Desteklenmiyor | Köprü, ACP istemci terminalleri oluşturmaz veya araç çağrıları üzerinden terminal kimliklerini akıtmaz.                                                                                                                                             |
| Oturum planları / düşünce akışı                                       | Desteklenmiyor | Köprü şu anda ACP plan veya düşünce güncellemeleri değil, çıktı metni ve araç durumu yayar.                                                                                                                                                          |

## Bilinen Sınırlamalar

- `loadSession`, saklanan kullanıcı ve asistan metin geçmişini yeniden oynatır, ancak
  geçmiş araç çağrılarını, sistem bildirimlerini veya daha zengin ACP-yerel olay
  türlerini yeniden oluşturmaz.
- Birden fazla ACP istemcisi aynı Gateway oturum anahtarını paylaşıyorsa, olay ve iptal
  yönlendirmesi istemci başına katı biçimde yalıtılmış olmak yerine en iyi çabadır. Temiz düzenleyici-yerel
  dönüşlere ihtiyaç duyduğunuzda varsayılan yalıtılmış `acp:<uuid>` oturumlarını tercih edin.
- Gateway durdurma durumları ACP durdurma nedenlerine çevrilir, ancak bu eşleme
  tam ACP-yerel bir çalışma zamanından daha az ifade gücüne sahiptir.
- Başlangıç oturum denetimleri şu anda Gateway düğmelerinin odaklı bir alt kümesini sunar:
  düşünce düzeyi, araç ayrıntı seviyesi, muhakeme, kullanım ayrıntısı ve yükseltilmiş
  eylemler. Model seçimi ve exec-host denetimleri henüz ACP
  yapılandırma seçenekleri olarak sunulmaz.
- `session_info_update` ve `usage_update`, canlı ACP-yerel çalışma zamanı muhasebesinden değil,
  Gateway oturum anlık görüntülerinden türetilir. Kullanım yaklaşık değerdir,
  maliyet verisi taşımaz ve yalnızca Gateway toplam token
  verilerini güncel olarak işaretlediğinde yayılır.
- Araç takip verileri en iyi çabayladır. Köprü, bilinen araç bağımsız değişkenleri/sonuçlarında
  görünen dosya yollarını gösterebilir, ancak henüz ACP terminalleri veya
  yapılandırılmış dosya diff'leri yaymaz.

## Kullanım

```bash
openclaw acp

# Uzak Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Uzak Gateway (dosyadan token)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Var olan bir oturum anahtarına bağlan
openclaw acp --session agent:main:main

# Etikete göre bağlan (önceden var olmalıdır)
openclaw acp --session-label "support inbox"

# İlk istemden önce oturum anahtarını sıfırla
openclaw acp --session agent:main:main --reset-session
```

## ACP istemcisi (hata ayıklama)

IDE olmadan köprüyü mantık denetiminden geçirmek için yerleşik ACP istemcisini kullanın.
ACP köprüsünü başlatır ve istemleri etkileşimli olarak yazmanıza olanak tanır.

```bash
openclaw acp client

# Başlatılan köprüyü uzak bir Gateway'e yönlendir
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Sunucu komutunu geçersiz kıl (varsayılan: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

İzin modeli (istemci hata ayıklama modu):

- Otomatik onay, izin listesi tabanlıdır ve yalnızca güvenilen çekirdek araç kimliklerine uygulanır.
- `read` otomatik onayı mevcut çalışma diziniyle sınırlıdır (`--cwd` ayarlıysa).
- ACP yalnızca dar salt okunur sınıfları otomatik onaylar: etkin cwd altındaki kapsamlı `read` çağrıları ve salt okunur arama araçları (`search`, `web_search`, `memory_search`). Bilinmeyen/çekirdek olmayan araçlar, kapsam dışı okumalar, exec yetenekli araçlar, kontrol düzlemi araçları, değiştirici araçlar ve etkileşimli akışlar her zaman açık istem onayı gerektirir.
- Sunucu tarafından sağlanan `toolCall.kind`, güvenilmeyen metadata olarak değerlendirilir (yetkilendirme kaynağı değildir).
- Bu ACP köprü ilkesi, ACPX koşum izinlerinden ayrıdır. OpenClaw'ı `acpx` arka ucu üzerinden çalıştırırsanız, `plugins.entries.acpx.config.permissionMode=approve-all`, o koşum oturumu için acil durum “yolo” anahtarıdır.

## Bunu nasıl kullanırsınız

Bir IDE (veya başka bir istemci) Agent Client Protocol konuşuyorsa ve onun
bir OpenClaw Gateway oturumunu sürmesini istiyorsanız ACP kullanın.

1. Gateway'in çalıştığından emin olun (yerel veya uzak).
2. Gateway hedefini yapılandırın (yapılandırma veya bayraklarla).
3. IDE'nizi stdio üzerinden `openclaw acp` çalıştıracak şekilde yönlendirin.

Örnek yapılandırma (kalıcı):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Örnek doğrudan çalıştırma (yapılandırma yazmadan):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# yerel süreç güvenliği için tercih edilir
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Aracı seçme

ACP, aracıları doğrudan seçmez. Gateway oturum anahtarına göre yönlendirme yapar.

Belirli bir aracıyı hedeflemek için aracı kapsamlı oturum anahtarları kullanın:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Her ACP oturumu tek bir Gateway oturum anahtarına eşlenir. Bir aracının birçok
oturumu olabilir; anahtarı veya etiketi geçersiz kılmadığınız sürece ACP varsayılan olarak
yalıtılmış bir `acp:<uuid>` oturumu kullanır.

Oturum başına `mcpServers`, köprü modunda desteklenmez. Bir ACP istemcisi
bunları `newSession` veya `loadSession` sırasında gönderirse köprü,
sessizce yok saymak yerine açık bir hata döndürür.

ACPX destekli oturumların OpenClaw Plugin araçlarını veya
`cron` gibi seçili yerleşik araçları görmesini istiyorsanız, oturum başına `mcpServers`
geçirmeye çalışmak yerine gateway tarafı ACPX MCP köprülerini etkinleştirin. Bkz.
[ACP Agents](/tr/tools/acp-agents-setup#plugin-tools-mcp-bridge) ve
[OpenClaw araçları MCP köprüsü](/tr/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## `acpx` içinden kullanım (Codex, Claude, diğer ACP istemcileri)

Codex veya Claude Code gibi bir kodlama aracısının
OpenClaw botunuzla ACP üzerinden konuşmasını istiyorsanız, yerleşik `openclaw` hedefiyle `acpx` kullanın.

Tipik akış:

1. Gateway'i çalıştırın ve ACP köprüsünün ona ulaşabildiğinden emin olun.
2. `acpx openclaw` komutunu `openclaw acp` komutuna yönlendirin.
3. Kodlama aracısının kullanmasını istediğiniz OpenClaw oturum anahtarını hedefleyin.

Örnekler:

```bash
# Varsayılan OpenClaw ACP oturumunuza tek seferlik istek
acpx openclaw exec "Etkin OpenClaw oturum durumunu özetle."

# Takip dönüşleri için kalıcı adlandırılmış oturum
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "OpenClaw iş aracımdan bu depoyla ilgili son bağlamı iste."
```

`acpx openclaw` komutunun her seferinde belirli bir Gateway ve oturum anahtarını hedeflemesini istiyorsanız,
`~/.acpx/config.json` içindeki `openclaw` aracı komutunu geçersiz kılın:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Depo-yerel bir OpenClaw checkout'u için ACP akışının temiz kalması amacıyla
geliştirme çalıştırıcısı yerine doğrudan CLI giriş noktasını kullanın. Örneğin:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Bu, Codex, Claude Code veya ACP farkındalığı olan başka bir istemcinin
bir terminali kazımadan bir OpenClaw aracısından bağlamsal bilgi çekmesini sağlamanın en kolay yoludur.

## Zed düzenleyici kurulumu

`~/.config/zed/settings.json` dosyasına özel bir ACP aracı ekleyin (veya Zed’in Ayarlar UI'sini kullanın):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Belirli bir Gateway veya aracıyı hedeflemek için:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed içinde Agent panelini açın ve bir iş parçacığı başlatmak için “OpenClaw ACP” seçeneğini seçin.

## Oturum eşleme

Varsayılan olarak ACP oturumları, `acp:` önekine sahip yalıtılmış bir Gateway oturum anahtarı alır.
Bilinen bir oturumu yeniden kullanmak için bir oturum anahtarı veya etiketi geçirin:

- `--session <key>`: belirli bir Gateway oturum anahtarını kullanır.
- `--session-label <label>`: mevcut bir oturumu etikete göre çözümler.
- `--reset-session`: bu anahtar için yeni bir oturum kimliği üretir (aynı anahtar, yeni transcript).

ACP istemciniz metadata destekliyorsa oturum başına geçersiz kılabilirsiniz:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Oturum anahtarları hakkında daha fazla bilgi için [/concepts/session](/tr/concepts/session) sayfasına bakın.

## Seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırılmışsa varsayılan olarak gateway.remote.url kullanılır).
- `--token <token>`: Gateway kimlik doğrulama token'ı.
- `--token-file <path>`: Gateway kimlik doğrulama token'ını dosyadan okur.
- `--password <password>`: Gateway kimlik doğrulama parolası.
- `--password-file <path>`: Gateway kimlik doğrulama parolasını dosyadan okur.
- `--session <key>`: varsayılan oturum anahtarı.
- `--session-label <label>`: çözümlenecek varsayılan oturum etiketi.
- `--require-existing`: oturum anahtarı/etiketi yoksa başarısız olur.
- `--reset-session`: ilk kullanımdan önce oturum anahtarını sıfırlar.
- `--no-prefix-cwd`: istemlerin başına çalışma dizinini eklemez.
- `--provenance <off|meta|meta+receipt>`: ACP provenance metadata veya receipt'lerini içerir.
- `--verbose, -v`: stderr'e ayrıntılı günlükleme.

Güvenlik notu:

- `--token` ve `--password`, bazı sistemlerde yerel süreç listelerinde görünebilir.
- `--token-file`/`--password-file` veya ortam değişkenlerini (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) tercih edin.
- Gateway kimlik doğrulama çözümlemesi, diğer Gateway istemcileri tarafından kullanılan paylaşılan sözleşmeyi izler:
  - yerel mod: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> yalnızca `gateway.auth.*` ayarlı değilse `gateway.remote.*` geri dönüşü (yapılandırılmış ancak çözümlenmemiş yerel SecretRef'ler kapalı varsayımla başarısız olur)
  - uzak mod: uzak öncelik kurallarına göre env/yapılandırma geri dönüşü ile `gateway.remote.*`
  - `--url` geçersiz kılma açısından güvenlidir ve örtük yapılandırma/env kimlik bilgilerini yeniden kullanmaz; açık `--token`/`--password` (veya dosya varyantları) geçirin
- ACP çalışma zamanı arka uç alt süreçleri `OPENCLAW_SHELL=acp` alır; bu, bağlama özgü kabuk/profil kuralları için kullanılabilir.
- `openclaw acp client`, başlatılan köprü sürecinde `OPENCLAW_SHELL=acp-client` ayarlar.

### `acp client` seçenekleri

- `--cwd <dir>`: ACP oturumu için çalışma dizini.
- `--server <command>`: ACP sunucu komutu (varsayılan: `openclaw`).
- `--server-args <args...>`: ACP sunucusuna geçirilen ek bağımsız değişkenler.
- `--server-verbose`: ACP sunucusunda ayrıntılı günlüklemeyi etkinleştirir.
- `--verbose, -v`: ayrıntılı istemci günlüklemesi.

## İlgili

- [CLI başvurusu](/tr/cli)
- [ACP agents](/tr/tools/acp-agents)
