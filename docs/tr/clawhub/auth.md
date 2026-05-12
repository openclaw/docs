---
read_when:
    - ClawHub'da oturum açma
    - ClawHub CLI Kullanımı
    - 401 Hatalarını Ayıklama
summary: ClawHub oturum açma, API belirteçleri, CLI oturum açma, belirteç depolama ve belirteç iptali.
x-i18n:
    generated_at: "2026-05-12T23:29:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Kimlik Doğrulama

ClawHub, web oturum açma için GitHub kullanır. CLI, oturum açılmış bu hesap
üzerinden oluşturulan ClawHub API belirteçlerini kullanır.

## Web'de oturum açma

[clawhub.ai](https://clawhub.ai) adresinde GitHub ile oturum açın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar normal ClawHub oturum
açma işlemini tamamlayamaz. Oturum açma sizi oturum kapalı durumuna geri
döndürürse hesabınızın durumu iyi olmayabilir.

## CLI ile oturum açma

Varsayılan CLI oturum açma akışı tarayıcınızı açar:

```bash
clawhub login
clawhub whoami
```

Ne olur:

1. CLI, `127.0.0.1` üzerinde geçici bir geri çağrı sunucusu başlatır.
2. Tarayıcınız ClawHub oturum açma sayfasını açar.
3. GitHub oturum açma işleminden sonra ClawHub bir API belirteci oluşturur.
4. Tarayıcı yerel geri çağrıya yeniden yönlendirilir.
5. CLI, belirteci ClawHub yapılandırma dosyanızda saklar.

Tarayıcınız güvenlik duvarı, VPN veya proxy kuralları nedeniyle yerel geri
çağrıya ulaşamıyorsa başsız belirteç akışını kullanın.

## Başsız oturum açma

ClawHub web kullanıcı arayüzünde bir belirteç oluşturun, ardından bunu CLI'ye
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

CLI tek kullanımlık bir kod yazdırır ve siz
`https://clawhub.ai/cli/device` adresinde yetkilendirirken bekler.

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

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar mevcut API
belirteçlerini kullanmaya devam edemez.
