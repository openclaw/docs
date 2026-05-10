---
read_when:
    - ClawHub'da oturum açma
    - ClawHub CLI Kullanımı
    - 401 Hatalarında Hata Ayıklama
summary: ClawHub oturum açma, API belirteçleri, CLI oturum açma, belirteç depolama ve iptal.
x-i18n:
    generated_at: "2026-05-10T19:25:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Kimlik Doğrulama

ClawHub, web oturum açma için GitHub kullanır. CLI, oturum açılmış bu hesap
üzerinden oluşturulan ClawHub API belirteçlerini kullanır.

## Web oturum açma

GitHub'u kullanarak [clawhub.ai](https://clawhub.ai) adresinde oturum açın.

Silinen, yasaklanan veya devre dışı bırakılan hesaplar normal ClawHub oturum açma
işlemini tamamlayamaz. Oturum açma sizi oturum kapalı durumuna geri döndürürse
hesabınızın durumu iyi olmayabilir.

## CLI oturum açma

Varsayılan CLI oturum açma akışı tarayıcınızı açar:

```bash
clawhub login
clawhub whoami
```

Olanlar:

1. CLI, `127.0.0.1` üzerinde geçici bir geri çağrı sunucusu başlatır.
2. Tarayıcınız ClawHub oturum açma sayfasını açar.
3. GitHub oturum açmasından sonra ClawHub bir API belirteci oluşturur.
4. Tarayıcı yerel geri çağrıya yeniden yönlendirilir.
5. CLI, belirteci ClawHub yapılandırma dosyanıza kaydeder.

Tarayıcınız güvenlik duvarı, VPN veya proxy kuralları nedeniyle yerel geri
çağrıya ulaşamıyorsa başsız belirteç akışını kullanın.

## Başsız oturum açma

ClawHub web kullanıcı arayüzünde bir belirteç oluşturun, ardından bunu CLI'ya
geçirin:

```bash
clawhub login --token clh_...
```

Bu akışı sunucular, CI işleri veya yalnızca terminal kullanılan ortamlar için
kullanın.

Başka bir yerde tarayıcı açabildiğiniz uzak kabuklar için şunu çalıştırın:

```bash
clawhub login --device
```

CLI tek kullanımlık bir kod yazdırır ve siz `https://clawhub.ai/cli/device`
adresinde yetkilendirirken bekler.

## Belirteç depolama

Varsayılan yapılandırma yolları:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Yolu şununla geçersiz kılın:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## İptal

API belirteçlerini ClawHub web kullanıcı arayüzünde iptal edebilirsiniz.

İptal edilmiş, geçersiz veya eksik belirteçler `401 Unauthorized` döndürür.
`clawhub login` ile yeniden oturum açın veya `clawhub login --token` ile yeni
bir belirteç sağlayın.

Silinen, yasaklanan veya devre dışı bırakılan hesaplar mevcut API belirteçlerini
kullanmaya devam edemez.
