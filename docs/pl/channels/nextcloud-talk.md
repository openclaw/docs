---
read_when:
    - Praca nad funkcjami kanału Nextcloud Talk
summary: Stan obsługi, możliwości i konfiguracja Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-16T18:00:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk to dostępny do pobrania plugin kanału (`@openclaw/nextcloud-talk`), który łączy OpenClaw z samodzielnie hostowaną instancją Nextcloud za pośrednictwem bota Webhook Talk. Obsługiwane są wiadomości bezpośrednie, pokoje, reakcje i wiadomości w formacie Markdown; multimedia są wysyłane jako adresy URL.

## Instalacja

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Użycie samej specyfikacji pakietu pozwala śledzić bieżący oficjalny znacznik wydania. Dokładną wersję należy przypinać tylko wtedy, gdy potrzebna jest powtarzalna instalacja.

Z lokalnego drzewa roboczego (przepływy programistyczne):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Po instalacji należy ponownie uruchomić Gateway. Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Zainstaluj plugin (powyżej).
2. Na serwerze Nextcloud utwórz bota:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Zachowaj `--feature response`: bez tego odpowiedzi wychodzące kończą się błędem 401. Istniejącego bota można naprawić za pomocą `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Włącz bota w ustawieniach docelowego pokoju.
4. Skonfiguruj OpenClaw:
   - Konfiguracja: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Lub zmienne środowiskowe: `NEXTCLOUD_TALK_BOT_SECRET` (tylko konto domyślne)

   Konfiguracja przez CLI (`--url`/`--token` są aliasami jawnych pól; `nc-talk` i `nc` działają jako aliasy kanału):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Równoważne jawne pola:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Sekret przechowywany w pliku:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Uruchom ponownie Gateway (lub dokończ konfigurację).

Minimalna konfiguracja:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Uwagi

- Boty nie mogą inicjować wiadomości bezpośrednich. Użytkownik musi najpierw wysłać wiadomość do bota.
- Adres URL Webhooka musi być dostępny z serwera Nextcloud; ustaw `webhookPublicUrl`, gdy Gateway znajduje się za serwerem proxy. Żądania Webhooka są podpisywane algorytmem HMAC-SHA256 przy użyciu sekretu bota; nieprawidłowe podpisy są odrzucane i podlegają ograniczeniu częstotliwości.
- Interfejs API bota nie obsługuje przesyłania multimediów; multimedia wychodzące są dołączane jako wiersz `Attachment: <url>`.
- Ładunek Webhooka nie rozróżnia wiadomości bezpośrednich od pokoi; ustaw `apiUser` + `apiPassword`, aby włączyć wyszukiwanie typów pokoi (buforowane przez około 5 minut). Bez nich każda konwersacja jest traktowana jako pokój.
- Żądania wychodzące przechodzą przez zabezpieczenie SSRF. W przypadku hosta Nextcloud w zaufanej sieci prywatnej/wewnętrznej należy jawnie zezwolić na to za pomocą `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Gdy ustawiono `apiUser`/`apiPassword` i `webhookPublicUrl`, polecenie `openclaw channels status` sprawdza bota i ostrzega, jeśli brakuje funkcji `response`.

## Kontrola dostępu (wiadomości bezpośrednie)

- Domyślnie: `channels.nextcloud-talk.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania.
- Zatwierdzanie za pomocą:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Publiczne wiadomości bezpośrednie: `channels.nextcloud-talk.dmPolicy="open"` oraz `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` dopasowuje wyłącznie identyfikatory użytkowników Nextcloud (małymi literami); nazwy wyświetlane są ignorowane.

## Pokoje (grupy)

- Domyślnie: `channels.nextcloud-talk.groupPolicy = "allowlist"` (wymaga wzmianki).
- Listę dozwolonych pokoi ustawia się za pomocą `channels.nextcloud-talk.rooms`, indeksowanego tokenem pokoju; `"*"` ustawia domyślną wartość wieloznaczną:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Klucze dla poszczególnych pokoi: `requireMention` (domyślnie true), `enabled` (false wyłącza pokój), `allowFrom` (lista dozwolonych nadawców dla pokoju), `tools` (nadpisania zezwalania/odmawiania narzędzi), `skills` (ograniczenie ładowanych Skills), `systemPrompt`.
- Aby nie zezwalać na żadne pokoje, pozostaw listę dozwolonych pustą lub ustaw `channels.nextcloud-talk.groupPolicy="disabled"`.

## Możliwości

| Funkcja              | Stan              |
| -------------------- | ----------------- |
| Wiadomości bezpośrednie | Obsługiwane    |
| Pokoje               | Obsługiwane       |
| Wątki                | Nieobsługiwane    |
| Multimedia           | Tylko adresy URL  |
| Reakcje              | Obsługiwane       |
| Polecenia natywne    | Nieobsługiwane    |

## Dokumentacja konfiguracji (Nextcloud Talk)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.nextcloud-talk.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.nextcloud-talk.baseUrl`: adres URL instancji Nextcloud.
- `channels.nextcloud-talk.botSecret`: współdzielony sekret bota (ciąg znaków lub odwołanie do sekretu).
- `channels.nextcloud-talk.botSecretFile`: ścieżka do zwykłego pliku z sekretem. Dowiązania symboliczne są odrzucane.
- `channels.nextcloud-talk.apiUser`: użytkownik API na potrzeby wyszukiwania pokoi (wykrywania wiadomości bezpośrednich) i sprawdzania stanu.
- `channels.nextcloud-talk.apiPassword`: hasło API/aplikacji na potrzeby wyszukiwania pokoi.
- `channels.nextcloud-talk.apiPasswordFile`: ścieżka do pliku z hasłem API.
- `channels.nextcloud-talk.webhookPort`: port nasłuchiwania Webhooka (domyślnie: 8788).
- `channels.nextcloud-talk.webhookHost`: host Webhooka (domyślnie: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ścieżka Webhooka (domyślnie: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: dostępny z zewnątrz adres URL Webhooka.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing). `open` wymaga `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: lista dozwolonych wiadomości bezpośrednich (identyfikatory użytkowników).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (domyślnie: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: lista dozwolonych nadawców w pokojach (identyfikatory użytkowników); gdy nie ustawiono, używa `allowFrom`.
- `channels.nextcloud-talk.rooms`: ustawienia i lista dozwolonych dla poszczególnych pokoi (patrz wyżej).
- Do statycznych grup dostępu nadawców można odwoływać się z `allowFrom` i `groupAllowFrom` za pomocą `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: limit historii grupy (0 wyłącza).
- `channels.nextcloud-talk.dmHistoryLimit`: limit historii wiadomości bezpośrednich (0 wyłącza).
- `channels.nextcloud-talk.dms`: nadpisania dla poszczególnych wiadomości bezpośrednich indeksowane identyfikatorem użytkownika (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: rozmiar fragmentu tekstu wychodzącego w znakach (domyślnie: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (domyślnie) lub `newline`, aby przed dzieleniem według długości dzielić tekst przy pustych wierszach (granicach akapitów).
- `channels.nextcloud-talk.streaming.block.enabled`: włącza lub wyłącza strumieniowanie blokowe dla tego kanału.
- `channels.nextcloud-talk.streaming.block.coalesce`: dostrajanie scalania strumieniowania blokowego.
- `channels.nextcloud-talk.responsePrefix`: prefiks odpowiedzi wychodzącej.
- `channels.nextcloud-talk.markdown.tables`: tryb renderowania tabel Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: limit przychodzących multimediów (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: zezwala prywatnym/wewnętrznym hostom Nextcloud na przejście przez zabezpieczenie SSRF.
- `channels.nextcloud-talk.accounts.<id>`: nadpisania dla poszczególnych kont (te same klucze); `defaultAccount` wybiera konto domyślne. Zmienne środowiskowe `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` dotyczą tylko konta domyślnego.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przebieg parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i wymóg wzmianki
- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
