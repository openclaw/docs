---
read_when:
    - OpenClaw içinde Zalo Personal (resmi olmayan) desteği istiyorsunuz
    - '`zalouser` Plugin''ini yapılandırıyor veya geliştiriyorsunuz'
summary: 'Zalo Personal Plugin: yerel `zca-js` üzerinden QR ile oturum açma + mesajlaşma (Plugin kurulumu + kanal yapılandırması + araç)'
title: Zalo Personal Plugin
x-i18n:
    generated_at: "2026-04-24T09:24:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

OpenClaw için Zalo Personal desteği; normal bir Zalo kullanıcı hesabını otomatikleştirmek üzere yerel `zca-js` kullanan bir Plugin aracılığıyla sağlanır.

> **Warning:** Resmî olmayan otomasyon, hesabın askıya alınmasına/kapatılmasına yol açabilir. Kendi riskinizle kullanın.

## Adlandırma

Kanal kimliği `zalouser` olarak belirlenmiştir; böylece bunun **kişisel bir Zalo kullanıcı hesabını** (resmî olmayan şekilde) otomatikleştirdiği açık olur. Olası gelecekteki resmî Zalo API entegrasyonu için `zalo` adını saklı tutuyoruz.

## Nerede çalışır

Bu Plugin **Gateway süreci içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, bunu **Gateway'i çalıştıran makinede** kurup yapılandırın, ardından Gateway'i yeniden başlatın.

Harici `zca`/`openzca` CLI ikili dosyası gerekmez.

## Kurulum

### Seçenek A: npm üzerinden kurulum

```bash
openclaw plugins install @openclaw/zalouser
```

Ardından Gateway'i yeniden başlatın.

### Seçenek B: yerel klasörden kurulum (geliştirme)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Ardından Gateway'i yeniden başlatın.

## Yapılandırma

Kanal yapılandırması `plugins.entries.*` altında değil, `channels.zalouser` altında bulunur:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "OpenClaw'dan merhaba"
openclaw directory peers list --channel zalouser --query "name"
```

## Ajan aracı

Araç adı: `zalouser`

Eylemler: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanal mesajı eylemleri, mesaj tepkileri için `react` desteği de sunar.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Topluluk Plugin'leri](/tr/plugins/community)
