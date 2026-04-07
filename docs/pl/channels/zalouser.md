---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania Zalo Personal lub przepływu wiadomości
summary: Obsługa osobistego konta Zalo przez natywne zca-js (logowanie QR), możliwości i konfiguracja
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-07T09:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08f50edb2f4c6fe24972efe5e321f5fd0572c7d29af5c1db808151c7c943dc66
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (nieoficjalne)

Status: eksperymentalny. Ta integracja automatyzuje **osobiste konto Zalo** przez natywne `zca-js` wewnątrz OpenClaw.

> **Ostrzeżenie:** To jest nieoficjalna integracja i może skutkować zawieszeniem/zbanowaniem konta. Używasz jej na własne ryzyko.

## Bundled plugin

Zalo Personal jest dostarczany jako bundled plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego builda lub niestandardowej instalacji, która nie zawiera Zalo Personal,
zainstaluj go ręcznie:

- Zainstaluj przez CLI: `openclaw plugins install @openclaw/zalouser`
- Albo z checkoutu kodu źródłowego: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Plugins](/pl/tools/plugin)

Żaden zewnętrzny binarny plik `zca`/`openzca` CLI nie jest wymagany.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że plugin Zalo Personal jest dostępny.
   - Jest już dołączony do aktualnych spakowanych wydań OpenClaw.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Zaloguj się (QR, na maszynie Gateway):
   - `openclaw channels login --channel zalouser`
   - Zeskanuj kod QR aplikacją mobilną Zalo.
3. Włącz kanał:

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

4. Uruchom ponownie Gateway (lub dokończ konfigurację).
5. Dostęp przez DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa całkowicie w procesie przez `zca-js`.
- Używa natywnych listenerów zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez API JS (tekst/multimedia/link).
- Zaprojektowane dla przypadków użycia „osobistego konta”, w których API bota Zalo nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jednoznacznie wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalne). `zalo` pozostaje zarezerwowane dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Znajdowanie identyfikatorów (directory)

Użyj CLI directory, aby wykryć kontakty/grupy i ich identyfikatory:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Ograniczenia

- Wychodzący tekst jest dzielony na fragmenty po około 2000 znaków (ograniczenia klienta Zalo).
- Streamowanie jest domyślnie zablokowane.

## Kontrola dostępu (DM)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` akceptuje identyfikatory użytkowników lub nazwy. Podczas konfiguracji nazwy są rozwiązywane do identyfikatorów przy użyciu wyszukiwania kontaktów pluginu działającego w procesie.

Zatwierdzanie przez:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp do grup (opcjonalnie)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- Ogranicz do listy dozwolonych za pomocą:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (klucze powinny być stabilnymi identyfikatorami grup; nazwy są rozwiązywane do identyfikatorów podczas uruchamiania, gdy to możliwe)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą wywołać bota)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może pytać o listy dozwolonych grup.
- Przy uruchamianiu OpenClaw rozwiązuje nazwy grup/użytkowników z list dozwolonych do identyfikatorów i zapisuje mapowanie w logach.
- Dopasowywanie listy dozwolonych grup domyślnie odbywa się tylko po identyfikatorze. Nierozwiązane nazwy są ignorowane przy autoryzacji, chyba że włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza dopasowywanie po zmiennej nazwie grupy.
- Jeśli `groupAllowFrom` nie jest ustawione, środowisko wykonawcze używa `allowFrom` jako ustawienia zastępczego do sprawdzania nadawców w grupach.
- Sprawdzanie nadawców dotyczy zarówno zwykłych wiadomości grupowych, jak i poleceń sterujących (na przykład `/new`, `/reset`).

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Ograniczanie odpowiedzi w grupie do wzmianek

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi w grupie wymagają wzmianki.
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> wartość domyślna (`true`).
- Dotyczy to zarówno grup z listy dozwolonych, jak i otwartego trybu grupowego.
- Cytowanie wiadomości bota liczy się jako niejawna wzmianka do aktywacji w grupie.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą omijać wymóg wzmianki.
- Gdy wiadomość grupowa jest pomijana, ponieważ wzmianka jest wymagana, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza ją do następnej przetwarzanej wiadomości grupowej.
- Limit historii grupowej domyślnie wynosi `messages.groupChat.historyLimit` (wartość zastępcza `50`). Możesz go nadpisać dla konta przez `channels.zalouser.historyLimit`.

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Wiele kont

Konta są mapowane na profile `zalouser` w stanie OpenClaw. Przykład:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Pisanie, reakcje i potwierdzenia dostarczenia

- OpenClaw wysyła zdarzenie pisania przed wysłaniem odpowiedzi (best-effort).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć konkretną emoji reakcji z wiadomości.
  - Semantyka reakcji: [Reactions](/pl/tools/reactions)
- Dla wiadomości przychodzących zawierających metadane zdarzeń OpenClaw wysyła potwierdzenia dostarczenia + odczytu (best-effort).

## Rozwiązywanie problemów

**Logowanie się nie utrzymuje:**

- `openclaw channels status --probe`
- Zaloguj się ponownie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nazwa na liście dozwolonych/grupy nie została rozwiązana:**

- Użyj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom`/`groups` albo dokładnych nazw znajomych/grup.

**Aktualizacja ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni w OpenClaw, bez zewnętrznych binarnych plików CLI.

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatu grupowego i ograniczanie do wzmianek
- [Channel Routing](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
