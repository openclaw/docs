---
read_when:
    - Zatwierdzasz żądania parowania urządzeń.
    - Musisz rotować lub unieważniać tokeny urządzeń.
summary: Dokumentacja CLI dla `openclaw devices` (parowanie urządzeń + rotacja/unieważnianie tokenów)
title: Urządzenia
x-i18n:
    generated_at: "2026-04-24T09:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Zarządzaj żądaniami parowania urządzeń i tokenami o zakresie urządzenia.

## Polecenia

### `openclaw devices list`

Wyświetla oczekujące żądania parowania i sparowane urządzenia.

```text
openclaw devices list
openclaw devices list --json
```

Dane wyjściowe oczekujących żądań pokazują żądany dostęp obok aktualnie
zatwierdzonego dostępu urządzenia, gdy urządzenie jest już sparowane. Dzięki temu
rozszerzenia zakresu/roli są widoczne wprost zamiast sprawiać wrażenie, że parowanie zostało utracone.

### `openclaw devices remove <deviceId>`

Usuń jeden wpis sparowanego urządzenia.

Gdy jesteś uwierzytelniony tokenem sparowanego urządzenia, wywołujący bez uprawnień administratora może
usunąć tylko wpis **własnego** urządzenia. Usunięcie innego urządzenia wymaga
`operator.admin`.

```text
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Wyczyść sparowane urządzenia zbiorczo.

```text
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Zatwierdź oczekujące żądanie parowania urządzenia po dokładnym `requestId`. Jeśli `requestId`
zostanie pominięte albo zostanie przekazane `--latest`, OpenClaw tylko wypisze wybrane oczekujące
żądanie i zakończy działanie; uruchom zatwierdzenie ponownie z dokładnym identyfikatorem żądania po zweryfikowaniu szczegółów.

Uwaga: jeśli urządzenie ponowi próbę parowania ze zmienionymi danymi uwierzytelnienia (rola/zakresy/klucz
publiczny), OpenClaw zastępuje poprzedni oczekujący wpis i wydaje nowy
`requestId`. Uruchom `openclaw devices list` tuż przed zatwierdzeniem, aby użyć
aktualnego identyfikatora.

Jeśli urządzenie jest już sparowane i żąda szerszych zakresów albo szerszej roli,
OpenClaw pozostawia istniejące zatwierdzenie i tworzy nowe oczekujące żądanie
rozszerzenia. Przejrzyj kolumny `Requested` i `Approved` w `openclaw devices list`
albo użyj `openclaw devices approve --latest`, aby podejrzeć dokładne rozszerzenie przed
jego zatwierdzeniem.

```text
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Odrzuć oczekujące żądanie parowania urządzenia.

```text
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Obróć token urządzenia dla określonej roli (opcjonalnie aktualizując zakresy).
Docelowa rola musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia;
rotacja nie może utworzyć nowej niezatwierdzonej roli.
Jeśli pominiesz `--scope`, późniejsze ponowne połączenia z zapisanym obróconym tokenem użyją ponownie
pamięci podręcznej zatwierdzonych zakresów tego tokenu. Jeśli przekażesz jawne wartości `--scope`,
staną się one zapisanym zestawem zakresów dla przyszłych ponownych połączeń z tokenem z pamięci podręcznej.
Wywołujący bez uprawnień administratora używający sesji sparowanego urządzenia może obracać tylko token **własnego**
urządzenia.
Ponadto wszelkie jawne wartości `--scope` muszą mieścić się w zakresie operatora bieżącej
sesji wywołującej; rotacja nie może utworzyć szerszego tokenu operatora niż ten, który
wywołujący już posiada.

```text
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Zwraca ładunek nowego tokenu jako JSON.

### `openclaw devices revoke --device <id> --role <role>`

Unieważnij token urządzenia dla określonej roli.

Wywołujący bez uprawnień administratora używający sesji sparowanego urządzenia może unieważnić tylko token **własnego**
urządzenia.
Unieważnienie tokenu innego urządzenia wymaga `operator.admin`.

```text
openclaw devices revoke --device <deviceId> --role node
```

Zwraca wynik unieważnienia jako JSON.

## Typowe opcje

- `--url <url>`: URL WebSocket Gateway (domyślnie `gateway.remote.url`, jeśli jest skonfigurowany).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--password <password>`: hasło Gateway (uwierzytelnianie hasłem).
- `--timeout <ms>`: limit czasu RPC.
- `--json`: wyjście JSON (zalecane do skryptów).

Uwaga: po ustawieniu `--url` CLI nie korzysta z konfiguracji ani zmiennych środowiskowych jako źródła poświadczeń.
Przekaż jawnie `--token` albo `--password`. Brak jawnych poświadczeń jest błędem.

## Uwagi

- Rotacja tokenu zwraca nowy token (wrażliwy). Traktuj go jak sekret.
- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`).
- Rotacja tokenu pozostaje w obrębie zatwierdzonego zestawu ról parowania i zatwierdzonej
  bazowej linii zakresów dla tego urządzenia. Przypadkowy wpis tokenu z pamięci podręcznej nie przyznaje nowego
  celu rotacji.
- Dla sesji tokenu sparowanego urządzenia zarządzanie między urządzeniami jest tylko dla administratora:
  `remove`, `rotate` i `revoke` są dostępne tylko dla własnego urządzenia, chyba że wywołujący ma
  `operator.admin`.
- `devices clear` jest celowo chronione przez `--yes`.
- Jeśli zakres parowania nie jest dostępny na local loopback (i nie przekazano jawnego `--url`), list/approve mogą użyć lokalnego fallbacku parowania.
- `devices approve` wymaga jawnego identyfikatora żądania przed utworzeniem tokenów; pominięcie `requestId` albo przekazanie `--latest` tylko podgląda najnowsze oczekujące żądanie.

## Lista kontrolna odzyskiwania po rozjechaniu tokenów

Użyj tego, gdy Control UI lub inni klienci stale kończą się błędem `AUTH_TOKEN_MISMATCH` albo `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Potwierdź bieżące źródło tokenu Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Wyświetl sparowane urządzenia i zidentyfikuj identyfikator problematycznego urządzenia:

```bash
openclaw devices list
```

3. Obróć token operatora dla problematycznego urządzenia:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jeśli sama rotacja nie wystarcza, usuń nieaktualne parowanie i zatwierdź ponownie:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Ponów próbę połączenia klienta przy użyciu bieżącego współdzielonego tokenu/hasła.

Uwagi:

- Normalna kolejność uwierzytelniania przy ponownym połączeniu to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
- Zaufane odzyskiwanie po `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać jednocześnie współdzielony token i zapisany token urządzenia w ramach jednej ograniczonej próby ponowienia.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem dashboardu](/pl/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Node](/pl/nodes)
