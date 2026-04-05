---
read_when:
    - Zatwierdzasz żądania parowania urządzeń
    - Musisz obrócić lub unieważnić tokeny urządzeń
summary: Dokumentacja CLI dla `openclaw devices` (parowanie urządzeń + rotacja/unieważnianie tokenów)
title: devices
x-i18n:
    generated_at: "2026-04-05T13:48:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Zarządzaj żądaniami parowania urządzeń i tokenami przypisanymi do urządzeń.

## Polecenia

### `openclaw devices list`

Wyświetl oczekujące żądania parowania i sparowane urządzenia.

```
openclaw devices list
openclaw devices list --json
```

Dane wyjściowe oczekujących żądań obejmują żądaną rolę i zakresy, aby można było
je sprawdzić przed zatwierdzeniem.

### `openclaw devices remove <deviceId>`

Usuń jeden wpis sparowanego urządzenia.

Jeśli uwierzytelniasz się tokenem sparowanego urządzenia, wywołujący bez uprawnień administratora mogą
usuwać tylko wpis **własnego** urządzenia. Usunięcie innego urządzenia wymaga
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Wyczyść sparowane urządzenia zbiorczo.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Zatwierdź oczekujące żądanie parowania urządzenia. Jeśli `requestId` zostanie pominięte, OpenClaw
automatycznie zatwierdzi najnowsze oczekujące żądanie.

Uwaga: jeśli urządzenie ponowi próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny),
OpenClaw zastępuje poprzedni oczekujący wpis i wydaje nowy
`requestId`. Uruchom `openclaw devices list` tuż przed zatwierdzeniem, aby użyć
aktualnego ID.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Odrzuć oczekujące żądanie parowania urządzenia.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Obróć token urządzenia dla określonej roli (opcjonalnie aktualizując zakresy).
Docelowa rola musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia;
rotacja nie może utworzyć nowej, niezatwierdzonej roli.
Jeśli pominiesz `--scope`, późniejsze ponowne połączenia ze zapisanym obróconym tokenem użyją ponownie
buforowanych zatwierdzonych zakresów tego tokena. Jeśli podasz jawne wartości `--scope`, to one
staną się zapisanym zestawem zakresów dla przyszłych ponownych połączeń z użyciem tokena z pamięci podręcznej.
Wywołujący bez uprawnień administratora, używający sparowanego urządzenia, mogą obracać tylko token
**własnego** urządzenia.
Ponadto wszelkie jawne wartości `--scope` muszą mieścić się w zakresach operatora bieżącej sesji wywołującego;
rotacja nie może utworzyć szerszego tokena operatora niż ten, który wywołujący
już ma.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Zwraca nowy ładunek tokena jako JSON.

### `openclaw devices revoke --device <id> --role <role>`

Unieważnij token urządzenia dla określonej roli.

Wywołujący bez uprawnień administratora, używający sparowanego urządzenia, mogą unieważniać tylko token
**własnego** urządzenia.
Unieważnienie tokena innego urządzenia wymaga `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Zwraca wynik unieważnienia jako JSON.

## Typowe opcje

- `--url <url>`: URL WebSocket gateway (domyślnie `gateway.remote.url`, jeśli skonfigurowano).
- `--token <token>`: token gateway (jeśli wymagany).
- `--password <password>`: hasło gateway (uwierzytelnianie hasłem).
- `--timeout <ms>`: limit czasu RPC.
- `--json`: wyjście JSON (zalecane do skryptów).

Uwaga: gdy ustawisz `--url`, CLI nie używa zapasowo poświadczeń z konfiguracji ani środowiska.
Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

## Uwagi

- Rotacja tokena zwraca nowy token (wrażliwy). Traktuj go jak sekret.
- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`).
- Rotacja tokena pozostaje w obrębie zatwierdzonego zestawu ról parowania i zatwierdzonej
  bazowej linii zakresów dla tego urządzenia. Przypadkowy wpis tokena w pamięci podręcznej nie przyznaje
  nowego celu rotacji.
- Dla sesji tokenów sparowanych urządzeń zarządzanie między urządzeniami jest tylko dla administratora:
  `remove`, `rotate` i `revoke` dotyczą tylko własnego urządzenia, chyba że wywołujący ma
  `operator.admin`.
- `devices clear` jest celowo chronione przez `--yes`.
- Jeśli zakres parowania jest niedostępny na local loopback (i nie przekazano jawnego `--url`), list/approve może użyć lokalnego mechanizmu zapasowego dla parowania.
- `devices approve` automatycznie wybiera najnowsze oczekujące żądanie, gdy pominiesz `requestId` lub przekażesz `--latest`.

## Lista kontrolna odzyskiwania po rozjechaniu tokenów

Użyj tego, gdy Control UI lub inni klienci ciągle kończą się błędem `AUTH_TOKEN_MISMATCH` lub `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Potwierdź bieżące źródło tokena gateway:

```bash
openclaw config get gateway.auth.token
```

2. Wyświetl sparowane urządzenia i zidentyfikuj ID problematycznego urządzenia:

```bash
openclaw devices list
```

3. Obróć token operatora dla problematycznego urządzenia:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jeśli rotacja nie wystarczy, usuń nieaktualne parowanie i zatwierdź je ponownie:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Ponów próbę połączenia klienta z bieżącym współdzielonym tokenem/hasłem.

Uwagi:

- Normalne pierwszeństwo uwierzytelniania przy ponownym połączeniu to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
- Zaufane odzyskiwanie po `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać razem zarówno współdzielony token, jak i zapisany token urządzenia w ramach jednej ograniczonej ponownej próby.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem dashboard](/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z gateway](/gateway/troubleshooting#dashboard-control-ui-connectivity)
