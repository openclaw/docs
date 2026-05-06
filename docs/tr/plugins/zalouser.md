---
read_when:
    - OpenClaw’da Zalo Personal (resmi olmayan) desteği istiyorsunuz
    - zalouser Plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Zalo Personal Plugin: QR ile oturum açma + yerel zca-js aracılığıyla mesajlaşma (Plugin kurulumu + kanal yapılandırması + araç)'
title: Zalo kişisel Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

OpenClaw için Zalo Personal desteği, normal bir Zalo kullanıcı hesabını otomatikleştirmek üzere yerel `zca-js` kullanan bir Plugin aracılığıyla sağlanır.

<Warning>
Resmi olmayan otomasyon, hesabın askıya alınmasına veya yasaklanmasına yol açabilir. Kullanım riski size aittir.
</Warning>

## Adlandırma

Kanal kimliği `zalouser` değeridir; bu, bunun bir **kişisel Zalo kullanıcı hesabını** otomatikleştirdiğini açıkça belirtir (resmi değildir). `zalo` değerini olası gelecekteki resmi bir Zalo API entegrasyonu için ayrılmış tutuyoruz.

## Nerede çalışır

Bu Plugin, **Gateway işleminin içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, bunu **Gateway’i çalıştıran makinede** kurun/yapılandırın ve ardından Gateway’i yeniden başlatın.

Harici bir `zca`/`openzca` CLI ikili dosyası gerekmez.

## Kurulum

### Seçenek A: npm’den kurma

```bash
openclaw plugins install @openclaw/zalouser
```

Geçerli resmi sürüm etiketini takip etmek için paketi sürüm belirtmeden kullanın. Kesin bir
sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Ardından Gateway’i yeniden başlatın.

### Seçenek B: yerel klasörden kurma (geliştirme)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Ardından Gateway’i yeniden başlatın.

## Yapılandırma

Kanal yapılandırması `channels.zalouser` altında yer alır (`plugins.entries.*` altında değil):

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

Kanal mesajı eylemleri, mesaj tepkileri için `react` desteği de sağlar.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Topluluk Plugin’leri](/tr/plugins/community)
