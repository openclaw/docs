---
read_when:
    - Sprawdzanie statusu aplikacji towarzyszącej dla systemu Linux
    - Planowanie obsługi platform lub wkładu w projekt
    - Debugowanie zakończeń procesów przez mechanizm OOM w systemie Linux lub kodu wyjścia 137 na serwerze VPS albo w kontenerze
summary: Obsługa systemu Linux i status aplikacji towarzyszącej
title: Aplikacja dla systemu Linux
x-i18n:
    generated_at: "2026-07-12T15:18:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway jest w pełni obsługiwany w systemie Linux. Node jest zalecanym środowiskiem uruchomieniowym; Bun
nie jest zalecany (znane problemy z WhatsApp/Telegram).

Natywna aplikacja towarzysząca dla systemu Linux nie jest jeszcze dostępna. Zachęcamy do współtworzenia.

## Szybka ścieżka (VPS)

1. Zainstaluj Node 24 (zalecany) lub Node 22.19+ (LTS, nadal obsługiwany).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Na swoim laptopie uruchom: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Otwórz `http://127.0.0.1:18789/` i uwierzytelnij się przy użyciu skonfigurowanego współdzielonego
   sekretu (domyślnie tokenu; hasła, jeśli `gateway.auth.mode` ma wartość `"password"`).

Pełny przewodnik po serwerze: [Serwer Linux](/pl/vps). Przykład konfiguracji VPS krok po kroku:
[exe.dev](/pl/install/exe-dev).

## Instalacja

- [Pierwsze kroki](/pl/start/getting-started)
- [Instalacja i aktualizacje](/pl/install/updating)
- Opcjonalnie: [Bun (eksperymentalny)](/pl/install/bun), [Nix](/pl/install/nix), [Docker](/pl/install/docker)

## Usługa Gateway (systemd)

Zainstaluj przy użyciu jednego z poniższych poleceń:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # po wyświetleniu monitu wybierz „Usługa Gateway”
```

Napraw lub zmigruj istniejącą instalację:

```bash
openclaw doctor
```

`openclaw gateway install` domyślnie generuje jednostkę systemd **użytkownika**. Pełne
wskazówki dotyczące usługi, w tym wariant jednostki na poziomie **systemowym** dla współdzielonych lub
stale działających hostów, znajdują się w [podręczniku operacyjnym Gateway](/pl/gateway#supervision-and-service-lifecycle).

Utwórz jednostkę ręcznie tylko w przypadku konfiguracji niestandardowej. Minimalny przykład jednostki użytkownika
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Włącz ją:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presja na pamięć i zakończenia procesów przez mechanizm OOM

W systemie Linux jądro wybiera proces do zakończenia przez mechanizm OOM, gdy hostowi, maszynie wirtualnej lub grupie cgroup kontenera
zabraknie pamięci. Gateway jest niewłaściwym kandydatem, ponieważ zarządza długotrwałymi
sesjami i połączeniami kanałów, dlatego OpenClaw zwiększa prawdopodobieństwo, że w miarę możliwości najpierw
zostaną zakończone tymczasowe procesy potomne.

W przypadku odpowiednich procesów potomnych uruchamianych w systemie Linux OpenClaw opakowuje polecenie w krótki
skrypt pośredniczący `/bin/sh`, który podnosi wartość `oom_score_adj` samego procesu potomnego do `1000`, a następnie
wykonuje rzeczywiste polecenie za pomocą `exec`. Nie wymaga to podwyższonych uprawnień: proces zawsze może zwiększyć
własny wynik OOM.

Objęte mechanizmem rodzaje procesów potomnych:

- Procesy potomne poleceń zarządzane przez nadzorcę
- Procesy potomne powłoki PTY
- Procesy potomne serwerów MCP korzystających ze standardowego wejścia i wyjścia
- Procesy przeglądarki/Chrome uruchamiane przez OpenClaw (za pośrednictwem środowiska uruchomieniowego procesów SDK Pluginu)

Mechanizm opakowujący działa tylko w systemie Linux i jest pomijany, gdy `/bin/sh` jest niedostępny lub gdy
środowisko procesu potomnego ustawia `OPENCLAW_CHILD_OOM_SCORE_ADJ` na `0`, `false`, `no` albo
`off`.

Sprawdź proces potomny:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Oczekiwana wartość dla objętych procesów potomnych to `1000`; sam proces Gateway
zachowuje standardową wartość (zwykle `0`).

Ustawienie `OOMPolicy=continue` jednostki systemd utrzymuje działanie usługi Gateway, gdy
mechanizm OOM wybierze tymczasowy proces potomny, zamiast oznaczać całą
jednostkę jako uszkodzoną i ponownie uruchamiać wszystkie kanały; proces potomny lub sesja, które uległy awarii, zgłaszają
własny błąd.

Nie zastępuje to standardowego dostrajania pamięci. Jeśli VPS lub kontener wielokrotnie
kończy procesy potomne, zwiększ limit pamięci, zmniejsz współbieżność lub dodaj bardziej rygorystyczne
mechanizmy kontroli zasobów (systemd `MemoryMax=`, limity pamięci kontenera).

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Serwer Linux](/pl/vps)
- [Raspberry Pi](/pl/install/raspberry-pi)
- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Konfiguracja Gateway](/pl/gateway/configuration)
