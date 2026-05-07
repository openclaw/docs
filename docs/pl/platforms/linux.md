---
read_when:
    - Sprawdzanie statusu aplikacji towarzyszącej dla systemu Linux
    - Planowanie obsługi platform lub wkładu
    - Debugowanie zabicia przez OOM w systemie Linux lub zakończenia z kodem 137 na serwerze VPS albo w kontenerze
summary: Obsługa systemu Linux + status aplikacji towarzyszącej
title: Aplikacja dla systemu Linux
x-i18n:
    generated_at: "2026-05-07T13:21:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway jest w pełni obsługiwany w systemie Linux. **Node jest zalecanym środowiskiem uruchomieniowym**.
Bun nie jest zalecany dla Gateway (błędy WhatsApp/Telegram).

Planowane są natywne aplikacje towarzyszące dla systemu Linux. Wkład jest mile widziany, jeśli chcesz pomóc zbudować jedną z nich.

## Szybka ścieżka dla początkujących (VPS)

1. Zainstaluj Node 24 (zalecany; Node 22 LTS, obecnie `22.16+`, nadal działa ze względu na zgodność)
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

Użyj jednego z tych poleceń:

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

## Sterowanie systemem (jednostka użytkownika systemd)

OpenClaw domyślnie instaluje usługę systemd **użytkownika**. Użyj usługi **systemowej**
dla serwerów współdzielonych lub zawsze włączonych. `openclaw gateway install` i
`openclaw onboard --install-daemon` już generują dla Ciebie bieżącą kanoniczną jednostkę;
pisz ją ręcznie tylko wtedy, gdy potrzebujesz niestandardowej konfiguracji systemu/menedżera usług.
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
KillMode=control-group

[Install]
WantedBy=default.target
```

Włącz ją:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presja pamięci i zabijanie przez OOM

W systemie Linux jądro wybiera ofiarę OOM, gdy host, maszyna wirtualna lub cgroup kontenera
wyczerpie pamięć. Gateway może być złym wyborem na ofiarę, ponieważ utrzymuje długotrwałe
sesje i połączenia kanałów. Dlatego OpenClaw, gdy to możliwe, ukierunkowuje tymczasowe
procesy potomne tak, aby były zabijane przed Gateway.

Dla kwalifikujących się procesów potomnych w systemie Linux OpenClaw uruchamia proces potomny przez krótki
wrapper `/bin/sh`, który podnosi własne `oom_score_adj` procesu potomnego do `1000`, a następnie
wykonuje `exec` właściwego polecenia. Jest to operacja niewymagająca uprawnień, ponieważ proces potomny
zwiększa tylko własne prawdopodobieństwo zabicia przez OOM.

Objęte powierzchnie procesów potomnych obejmują:

- procesy potomne poleceń zarządzanych przez nadzorcę,
- procesy potomne powłoki PTY,
- procesy potomne serwera MCP stdio,
- procesy przeglądarki/Chrome uruchamiane przez OpenClaw.

Wrapper działa tylko w systemie Linux i jest pomijany, gdy `/bin/sh` jest niedostępny. Jest
również pomijany, jeśli środowisko procesu potomnego ustawia `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` lub `off`.

Aby zweryfikować proces potomny:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Oczekiwana wartość dla objętych procesów potomnych to `1000`. Proces Gateway powinien zachować
swój normalny wynik, zwykle `0`.

Nie zastępuje to normalnego dostrajania pamięci. Jeśli VPS lub kontener wielokrotnie
zabija procesy potomne, zwiększ limit pamięci, zmniejsz współbieżność albo dodaj silniejsze
mechanizmy kontroli zasobów, takie jak systemd `MemoryMax=` lub limity pamięci na poziomie kontenera.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Serwer Linux](/pl/vps)
- [Raspberry Pi](/pl/install/raspberry-pi)
