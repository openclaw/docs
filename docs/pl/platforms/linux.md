---
read_when:
    - Szukanie stanu aplikacji towarzyszącej dla Linux
    - Planowanie zakresu platformy lub wkładu
    - Debugowanie zabijania procesów przez OOM w Linuksie lub kodu wyjścia 137 na VPS albo w kontenerze
summary: Status obsługi Linuksa i aplikacji towarzyszącej
title: Aplikacja na Linuksa
x-i18n:
    generated_at: "2026-06-27T17:47:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway jest w pełni obsługiwany w systemie Linux. **Node jest zalecanym środowiskiem uruchomieniowym**.
Bun nie jest zalecany dla Gateway (błędy WhatsApp/Telegram).

Natywne aplikacje towarzyszące dla systemu Linux są planowane. Wkład jest mile widziany, jeśli chcesz pomóc zbudować taką aplikację.

## Szybka ścieżka dla początkujących (VPS)

1. Zainstaluj Node 24 (zalecane; Node 22 LTS, obecnie `22.19+`, nadal działa ze względu na zgodność)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Z laptopa: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Otwórz `http://127.0.0.1:18789/` i uwierzytelnij się skonfigurowanym współdzielonym sekretem (domyślnie tokenem; hasłem, jeśli ustawisz `gateway.auth.mode: "password"`)

Pełny przewodnik po serwerze Linux: [Serwer Linux](/pl/vps). Przykład VPS krok po kroku: [exe.dev](/pl/install/exe-dev)

## Instalacja

- [Pierwsze kroki](/pl/start/getting-started)
- [Instalacja i aktualizacje](/pl/install/updating)
- Opcjonalne przepływy: [Bun (eksperymentalny)](/pl/install/bun), [Nix](/pl/install/nix), [Docker](/pl/install/docker)

## Gateway

- [Runbook Gateway](/pl/gateway)
- [Konfiguracja](/pl/gateway/configuration)

## Instalacja usługi Gateway (CLI)

Użyj jednej z tych opcji:

```
openclaw onboard --install-daemon
```

Lub:

```
openclaw gateway install
```

Lub:

```
openclaw configure
```

Po wyświetleniu monitu wybierz **Usługa Gateway**.

Naprawa/migracja:

```
openclaw doctor
```

## Kontrola systemu (jednostka użytkownika systemd)

OpenClaw domyślnie instaluje usługę systemd **użytkownika**. Użyj usługi **systemowej** dla współdzielonych lub stale działających serwerów. `openclaw gateway install` i
`openclaw onboard --install-daemon` renderują już dla Ciebie bieżącą kanoniczną jednostkę;
zapisuj ją ręcznie tylko wtedy, gdy potrzebujesz niestandardowej konfiguracji systemu/menedżera usług.
Pełne wskazówki dotyczące usługi znajdują się w [runbooku Gateway](/pl/gateway).

Minimalna konfiguracja:

Utwórz `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Włącz ją:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presja pamięci i zakończenia przez OOM

W systemie Linux jądro wybiera ofiarę OOM, gdy host, maszyna wirtualna lub cgroup kontenera
wyczerpie pamięć. Gateway może być złym kandydatem, ponieważ utrzymuje długotrwałe
sesje i połączenia kanałów. Dlatego OpenClaw w miarę możliwości przesuwa preferencję tak,
aby przejściowe procesy potomne były zabijane przed Gateway.

Dla kwalifikujących się uruchomień procesów potomnych w systemie Linux OpenClaw uruchamia proces potomny przez krótki
wrapper `/bin/sh`, który podnosi własne `oom_score_adj` procesu potomnego do `1000`, a następnie
wykonuje `exec` właściwego polecenia. Jest to operacja niewymagająca uprawnień, ponieważ proces potomny
tylko zwiększa własne prawdopodobieństwo zabicia przez OOM.

Objęte powierzchnie procesów potomnych obejmują:

- procesy potomne poleceń zarządzanych przez nadzorcę,
- procesy potomne powłoki PTY,
- procesy potomne serwera stdio MCP,
- procesy przeglądarki/Chrome uruchomione przez OpenClaw.

Wrapper działa tylko w systemie Linux i jest pomijany, gdy `/bin/sh` jest niedostępny. Jest
również pomijany, jeśli środowisko procesu potomnego ustawia `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` lub `off`.

Aby zweryfikować proces potomny:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Oczekiwana wartość dla objętych procesów potomnych to `1000`. Proces Gateway powinien zachować
swój normalny wynik, zwykle `0`.

Zalecana jednostka systemd ustawia również `OOMPolicy=continue`. Dzięki temu jednostka
Gateway pozostaje aktywna, gdy przejściowy proces potomny zostanie wybrany przez mechanizm OOM killer;
polecenie/sesja procesu potomnego może zakończyć się niepowodzeniem i zgłosić błąd bez oznaczania
całej usługi gateway jako nieudanej przez systemd i bez restartowania wszystkich kanałów.

Nie zastępuje to normalnego dostrajania pamięci. Jeśli VPS lub kontener wielokrotnie
zabija procesy potomne, zwiększ limit pamięci, ogranicz współbieżność lub dodaj silniejsze
mechanizmy kontroli zasobów, takie jak `MemoryMax=` systemd albo limity pamięci na poziomie kontenera.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Serwer Linux](/pl/vps)
- [Raspberry Pi](/pl/install/raspberry-pi)
