---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania lub przepływu wiadomości w Zalo Personal
summary: Obsługa osobistego konta Zalo przez natywne `zca-js` (logowanie QR), możliwości i konfigurację
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T13:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (nieoficjalne)

Status: eksperymentalny. Ta integracja automatyzuje **osobiste konto Zalo** przez natywne `zca-js` w OpenClaw.

> **Ostrzeżenie:** To jest nieoficjalna integracja i może skutkować zawieszeniem/zbanowaniem konta. Używasz jej na własne ryzyko.

## Plugin dołączony do pakietu

Zalo Personal jest dostarczany jako plugin dołączony do pakietu w aktualnych wydaniach OpenClaw, więc zwykłe
spakowane buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego buildu lub niestandardowej instalacji, która nie zawiera Zalo Personal,
zainstaluj go ręcznie:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalouser`
- Albo z checkoutu źródeł: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Plugins](/tools/plugin)

Nie jest wymagany żaden zewnętrzny binarny CLI `zca`/`openzca`.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że plugin Zalo Personal jest dostępny.
   - Aktualne spakowane wydania OpenClaw już go zawierają.
   - W starszych/niestandardowych instalacjach można dodać go ręcznie za pomocą powyższych poleceń.
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
5. Dostęp do wiadomości prywatnych domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa całkowicie w procesie przez `zca-js`.
- Używa natywnych listenerów zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez API JS (tekst/multimedia/link).
- Zaprojektowane do przypadków użycia „osobistego konta”, gdzie Zalo Bot API nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jasno wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). Zachowujemy `zalo` dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Znajdowanie identyfikatorów (katalog)

Użyj CLI katalogu, aby odkrywać kontakty/grupy i ich identyfikatory:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limity

- Tekst wychodzący jest dzielony na fragmenty po około 2000 znaków (limity klienta Zalo).
- Streaming jest domyślnie blokowany.

## Kontrola dostępu (wiadomości prywatne)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` akceptuje identyfikatory użytkowników lub nazwy. Podczas konfiguracji nazwy są rozwiązywane do identyfikatorów przy użyciu wbudowanego w proces wyszukiwania kontaktów pluginu.

Zatwierdzanie przez:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp do grup (opcjonalnie)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- Ogranicz do listy dozwolonych za pomocą:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (klucze powinny być stabilnymi identyfikatorami grup; nazwy są rozwiązywane do identyfikatorów przy starcie, gdy to możliwe)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą wyzwalać bota)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może pytać o listy dozwolonych grup.
- Przy starcie OpenClaw rozwiązuje nazwy grup/użytkowników w listach dozwolonych do identyfikatorów i zapisuje mapowanie w logach.
- Dopasowanie listy dozwolonych grup domyślnie opiera się tylko na identyfikatorach. Nierozwiązane nazwy są ignorowane przy autoryzacji, chyba że włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza dopasowywanie zmiennych nazw grup.
- Jeśli `groupAllowFrom` nie jest ustawione, runtime używa `allowFrom` jako fallbacku dla sprawdzania nadawców grupowych.
- Sprawdzanie nadawców dotyczy zarówno zwykłych wiadomości grupowych, jak i poleceń kontrolnych (na przykład `/new`, `/reset`).

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

### Bramka wzmianki w grupach

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi w grupach wymagają wzmianki.
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> wartość domyślna (`true`).
- Dotyczy to zarówno grup z listy dozwolonych, jak i trybu otwartych grup.
- Autoryzowane polecenia kontrolne (na przykład `/new`) mogą omijać bramkę wzmianki.
- Gdy wiadomość grupowa jest pomijana, ponieważ wymagana jest wzmianka, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza ją do następnej przetworzonej wiadomości grupowej.
- Limit historii grupy domyślnie wynosi `messages.groupChat.historyLimit` (fallback `50`). Można go nadpisać per konto przez `channels.zalouser.historyLimit`.

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

Konta mapują się na profile `zalouser` w stanie OpenClaw. Przykład:

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
  - Użyj `remove: true`, aby usunąć określoną reakcję emoji z wiadomości.
  - Semantyka reakcji: [Reactions](/tools/reactions)
- Dla wiadomości przychodzących zawierających metadane zdarzeń OpenClaw wysyła potwierdzenia dostarczenia i odczytu (best-effort).

## Rozwiązywanie problemów

**Logowanie się nie utrzymuje:**

- `openclaw channels status --probe`
- Zaloguj się ponownie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nazwa w liście dozwolonych/grupie nie została rozwiązana:**

- Używaj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom`/`groups` albo dokładnych nazw znajomych/grup.

**Zaktualizowano ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni wewnątrz OpenClaw bez zewnętrznych binarnych CLI.

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianką
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/gateway/security) — model dostępu i utwardzanie
