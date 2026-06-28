---
read_when:
    - OpenClaw'da Zalo Personal (resmi olmayan) desteği istiyorsunuz
    - zalouser Plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Zalo Personal Plugin’i: QR ile oturum açma + yerel zca-js üzerinden mesajlaşma (Plugin kurulumu + kanal yapılandırması + araç)'
title: Zalo kişisel Plugin
x-i18n:
    generated_at: "2026-05-10T19:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw için Zalo Personal desteği, normal bir Zalo kullanıcı hesabını otomatikleştirmek üzere yerel `zca-js` kullanan bir Plugin aracılığıyla sağlanır.

<Warning>
Resmi olmayan otomasyon hesabın askıya alınmasına veya yasaklanmasına yol açabilir. Kendi riskinizle kullanın.
</Warning>

## Adlandırma

Kanal kimliği, bunun **kişisel Zalo kullanıcı hesabını** otomatikleştirdiğini açıkça göstermek için `zalouser` şeklindedir (resmi değildir). `zalo` değerini gelecekteki olası resmi Zalo API entegrasyonu için ayrılmış tutuyoruz.

## Nerede çalışır

Bu Plugin **Gateway süreci içinde** çalışır.

Uzak bir Gateway kullanıyorsanız bunu **Gateway’in çalıştığı makinede** kurun/yapılandırın, ardından Gateway’i yeniden başlatın.

Harici bir `zca`/`openzca` CLI ikilisi gerekmez.

## Kurulum

### Seçenek A: npm’den kurma

```bash
openclaw plugins install @openclaw/zalouser
```

Geçerli resmi yayın etiketini takip etmek için yalın paketi kullanın. Tam bir
sürümü yalnızca yeniden üretilebilir bir kurulum gerektiğinde sabitleyin.

Ardından Gateway’i yeniden başlatın.

### Seçenek B: yerel klasörden kurma (geliştirme)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Ardından Gateway’i yeniden başlatın.

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

## Aracı aracı

Araç adı: `zalouser`

Eylemler: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanal mesaj eylemleri, mesaj tepkileri için `react` desteği de sunar.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [ClawHub](/tr/clawhub)
