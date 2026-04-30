---
read_when:
    - OpenClaw'da Zalo Personal (resmi olmayan) desteği istiyorsunuz
    - zalouser Plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Zalo Personal Plugin: QR ile oturum açma + yerel zca-js üzerinden mesajlaşma (Plugin kurulumu + kanal yapılandırması + araç)'
title: Zalo kişisel Plugin
x-i18n:
    generated_at: "2026-04-30T09:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Yerel `zca-js` kullanarak normal bir Zalo kullanıcı hesabını otomatikleştiren bir Plugin aracılığıyla OpenClaw için Zalo Personal desteği.

<Warning>
Resmi olmayan otomasyon, hesabın askıya alınmasına veya yasaklanmasına yol açabilir. Kullanım riski size aittir.
</Warning>

## Adlandırma

Kanal id'si, bunun bir **kişisel Zalo kullanıcı hesabını** otomatikleştirdiğini (resmi olmayan) açıkça belirtmek için `zalouser` olur. `zalo` değerini gelecekte olası resmi bir Zalo API entegrasyonu için ayrılmış tutuyoruz.

## Nerede çalışır

Bu Plugin, **Gateway işleminin içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, bunu **Gateway'i çalıştıran makineye** yükleyin/yapılandırın, ardından Gateway'i yeniden başlatın.

Harici bir `zca`/`openzca` CLI ikili dosyası gerekmez.

## Yükleme

### Seçenek A: npm'den yükle

```bash
openclaw plugins install @openclaw/zalouser
```

npm, OpenClaw'a ait paketi kullanımdan kaldırılmış olarak bildirirse, bu paket sürümü
daha eski bir harici paket serisindendir; daha yeni bir npm paketi yayımlanana kadar
güncel paketlenmiş bir OpenClaw derlemesi veya yerel klasör yolunu kullanın.

Ardından Gateway'i yeniden başlatın.

### Seçenek B: yerel bir klasörden yükle (geliştirme)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Ardından Gateway'i yeniden başlatın.

## Yapılandırma

Kanal yapılandırması `channels.zalouser` altında bulunur (`plugins.entries.*` altında değil):

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
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Ajan aracı

Araç adı: `zalouser`

Eylemler: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanal mesajı eylemleri, mesaj tepkileri için `react` desteği de sunar.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Topluluk Plugin'leri](/tr/plugins/community)
