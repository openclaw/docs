---
read_when:
    - ACP tabanlı IDE entegrasyonları kurulurken
    - ACP oturum yönlendirmesi Gateway’e giderken sorun giderilirken
summary: IDE entegrasyonları için ACP köprüsünü çalıştırın
title: acp
x-i18n:
    generated_at: "2026-04-05T13:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2461b181e4a97dd84580581e9436ca1947a224decce8044132dbcf7fb2b7502c
    source_path: cli/acp.md
    workflow: 15
---

# acp

Bir OpenClaw Gateway ile iletişim kuran [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) köprüsünü çalıştırın.

Bu komut, IDE’ler için stdio üzerinden ACP konuşur ve istemleri WebSocket üzerinden Gateway’e iletir. ACP oturumlarını Gateway oturum anahtarlarına eşlenmiş halde tutar.

`openclaw acp`, Gateway destekli bir ACP köprüsüdür; tam ACP-yerel editör çalışma zamanı değildir. Oturum yönlendirme, istem iletimi ve temel streaming güncellemelerine odaklanır.

Harici bir MCP istemcisinin ACP harness oturumu barındırmak yerine doğrudan OpenClaw kanal konuşmalarıyla konuşmasını istiyorsanız, bunun yerine [`openclaw mcp serve`](/cli/mcp) kullanın.

## Bu ne değildir

Bu sayfa sıklıkla ACP harness oturumlarıyla karıştırılır.

`openclaw acp` şu anlama gelir:

- OpenClaw bir ACP sunucusu olarak davranır
- bir IDE veya ACP istemcisi OpenClaw’a bağlanır
- OpenClaw bu işi bir Gateway oturumuna iletir

Bu, OpenClaw’un `acpx` üzerinden Codex veya Claude Code gibi harici bir harness çalıştırdığı [ACP Agents](/tools/acp-agents) yapısından farklıdır.

Hızlı kural:

- editör/istemci ACP ile OpenClaw’a konuşmak istiyorsa: `openclaw acp` kullanın
- OpenClaw Codex/Claude/Gemini’yi ACP harness olarak başlatmalıysa: `/acp spawn` ve [ACP Agents](/tools/acp-agents) kullanın

## Uyumluluk Matrisi

| ACP alanı                                                             | Durum       | Notlar                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Uygulandı   | Stdio üzerinden Gateway chat/send + abort ile çekirdek köprü akışı.                                                                                                                                                                                     |
| `listSessions`, slash commands                                        | Uygulandı   | Oturum listesi Gateway oturum durumuna karşı çalışır; komutlar `available_commands_update` ile duyurulur.                                                                                                                                              |
| `loadSession`                                                         | Kısmi       | ACP oturumunu bir Gateway oturum anahtarına yeniden bağlar ve saklanan kullanıcı/asistan metin geçmişini yeniden oynatır. Tool/system geçmişi henüz yeniden oluşturulmaz.                                                                              |
| İstem içeriği (`text`, gömülü `resource`, görüntüler)                 | Kısmi       | Metin/kaynaklar chat girdisine düzleştirilir; görüntüler Gateway ekleri olur.                                                                                                                                                                           |
| Oturum kipleri                                                        | Kısmi       | `session/set_mode` desteklenir ve köprü thought level, tool verbosity, reasoning, usage detail ve elevated actions için ilk Gateway destekli oturum denetimlerini sunar. Daha geniş ACP-yerel kip/yapılandırma yüzeyleri hâlâ kapsam dışıdır.         |
| Oturum bilgisi ve kullanım güncellemeleri                             | Kısmi       | Köprü, önbelleğe alınmış Gateway oturum anlık görüntülerinden `session_info_update` ve best-effort `usage_update` bildirimleri üretir. Kullanım yaklaşık değerdir ve yalnızca Gateway toplam token değerlerini güncel olarak işaretlediğinde gönderilir. |
| Tool streaming                                                        | Kısmi       | `tool_call` / `tool_call_update` olayları, Gateway tool argümanları/sonuçları bunları sunduğunda ham G/Ç, metin içeriği ve best-effort dosya konumlarını içerir. Gömülü terminaller ve daha zengin diff-yerel çıktı hâlâ sunulmaz.                    |
| Oturum başına MCP sunucuları (`mcpServers`)                           | Desteklenmiyor | Köprü modu, oturum başına MCP sunucu isteklerini reddeder. Bunun yerine MCP’yi OpenClaw gateway veya agent üzerinde yapılandırın.                                                                                                                       |
| İstemci dosya sistemi yöntemleri (`fs/read_text_file`, `fs/write_text_file`) | Desteklenmiyor | Köprü, ACP istemci dosya sistemi yöntemlerini çağırmaz.                                                                                                                                                                                                  |
| İstemci terminal yöntemleri (`terminal/*`)                            | Desteklenmiyor | Köprü, ACP istemci terminalleri oluşturmaz veya terminal kimliklerini tool çağrıları üzerinden stream etmez.                                                                                                                                            |
| Oturum planları / thought streaming                                   | Desteklenmiyor | Köprü şu anda ACP planı veya thought güncellemeleri değil, çıktı metni ve tool durumu üretir.                                                                                                                                                          |

## Bilinen Sınırlamalar

- `loadSession`, saklanan kullanıcı ve asistan metin geçmişini yeniden oynatır, ancak geçmiş tool çağrılarını, sistem bildirimlerini veya daha zengin ACP-yerel olay türlerini yeniden oluşturmaz.
- Birden fazla ACP istemcisi aynı Gateway oturum anahtarını paylaşıyorsa, olay ve iptal yönlendirmesi istemci başına katı biçimde yalıtılmış değil, best-effort olur. Temiz editör-yerel turlar gerektiğinde varsayılan yalıtılmış `acp:<uuid>` oturumlarını tercih edin.
- Gateway durdurma durumları ACP durdurma nedenlerine çevrilir, ancak bu eşleme tam ACP-yerel bir çalışma zamanından daha az ifade gücüne sahiptir.
- İlk oturum denetimleri şu anda Gateway ayarlarının odaklı bir alt kümesini sunar: thought level, tool verbosity, reasoning, usage detail ve elevated actions. Model seçimi ve exec-host denetimleri henüz ACP yapılandırma seçenekleri olarak sunulmamaktadır.
- `session_info_update` ve `usage_update`, canlı ACP-yerel çalışma zamanı muhasebesinden değil, Gateway oturum anlık görüntülerinden türetilir. Kullanım yaklaşık değerdedir, maliyet verisi taşımaz ve yalnızca Gateway toplam token verisini güncel olarak işaretlediğinde üretilir.
- Tool eşlik verileri best-effort’tur. Köprü, bilinen tool argümanları/sonuçlarında görünen dosya yollarını gösterebilir, ancak henüz ACP terminalleri veya yapılandırılmış dosya diff’leri üretmez.

## Kullanım

```bash
openclaw acp

# Uzak Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Uzak Gateway (dosyadan token)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Mevcut bir oturum anahtarına bağlan
openclaw acp --session agent:main:main

# Etikete göre bağlan (önceden var olmalı)
openclaw acp --session-label "support inbox"

# İlk istemden önce oturum anahtarını sıfırla
openclaw acp --session agent:main:main --reset-session
```

## ACP istemcisi (hata ayıklama)

IDE olmadan köprüyü temel olarak doğrulamak için yerleşik ACP istemcisini kullanın.
ACP köprüsünü başlatır ve istemleri etkileşimli olarak yazmanıza olanak tanır.

```bash
openclaw acp client

# Başlatılan köprüyü uzak bir Gateway'e yönlendir
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Sunucu komutunu geçersiz kıl (varsayılan: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

İzin modeli (istemci hata ayıklama modu):

- Otomatik onay, izin listesi tabanlıdır ve yalnızca güvenilir çekirdek tool kimlikleri için geçerlidir.
- `read` otomatik onayı mevcut çalışma diziniyle sınırlıdır (`--cwd` ayarlıysa).
- ACP yalnızca dar salt okunur sınıfları otomatik onaylar: etkin cwd altındaki kapsamlı `read` çağrıları ile salt okunur arama araçları (`search`, `web_search`, `memory_search`). Bilinmeyen/çekirdek dışı araçlar, kapsam dışı okumalar, exec yetenekli araçlar, kontrol düzlemi araçları, değiştiren araçlar ve etkileşimli akışlar her zaman açık istem onayı gerektirir.
- Sunucu tarafından sağlanan `toolCall.kind`, güvenilmeyen meta veri olarak değerlendirilir (yetkilendirme kaynağı değildir).
- Bu ACP köprü ilkesi ACPX harness izinlerinden ayrıdır. OpenClaw’u `acpx` backend üzerinden çalıştırırsanız, `plugins.entries.acpx.config.permissionMode=approve-all`, bu harness oturumu için son çare “yolo” anahtarıdır.

## Bunu nasıl kullanırsınız

Bir IDE (veya başka bir istemci) Agent Client Protocol konuşuyorsa ve bunun bir OpenClaw Gateway oturumunu sürmesini istiyorsanız ACP kullanın.

1. Gateway’in çalıştığından emin olun (yerel veya uzak).
2. Gateway hedefini yapılandırın (config veya bayraklarla).
3. IDE’nizi stdio üzerinden `openclaw acp` çalıştıracak şekilde yönlendirin.

Örnek yapılandırma (kalıcı):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Örnek doğrudan çalıştırma (config yazmadan):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# yerel süreç güvenliği için tercih edilir
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agent seçimi

ACP agent’ları doğrudan seçmez. Gateway oturum anahtarına göre yönlendirir.

Belirli bir agent’ı hedeflemek için agent kapsamlı oturum anahtarlarını kullanın:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Her ACP oturumu tek bir Gateway oturum anahtarına eşlenir. Bir agent’ın birçok oturumu olabilir; anahtarı veya etiketi geçersiz kılmadığınız sürece ACP varsayılan olarak yalıtılmış bir `acp:<uuid>` oturumu kullanır.

Oturum başına `mcpServers`, köprü modunda desteklenmez. Bir ACP istemcisi bunları `newSession` veya `loadSession` sırasında gönderirse, köprü sessizce yok saymak yerine açık bir hata döndürür.

ACPX destekli oturumların OpenClaw plugin araçlarını görmesini istiyorsanız, oturum başına `mcpServers` geçirmeye çalışmak yerine gateway tarafındaki ACPX plugin köprüsünü etkinleştirin. Bkz. [ACP Agents](/tools/acp-agents#plugin-tools-mcp-bridge).

## `acpx` içinden kullanım (Codex, Claude, diğer ACP istemcileri)

Codex veya Claude Code gibi bir kodlama agent’ının ACP üzerinden OpenClaw botunuzla konuşmasını istiyorsanız, yerleşik `openclaw` hedefiyle `acpx` kullanın.

Tipik akış:

1. Gateway’i çalıştırın ve ACP köprüsünün ona ulaşabildiğinden emin olun.
2. `acpx openclaw` öğesini `openclaw acp`’ye yönlendirin.
3. Kodlama agent’ının kullanmasını istediğiniz OpenClaw oturum anahtarını hedefleyin.

Örnekler:

```bash
# Varsayılan OpenClaw ACP oturumunuza tek seferlik istek
acpx openclaw exec "Etkin OpenClaw oturum durumunu özetle."

# Sonraki turlar için kalıcı adlı oturum
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "OpenClaw work agent'ıma bu depoyla ilgili son bağlamı sor."
```

`acpx openclaw` öğesinin her seferinde belirli bir Gateway ve oturum anahtarını hedeflemesini istiyorsanız, `~/.acpx/config.json` içindeki `openclaw` agent komutunu geçersiz kılın:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Depo yereline ait bir OpenClaw checkout’u için, ACP akışı temiz kalsın diye geliştirme runner’ı yerine doğrudan CLI giriş noktasını kullanın. Örneğin:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Bu, Codex, Claude Code veya ACP uyumlu başka bir istemcinin terminal kazıması yapmadan bir OpenClaw agent’ından bağlamsal bilgi çekmesini sağlamanın en kolay yoludur.

## Zed editör kurulumu

`~/.config/zed/settings.json` içine özel bir ACP agent ekleyin (veya Zed’in Ayarlar arayüzünü kullanın):

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

Belirli bir Gateway veya agent hedeflemek için:

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

Varsayılan olarak ACP oturumları, `acp:` önekiyle yalıtılmış bir Gateway oturum anahtarı alır.
Bilinen bir oturumu yeniden kullanmak için bir oturum anahtarı veya etiket geçirin:

- `--session <key>`: belirli bir Gateway oturum anahtarını kullanır.
- `--session-label <label>`: var olan bir oturumu etikete göre çözümler.
- `--reset-session`: ilk kullanımdan önce bu anahtar için yeni bir oturum kimliği üretir (aynı anahtar, yeni transcript).

ACP istemciniz meta veriyi destekliyorsa, oturum başına geçersiz kılabilirsiniz:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Oturum anahtarları hakkında daha fazla bilgi için [/concepts/session](/concepts/session) bölümüne bakın.

## Seçenekler

- `--url <url>`: Gateway WebSocket URL’si (yapılandırılmışsa varsayılan olarak gateway.remote.url).
- `--token <token>`: Gateway kimlik doğrulama belirteci.
- `--token-file <path>`: Gateway kimlik doğrulama belirtecini dosyadan okur.
- `--password <password>`: Gateway kimlik doğrulama parolası.
- `--password-file <path>`: Gateway kimlik doğrulama parolasını dosyadan okur.
- `--session <key>`: varsayılan oturum anahtarı.
- `--session-label <label>`: çözümlenecek varsayılan oturum etiketi.
- `--require-existing`: oturum anahtarı/etiketi yoksa başarısız olur.
- `--reset-session`: ilk kullanımdan önce oturum anahtarını sıfırlar.
- `--no-prefix-cwd`: istemlerin başına çalışma dizinini eklemez.
- `--provenance <off|meta|meta+receipt>`: ACP provenance meta verisini veya alındılarını ekler.
- `--verbose, -v`: stderr’e ayrıntılı günlük kaydı.

Güvenlik notu:

- `--token` ve `--password`, bazı sistemlerde yerel süreç listelerinde görünebilir.
- `--token-file`/`--password-file` veya ortam değişkenlerini (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) tercih edin.
- Gateway kimlik doğrulama çözümlemesi, diğer Gateway istemcilerinin kullandığı ortak sözleşmeyi izler:
  - yerel mod: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> yalnızca `gateway.auth.*` ayarsızsa `gateway.remote.*` geri dönüşü (yapılandırılmış ama çözümlenmemiş yerel SecretRef’ler kapalı başarısız olur)
  - uzak mod: uzak öncelik kurallarına göre env/config geri dönüşü ile `gateway.remote.*`
  - `--url`, geçersiz kılma açısından güvenlidir ve örtük config/env kimlik bilgilerini yeniden kullanmaz; açık `--token`/`--password` (veya dosya varyantları) geçirin
- ACP çalışma zamanı backend alt süreçleri `OPENCLAW_SHELL=acp` alır; bu, bağlama özgü shell/profile kuralları için kullanılabilir.
- `openclaw acp client`, başlatılan köprü sürecinde `OPENCLAW_SHELL=acp-client` ayarlar.

### `acp client` seçenekleri

- `--cwd <dir>`: ACP oturumu için çalışma dizini.
- `--server <command>`: ACP sunucu komutu (varsayılan: `openclaw`).
- `--server-args <args...>`: ACP sunucusuna geçirilen ek argümanlar.
- `--server-verbose`: ACP sunucusunda ayrıntılı günlük kaydını etkinleştirir.
- `--verbose, -v`: ayrıntılı istemci günlük kaydı.
