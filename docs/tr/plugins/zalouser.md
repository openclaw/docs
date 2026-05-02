---
read_when:
    - OpenClaw'da Zalo Personal (resmi olmayan) desteği istiyorsunuz
    - zalouser Plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Zalo Personal Plugin: QR ile oturum açma + yerel zca-js aracılığıyla mesajlaşma (Plugin kurulumu + kanal yapılandırması + araç)'
title: Zalo kişisel Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Normal bir Zalo kullanıcı hesabını otomatikleştirmek için yerel `zca-js` kullanarak, bir Plugin aracılığıyla OpenClaw için Zalo Personal desteği.

<Warning>
Resmi olmayan otomasyon, hesabın askıya alınmasına veya yasaklanmasına yol açabilir. Kullanım riski size aittir.
</Warning>

## Adlandırma

Kanal kimliği `zalouser` şeklindedir; bu, bunun bir **kişisel Zalo kullanıcı hesabını** otomatikleştirdiğini açıkça belirtir (resmi değildir). `zalo` değerini, gelecekte olası bir resmi Zalo API entegrasyonu için ayrılmış tutuyoruz.

## Nerede çalışır

Bu Plugin, **Gateway işleminin içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, bunu **Gateway'i çalıştıran makineye** kurun/yapılandırın ve ardından Gateway'i yeniden başlatın.

Harici `zca`/`openzca` CLI ikili dosyası gerekmez.

## Kurulum

### Seçenek A: npm'den kurma

```bash
openclaw plugins install @openclaw/zalouser
```

Geçerli resmi yayın etiketini takip etmek için yalın paketi kullanın. Kesin bir
sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Ardından Gateway'i yeniden başlatın.

### Seçenek B: yerel bir klasörden kurma (geliştirme)

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

## Agent aracı

Araç adı: `zalouser`

Eylemler: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanal mesaj eylemleri, mesaj tepkileri için `react` desteği de sunar.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Topluluk Plugin'leri](/tr/plugins/community)
