---
read_when:
    - Praca nad funkcjami Zalo lub funkcjami Webhook
summary: Stan obsługi bota Zalo, możliwości i konfiguracja
title: Zalo
x-i18n:
    generated_at: "2026-04-30T09:40:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Status: eksperymentalny. DM-y są obsługiwane. Poniższa sekcja [Możliwości](#capabilities) odzwierciedla obecne zachowanie botów Marketplace.

## Dołączony Plugin

Zalo jest dostarczany jako dołączony Plugin w obecnych wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub instalacji niestandardowej, która wyklucza Zalo, zainstaluj
aktualny pakiet npm, gdy zostanie opublikowany:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalo`
- Lub z checkoutu źródeł: `openclaw plugins install ./path/to/local/zalo-plugin`
- Szczegóły: [Plugins](/pl/tools/plugin)

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, użyj aktualnej spakowanej
kompilacji OpenClaw lub lokalnej ścieżki checkoutu, dopóki nie zostanie opublikowany nowszy pakiet npm.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo jest dostępny.
   - Obecne spakowane wydania OpenClaw już go dołączają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Ustaw token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Lub konfiguracja: `channels.zalo.accounts.default.botToken: "..."`.
3. Uruchom ponownie gateway (lub dokończ konfigurację).
4. Dostęp przez DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

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

Zalo to komunikator skoncentrowany na Wietnamie; jego Bot API pozwala Gateway uruchamiać bota do rozmów 1:1.
Dobrze sprawdza się do obsługi lub powiadomień, gdy chcesz deterministycznego routingu z powrotem do Zalo.

Ta strona odzwierciedla obecne zachowanie OpenClaw dla **Zalo Bot Creator / botów Marketplace**.
**Boty Zalo Official Account (OA)** są inną powierzchnią produktu Zalo i mogą zachowywać się inaczej.

- Kanał Zalo Bot API należący do Gateway.
- Deterministyczny routing: odpowiedzi wracają do Zalo; model nigdy nie wybiera kanałów.
- DM-y współdzielą główną sesję agenta.
- Poniższa sekcja [Możliwości](#capabilities) pokazuje obecną obsługę botów Marketplace.

## Konfiguracja (szybka ścieżka)

### 1) Utwórz token bota (Zalo Bot Platform)

1. Przejdź do [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) i zaloguj się.
2. Utwórz nowego bota i skonfiguruj jego ustawienia.
3. Skopiuj pełny token bota (zwykle `numeric_id:secret`). W przypadku botów Marketplace używalny token runtime może pojawić się w wiadomości powitalnej bota po utworzeniu.

### 2) Skonfiguruj token (env lub konfiguracja)

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

Jeśli później przejdziesz na powierzchnię bota Zalo, w której dostępne są grupy, możesz jawnie dodać konfigurację specyficzną dla grup, taką jak `groupPolicy` i `groupAllowFrom`. Obecne zachowanie botów Marketplace opisuje sekcja [Możliwości](#capabilities).

Opcja env: `ZALO_BOT_TOKEN=...` (działa tylko dla konta domyślnego).

Obsługa wielu kont: użyj `channels.zalo.accounts` z tokenami dla poszczególnych kont i opcjonalnym `name`.

3. Uruchom ponownie gateway. Zalo uruchamia się po rozpoznaniu tokena (env lub konfiguracja).
4. Dostęp przez DM domyślnie używa parowania. Zatwierdź kod, gdy bot zostanie pierwszy raz skontaktowany.

## Jak to działa (zachowanie)

- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału z symbolami zastępczymi mediów.
- Odpowiedzi zawsze wracają do tego samego czatu Zalo.
- Domyślnie używane jest long-polling; tryb Webhook jest dostępny z `channels.zalo.webhookUrl`.

## Limity

- Tekst wychodzący jest dzielony na fragmenty po 2000 znaków (limit Zalo API).
- Pobieranie/wysyłanie mediów jest ograniczone przez `channels.zalo.mediaMaxMb` (domyślnie 5).
- Streaming jest domyślnie blokowany, ponieważ limit 2000 znaków zmniejsza jego użyteczność.

## Kontrola dostępu (DM-y)

### Dostęp przez DM

- Domyślnie: `channels.zalo.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdź przez:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Parowanie jest domyślną wymianą tokena. Szczegóły: [Parowanie](/pl/channels/pairing)
- `channels.zalo.allowFrom` akceptuje numeryczne identyfikatory użytkowników (wyszukiwanie nazw użytkowników nie jest dostępne).

## Kontrola dostępu (grupy)

W przypadku **Zalo Bot Creator / botów Marketplace** obsługa grup nie była w praktyce dostępna, ponieważ bota w ogóle nie można było dodać do grupy.

Oznacza to, że poniższe klucze konfiguracji związane z grupami istnieją w schemacie, ale nie były używalne dla botów Marketplace:

- `channels.zalo.groupPolicy` steruje obsługą wiadomości przychodzących w grupach: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` ogranicza, które identyfikatory nadawców mogą uruchomić bota w grupach.
- Jeśli `groupAllowFrom` nie jest ustawione, Zalo wraca do `allowFrom` przy sprawdzaniu nadawcy.
- Uwaga runtime: jeśli `channels.zalo` całkowicie brakuje, runtime nadal wraca do `groupPolicy="allowlist"` dla bezpieczeństwa.

Wartości zasad grup (gdy dostęp do grup jest dostępny na powierzchni Twojego bota) to:

- `groupPolicy: "disabled"` — blokuje wszystkie wiadomości grupowe.
- `groupPolicy: "open"` — zezwala dowolnemu członkowi grupy (bramka przez wzmiankę).
- `groupPolicy: "allowlist"` — domyślne zamknięcie w razie niepowodzenia; akceptowani są tylko dozwoleni nadawcy.

Jeśli używasz innej powierzchni produktu bota Zalo i zweryfikowano działające zachowanie grup, udokumentuj to osobno zamiast zakładać, że odpowiada przepływowi botów Marketplace.

## Long-polling kontra Webhook

- Domyślnie: long-polling (publiczny URL nie jest wymagany).
- Tryb Webhook: ustaw `channels.zalo.webhookUrl` i `channels.zalo.webhookSecret`.
  - Sekret Webhook musi mieć 8-256 znaków.
  - URL Webhook musi używać HTTPS.
  - Zalo wysyła zdarzenia z nagłówkiem `X-Bot-Api-Secret-Token` do weryfikacji.
  - HTTP Gateway obsługuje żądania Webhook pod `channels.zalo.webhookPath` (domyślnie ścieżka URL Webhook).
  - Żądania muszą używać `Content-Type: application/json` (lub typów mediów `+json`).
  - Duplikaty zdarzeń (`event_name + message_id`) są ignorowane przez krótkie okno powtórzeń.
  - Ruch skokowy jest ograniczany stawką na ścieżkę/źródło i może zwrócić HTTP 429.

**Uwaga:** getUpdates (polling) i Webhook wzajemnie się wykluczają zgodnie z dokumentacją Zalo API.

## Obsługiwane typy wiadomości

Szybki przegląd obsługi znajduje się w sekcji [Możliwości](#capabilities). Poniższe uwagi dodają szczegóły tam, gdzie zachowanie wymaga dodatkowego kontekstu.

- **Wiadomości tekstowe**: Pełna obsługa z dzieleniem na fragmenty po 2000 znaków.
- **Zwykłe URL-e w tekście**: Zachowują się jak normalne wejście tekstowe.
- **Podglądy linków / bogate karty linków**: Zobacz status botów Marketplace w sekcji [Możliwości](#capabilities); nie wyzwalały niezawodnie odpowiedzi.
- **Wiadomości obrazkowe**: Zobacz status botów Marketplace w sekcji [Możliwości](#capabilities); obsługa obrazów przychodzących była zawodna (wskaźnik pisania bez końcowej odpowiedzi).
- **Naklejki**: Zobacz status botów Marketplace w sekcji [Możliwości](#capabilities).
- **Notatki głosowe / pliki audio / wideo / ogólne załączniki plików**: Zobacz status botów Marketplace w sekcji [Możliwości](#capabilities).
- **Nieobsługiwane typy**: Rejestrowane w logach (na przykład wiadomości od chronionych użytkowników).

## Możliwości

Ta tabela podsumowuje obecne zachowanie **Zalo Bot Creator / botów Marketplace** w OpenClaw.

| Funkcja                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Wiadomości bezpośrednie     | ✅ Obsługiwane                          |
| Grupy                       | ❌ Niedostępne dla botów Marketplace    |
| Media (obrazy przychodzące) | ⚠️ Ograniczone / zweryfikuj w swoim środowisku |
| Media (obrazy wychodzące)   | ⚠️ Nie przetestowano ponownie dla botów Marketplace |
| Zwykłe URL-e w tekście      | ✅ Obsługiwane                          |
| Podglądy linków             | ⚠️ Zawodne dla botów Marketplace        |
| Reakcje                     | ❌ Nieobsługiwane                       |
| Naklejki                    | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Notatki głosowe / audio / wideo | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Załączniki plików           | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Wątki                       | ❌ Nieobsługiwane                       |
| Ankiety                     | ❌ Nieobsługiwane                       |
| Natywne polecenia           | ❌ Nieobsługiwane                       |
| Streaming                   | ⚠️ Zablokowany (limit 2000 znaków)      |

## Cele dostarczania (CLI/cron)

- Użyj identyfikatora czatu jako celu.
- Przykład: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Rozwiązywanie problemów

**Bot nie odpowiada:**

- Sprawdź, czy token jest prawidłowy: `openclaw channels status --probe`
- Zweryfikuj, czy nadawca jest zatwierdzony (parowanie lub allowFrom)
- Sprawdź logi gateway: `openclaw logs --follow`

**Webhook nie otrzymuje zdarzeń:**

- Upewnij się, że URL Webhook używa HTTPS
- Zweryfikuj, czy token sekretu ma 8-256 znaków
- Potwierdź, że punkt końcowy HTTP gateway jest osiągalny pod skonfigurowaną ścieżką
- Sprawdź, czy polling getUpdates nie jest uruchomiony (wzajemnie się wykluczają)

## Odniesienie konfiguracji (Zalo)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Płaskie klucze najwyższego poziomu (`channels.zalo.botToken`, `channels.zalo.dmPolicy` i podobne) są starszym skrótem dla pojedynczego konta. W nowych konfiguracjach preferuj `channels.zalo.accounts.<id>.*`. Obie formy nadal są tutaj udokumentowane, ponieważ istnieją w schemacie.

Opcje providera:

- `channels.zalo.enabled`: włącz/wyłącz uruchamianie kanału.
- `channels.zalo.botToken`: token bota z Zalo Bot Platform.
- `channels.zalo.tokenFile`: odczytaj token ze zwykłej ścieżki pliku. Dowiązania symboliczne są odrzucane.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.zalo.allowFrom`: allowlist DM (identyfikatory użytkowników). `open` wymaga `"*"`. Kreator poprosi o numeryczne identyfikatory.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist). Obecne w konfiguracji; zobacz [Możliwości](#capabilities) i [Kontrola dostępu (grupy)](#access-control-groups), aby poznać obecne zachowanie botów Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist nadawców grupowych (identyfikatory użytkowników). Wraca do `allowFrom`, gdy nie jest ustawione.
- `channels.zalo.mediaMaxMb`: limit mediów przychodzących/wychodzących (MB, domyślnie 5).
- `channels.zalo.webhookUrl`: włącz tryb Webhook (wymagany HTTPS).
- `channels.zalo.webhookSecret`: sekret Webhook (8-256 znaków).
- `channels.zalo.webhookPath`: ścieżka Webhook na serwerze HTTP gateway.
- `channels.zalo.proxy`: URL proxy dla żądań API.

Opcje wielu kont:

- `channels.zalo.accounts.<id>.botToken`: token dla danego konta.
- `channels.zalo.accounts.<id>.tokenFile`: zwykły plik tokena dla danego konta. Dowiązania symboliczne są odrzucane.
- `channels.zalo.accounts.<id>.name`: nazwa wyświetlana.
- `channels.zalo.accounts.<id>.enabled`: włącz/wyłącz konto.
- `channels.zalo.accounts.<id>.dmPolicy`: zasada DM dla danego konta.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist dla danego konta.
- `channels.zalo.accounts.<id>.groupPolicy`: zasada grup dla danego konta. Obecne w konfiguracji; zobacz [Możliwości](#capabilities) i [Kontrola dostępu (grupy)](#access-control-groups), aby poznać obecne zachowanie botów Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist nadawców grupowych dla danego konta.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook dla danego konta.
- `channels.zalo.accounts.<id>.webhookSecret`: sekret Webhook dla danego konta.
- `channels.zalo.accounts.<id>.webhookPath`: ścieżka Webhook dla danego konta.
- `channels.zalo.accounts.<id>.proxy`: URL proxy dla danego konta.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
