---
read_when:
    - ClawHub’da oturum açma
    - ClawHub CLI’yi Kullanma
    - 401 hatalarını ayıklama
summary: ClawHub oturum açma, API tokenları, CLI girişi, token depolama ve iptal etme.
x-i18n:
    generated_at: "2026-07-01T13:16:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Kimlik Doğrulama

ClawHub, web oturumu açma için GitHub kullanır. CLI, oturum açılmış bu hesap
üzerinden oluşturulan ClawHub API belirteçlerini kullanır.

## Web oturumu açma

[clawhub.ai](https://clawhub.ai) adresinde GitHub ile oturum açın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar normal ClawHub oturum
açma işlemini tamamlayamaz. Oturum açma sizi çıkış yapılmış duruma döndürüyorsa
hesabınız iyi durumda olmayabilir. Hesabınız yasaklandıysa veya devre dışı
bırakıldıysa, bunun bir hata olduğunu düşünüyorsanız
[ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

## CLI oturumu açma

Varsayılan CLI oturum açma akışı tarayıcınızı açar:

```bash
clawhub login
clawhub whoami
```

Olanlar:

1. CLI, `127.0.0.1` üzerinde geçici bir geri çağırma sunucusu başlatır.
2. Tarayıcınız ClawHub oturum açma sayfasını açar.
3. GitHub oturum açma işleminden sonra ClawHub bir API belirteci oluşturur.
4. Tarayıcı yerel geri çağırmaya yönlendirilir.
5. CLI, belirteci ClawHub yapılandırma dosyanıza kaydeder.

Tarayıcınız güvenlik duvarı, VPN veya proxy kuralları nedeniyle yerel geri
çağırmaya ulaşamıyorsa, başsız belirteç akışını kullanın.

## Başsız oturum açma

ClawHub web kullanıcı arayüzünde bir belirteç oluşturun, ardından bunu CLI'ya
iletin:

```bash
clawhub login --token clh_...
```

Bu akışı sunucular, CI işleri veya yalnızca terminal bulunan ortamlar için
kullanın.

Başka bir yerde tarayıcı açabildiğiniz uzak kabuklarda şunu çalıştırın:

```bash
clawhub login --device
```

CLI tek kullanımlık bir kod yazdırır ve siz
`https://clawhub.ai/cli/device` adresinde yetkilendirme yaparken bekler.

## Belirteç depolama

Varsayılan yapılandırma yolları:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Yolu şununla geçersiz kılın:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI kurulumu için saklanan belirteci şununla yazdırın:

```bash
clawhub token
```

## İptal Etme

API belirteçlerini ClawHub web kullanıcı arayüzünde iptal edebilirsiniz.

İptal edilmiş, geçersiz veya eksik belirteçler `401 Unauthorized` döndürür.
`clawhub login` ile tekrar oturum açın veya `clawhub login --token` ile yeni bir
belirteç sağlayın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar mevcut API
belirteçlerini kullanmaya devam edemez. Hesabınız yasaklandıysa veya devre dışı
bırakıldıysa, bunun bir hata olduğunu düşünüyorsanız
[ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.
