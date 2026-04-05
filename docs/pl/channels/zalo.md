---
read_when:
    - Praca nad funkcjami Zalo lub webhookami
summary: Status obsługi bota Zalo, możliwości i konfiguracja
title: Zalo
x-i18n:
    generated_at: "2026-04-05T13:47:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab94642ba28e79605b67586af8f71c18bc10e0af60343a7df508e6823b6f4119
    source_path: channels/zalo.md
    workflow: 15
---

# Zalo (Bot API)

Status: eksperymentalny. DM są obsługiwane. Sekcja [Możliwości](#capabilities) poniżej odzwierciedla bieżące zachowanie botów Marketplace.

## Bundled plugin

Zalo jest dostarczany jako bundled plugin w bieżących wydaniach OpenClaw, więc standardowe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Zalo, zainstaluj go
ręcznie:

- Zainstaluj przez CLI: `openclaw plugins install @openclaw/zalo`
- Lub z checkoutu źródeł: `openclaw plugins install ./path/to/local/zalo-plugin`
- Szczegóły: [Plugins](/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że plugin Zalo jest dostępny.
   - Bieżące spakowane wydania OpenClaw zawierają go już w zestawie.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Ustaw token:
   - Zmienna środowiskowa: `ZALO_BOT_TOKEN=...`
   - Lub konfiguracja: `channels.zalo.accounts.default.botToken: "..."`.
3. Uruchom ponownie gateway (lub dokończ konfigurację).
4. Dostęp do DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

Minimalna konfiguracja:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Czym to jest

Zalo to komunikator popularny w Wietnamie; jego Bot API pozwala Gateway uruchamiać bota do rozmów 1:1.
To dobre rozwiązanie dla wsparcia lub powiadomień, gdy chcesz mieć deterministyczne routowanie z powrotem do Zalo.

Ta strona odzwierciedla bieżące zachowanie OpenClaw dla **botów Zalo Bot Creator / Marketplace**.
**Boty Zalo Official Account (OA)** to inna powierzchnia produktu Zalo i mogą zachowywać się inaczej.

- Kanał Zalo Bot API zarządzany przez Gateway.
- Deterministyczne routowanie: odpowiedzi wracają do Zalo; model nigdy nie wybiera kanałów.
- DM współdzielą główną sesję agenta.
- Sekcja [Możliwości](#capabilities) poniżej pokazuje bieżące wsparcie dla botów Marketplace.

## Konfiguracja (szybka ścieżka)

### 1) Utwórz token bota (Zalo Bot Platform)

1. Przejdź do [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) i się zaloguj.
2. Utwórz nowego bota i skonfiguruj jego ustawienia.
3. Skopiuj pełny token bota (zwykle `numeric_id:secret`). W przypadku botów Marketplace użyteczny token runtime może pojawić się w wiadomości powitalnej bota po utworzeniu.

### 2) Skonfiguruj token (zmienna środowiskowa lub konfiguracja)

Przykład:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Jeśli później przejdziesz na powierzchnię bota Zalo, gdzie grupy są dostępne, możesz jawnie dodać konfigurację specyficzną dla grup, taką jak `groupPolicy` i `groupAllowFrom`. Dla bieżącego zachowania botów Marketplace zobacz [Możliwości](#capabilities).

Opcja zmiennej środowiskowej: `ZALO_BOT_TOKEN=...` (działa tylko dla konta domyślnego).

Obsługa wielu kont: użyj `channels.zalo.accounts` z tokenami per konto i opcjonalnym `name`.

3. Uruchom ponownie gateway. Zalo uruchamia się po rozwiązaniu tokena (ze zmiennej środowiskowej lub konfiguracji).
4. Dostęp do DM domyślnie używa parowania. Zatwierdź kod, gdy bot zostanie po raz pierwszy skontaktowany.

## Jak to działa (zachowanie)

- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału z placeholderami mediów.
- Odpowiedzi zawsze wracają do tego samego czatu Zalo.
- Domyślnie używany jest long-polling; tryb webhook jest dostępny przez `channels.zalo.webhookUrl`.

## Ograniczenia

- Tekst wychodzący jest dzielony na fragmenty po 2000 znaków (limit API Zalo).
- Pobieranie/wysyłanie mediów jest ograniczone przez `channels.zalo.mediaMaxMb` (domyślnie 5).
- Streaming jest domyślnie blokowany, ponieważ limit 2000 znaków sprawia, że jest mniej użyteczny.

## Kontrola dostępu (DM)

### Dostęp do DM

- Domyślnie: `channels.zalo.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdź przez:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Parowanie jest domyślnym mechanizmem wymiany tokenów. Szczegóły: [Parowanie](/pl/channels/pairing)
- `channels.zalo.allowFrom` akceptuje numeryczne identyfikatory użytkowników (brak obsługi wyszukiwania po nazwie użytkownika).

## Kontrola dostępu (grupy)

W przypadku **botów Zalo Bot Creator / Marketplace** obsługa grup w praktyce nie była dostępna, ponieważ bota w ogóle nie można było dodać do grupy.

Oznacza to, że poniższe klucze konfiguracji związane z grupami istnieją w schemacie, ale nie były użyteczne dla botów Marketplace:

- `channels.zalo.groupPolicy` kontroluje obsługę wiadomości przychodzących w grupach: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` ogranicza, które identyfikatory nadawców mogą wyzwalać bota w grupach.
- Jeśli `groupAllowFrom` nie jest ustawione, Zalo używa `allowFrom` jako fallbacku przy sprawdzaniu nadawców.
- Uwaga dotycząca runtime: jeśli `channels.zalo` jest całkowicie nieobecne, runtime nadal dla bezpieczeństwa wraca do `groupPolicy="allowlist"`.

Wartości polityki grup (gdy dostęp grupowy jest dostępny na powierzchni Twojego bota) to:

- `groupPolicy: "disabled"` — blokuje wszystkie wiadomości grupowe.
- `groupPolicy: "open"` — zezwala każdemu członkowi grupy (z bramkowaniem na wzmianki).
- `groupPolicy: "allowlist"` — domyślny tryb fail-closed; akceptowani są tylko dozwoleni nadawcy.

Jeśli używasz innej powierzchni produktu bota Zalo i masz potwierdzone działanie grup, udokumentuj to osobno, zamiast zakładać zgodność z przepływem botów Marketplace.

## Long-polling vs webhook

- Domyślnie: long-polling (nie wymaga publicznego URL).
- Tryb webhook: ustaw `channels.zalo.webhookUrl` i `channels.zalo.webhookSecret`.
  - Sekret webhooka musi mieć od 8 do 256 znaków.
  - URL webhooka musi używać HTTPS.
  - Zalo wysyła zdarzenia z nagłówkiem `X-Bot-Api-Secret-Token` do weryfikacji.
  - HTTP Gateway obsługuje żądania webhooka pod `channels.zalo.webhookPath` (domyślnie jest to ścieżka URL webhooka).
  - Żądania muszą używać `Content-Type: application/json` (lub typów mediów `+json`).
  - Zduplikowane zdarzenia (`event_name + message_id`) są ignorowane przez krótki czas ochrony przed powtórzeniami.
  - Ruch skokowy jest ograniczany per ścieżka/źródło i może zwracać HTTP 429.

**Uwaga:** `getUpdates` (polling) i webhook są wzajemnie wykluczające zgodnie z dokumentacją API Zalo.

## Obsługiwane typy wiadomości

Aby szybko sprawdzić stan wsparcia, zobacz [Możliwości](#capabilities). Poniższe uwagi dodają szczegóły tam, gdzie zachowanie wymaga dodatkowego kontekstu.

- **Wiadomości tekstowe**: pełne wsparcie z dzieleniem na fragmenty po 2000 znaków.
- **Zwykłe URL w tekście**: działają jak normalne wejście tekstowe.
- **Podglądy linków / bogate karty linków**: zobacz status botów Marketplace w [Możliwościach](#capabilities); nie wyzwalały odpowiedzi w sposób niezawodny.
- **Wiadomości obrazkowe**: zobacz status botów Marketplace w [Możliwościach](#capabilities); obsługa obrazów przychodzących była zawodna (wskaźnik pisania bez końcowej odpowiedzi).
- **Naklejki**: zobacz status botów Marketplace w [Możliwościach](#capabilities).
- **Notatki głosowe / pliki audio / wideo / ogólne załączniki plikowe**: zobacz status botów Marketplace w [Możliwościach](#capabilities).
- **Nieobsługiwane typy**: są logowane (na przykład wiadomości od użytkowników chronionych).

## Możliwości

Ta tabela podsumowuje bieżące zachowanie **botów Zalo Bot Creator / Marketplace** w OpenClaw.

| Funkcja                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Wiadomości bezpośrednie     | ✅ Obsługiwane                          |
| Grupy                       | ❌ Niedostępne dla botów Marketplace    |
| Media (obrazy przychodzące) | ⚠️ Ograniczone / zweryfikuj w swoim środowisku |
| Media (obrazy wychodzące)   | ⚠️ Nie testowano ponownie dla botów Marketplace |
| Zwykłe URL w tekście        | ✅ Obsługiwane                          |
| Podglądy linków             | ⚠️ Zawodne dla botów Marketplace        |
| Reakcje                     | ❌ Nieobsługiwane                       |
| Naklejki                    | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Notatki głosowe / audio / wideo | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Załączniki plikowe          | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Wątki                       | ❌ Nieobsługiwane                       |
| Polls                       | ❌ Nieobsługiwane                       |
| Polecenia natywne           | ❌ Nieobsługiwane                       |
| Streaming                   | ⚠️ Zablokowany (limit 2000 znaków)      |

## Cele dostarczania (CLI/cron)

- Użyj identyfikatora czatu jako celu.
- Przykład: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Rozwiązywanie problemów

**Bot nie odpowiada:**

- Sprawdź, czy token jest prawidłowy: `openclaw channels status --probe`
- Zweryfikuj, czy nadawca jest zatwierdzony (parowanie lub `allowFrom`)
- Sprawdź logi gateway: `openclaw logs --follow`

**Webhook nie odbiera zdarzeń:**

- Upewnij się, że URL webhooka używa HTTPS
- Zweryfikuj, że sekret tokena ma od 8 do 256 znaków
- Potwierdź, że punkt końcowy HTTP gateway jest osiągalny pod skonfigurowaną ścieżką
- Sprawdź, czy polling `getUpdates` nie jest uruchomiony (są wzajemnie wykluczające)

## Dokumentacja konfiguracji (Zalo)

Pełna konfiguracja: [Konfiguracja](/gateway/configuration)

Płaskie klucze najwyższego poziomu (`channels.zalo.botToken`, `channels.zalo.dmPolicy` i podobne) to starszy skrót dla pojedynczego konta. W nowych konfiguracjach preferuj `channels.zalo.accounts.<id>.*`. Obie formy są nadal udokumentowane tutaj, ponieważ istnieją w schemacie.

Opcje dostawcy:

- `channels.zalo.enabled`: włączanie/wyłączanie uruchamiania kanału.
- `channels.zalo.botToken`: token bota z Zalo Bot Platform.
- `channels.zalo.tokenFile`: odczyt tokena ze zwykłej ścieżki pliku. Dowiązania symboliczne są odrzucane.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.zalo.allowFrom`: lista dozwolonych DM (identyfikatory użytkowników). `open` wymaga `"*"`. Kreator poprosi o identyfikatory numeryczne.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist). Obecne w konfiguracji; zobacz [Możliwości](#capabilities) i [Kontrola dostępu (grupy)](#access-control-groups), aby poznać bieżące zachowanie botów Marketplace.
- `channels.zalo.groupAllowFrom`: lista dozwolonych nadawców grupowych (identyfikatory użytkowników). Gdy nie jest ustawione, używany jest fallback do `allowFrom`.
- `channels.zalo.mediaMaxMb`: limit mediów przychodzących/wychodzących (MB, domyślnie 5).
- `channels.zalo.webhookUrl`: włącza tryb webhook (wymagany HTTPS).
- `channels.zalo.webhookSecret`: sekret webhooka (8-256 znaków).
- `channels.zalo.webhookPath`: ścieżka webhooka na serwerze HTTP gateway.
- `channels.zalo.proxy`: URL proxy dla żądań API.

Opcje wielu kont:

- `channels.zalo.accounts.<id>.botToken`: token per konto.
- `channels.zalo.accounts.<id>.tokenFile`: zwykły plik tokena per konto. Dowiązania symboliczne są odrzucane.
- `channels.zalo.accounts.<id>.name`: nazwa wyświetlana.
- `channels.zalo.accounts.<id>.enabled`: włączanie/wyłączanie konta.
- `channels.zalo.accounts.<id>.dmPolicy`: polityka DM per konto.
- `channels.zalo.accounts.<id>.allowFrom`: lista dozwolonych per konto.
- `channels.zalo.accounts.<id>.groupPolicy`: polityka grup per konto. Obecna w konfiguracji; zobacz [Możliwości](#capabilities) i [Kontrola dostępu (grupy)](#access-control-groups), aby poznać bieżące zachowanie botów Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: lista dozwolonych nadawców grupowych per konto.
- `channels.zalo.accounts.<id>.webhookUrl`: URL webhooka per konto.
- `channels.zalo.accounts.<id>.webhookSecret`: sekret webhooka per konto.
- `channels.zalo.accounts.<id>.webhookPath`: ścieżka webhooka per konto.
- `channels.zalo.accounts.<id>.proxy`: URL proxy per konto.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routowanie kanałów](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i utwardzanie
