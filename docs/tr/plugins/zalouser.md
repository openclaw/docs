---
read_when:
    - OpenClaw içinde Zalo Personal (resmi olmayan) desteği istediğinizde
    - zalouser plugin'ini yapılandırıyor veya geliştiriyorsanız
summary: 'Zalo Personal plugin''i: yerel `zca-js` ile QR giriş + mesajlaşma (plugin kurulumu + kanal yapılandırması + araç)'
title: Zalo Personal Plugin
x-i18n:
    generated_at: "2026-04-05T14:02:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (plugin)

Normal bir Zalo kullanıcı hesabını otomatikleştirmek için yerel `zca-js` kullanan bir plugin aracılığıyla OpenClaw için Zalo Personal desteği.

> **Uyarı:** Resmi olmayan otomasyon, hesabın askıya alınmasına/banlanmasına yol açabilir. Riski size aittir.

## Adlandırma

Kanal kimliği `zalouser` şeklindedir; bunun **kişisel bir Zalo kullanıcı hesabını** (resmi olmayan) otomatikleştirdiğini açıkça belirtmek içindir. Olası bir gelecekteki resmi Zalo API entegrasyonu için `zalo` adını saklı tutuyoruz.

## Nerede çalışır

Bu plugin **Gateway süreci içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, bunu **Gateway'i çalıştıran makinede** yükleyip yapılandırın, ardından Gateway'i yeniden başlatın.

Harici bir `zca`/`openzca` CLI ikili dosyası gerekmez.

## Kurulum

### Seçenek A: npm üzerinden yükleyin

```bash
openclaw plugins install @openclaw/zalouser
```

Ardından Gateway'i yeniden başlatın.

### Seçenek B: yerel bir klasörden yükleyin (geliştirme)

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
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Aracı aracı

Araç adı: `zalouser`

Eylemler: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanal mesajı eylemleri, mesaj tepkileri için `react` desteği de sunar.
