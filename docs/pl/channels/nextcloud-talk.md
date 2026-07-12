---
read_when:
    - Praca nad funkcjami kanału Nextcloud Talk
summary: Stan obsługi, możliwości i konfiguracja Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T14:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk to dostępny do pobrania plugin kanału (`@openclaw/nextcloud-talk`), który łączy OpenClaw z samodzielnie hostowaną instancją Nextcloud za pośrednictwem bota webhooka Talk. Obsługiwane są wiadomości bezpośrednie, pokoje, reakcje i wiadomości w formacie Markdown; multimedia są wysyłane jako adresy URL.

## Instalacja

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Użyj samej specyfikacji pakietu, aby korzystać z bieżącego oficjalnego tagu wydania. Przypnij dokładną wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

Z lokalnego drzewa roboczego (przepływy programistyczne):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Po instalacji uruchom ponownie Gateway. Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Zainstaluj plugin (jak wyżej).
2. Utwórz bota na serwerze Nextcloud:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Zachowaj `--feature response`: bez tej opcji odpowiedzi wychodzące kończą się błędem 401. Napraw istniejącego bota za pomocą polecenia `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Włącz bota w ustawieniach docelowego pokoju.
4. Skonfiguruj OpenClaw:
   - Konfiguracja: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Lub zmienna środowiskowa: `NEXTCLOUD_TALK_BOT_SECRET` (tylko konto domyślne)

   Konfiguracja w CLI (`--url`/`--token` są aliasami jawnych pól; `nc-talk` i `nc` działają jako aliasy kanału):

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
- Adres URL webhooka musi być osiągalny z serwera Nextcloud; ustaw `webhookPublicUrl`, gdy Gateway znajduje się za serwerem proxy. Żądania webhooka są podpisywane algorytmem HMAC-SHA256 przy użyciu sekretu bota; żądania z nieprawidłowymi podpisami są odrzucane i podlegają ograniczeniu częstotliwości.
- Interfejs API bota nie obsługuje przesyłania multimediów; multimedia wychodzące są dołączane jako wiersz `Attachment: <url>`.
- Ładunek webhooka nie rozróżnia wiadomości bezpośrednich od pokojów; ustaw `apiUser` + `apiPassword`, aby włączyć sprawdzanie typu pokoju (wyniki są buforowane przez około 5 minut). Bez tych ustawień każda konwersacja jest traktowana jako pokój.
- Żądania wychodzące przechodzą przez zabezpieczenie SSRF. W przypadku hosta Nextcloud w zaufanej sieci prywatnej/wewnętrznej włącz obsługę za pomocą `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Gdy ustawiono `apiUser`/`apiPassword` i `webhookPublicUrl`, polecenie `openclaw channels status` sprawdza bota i ostrzega o braku funkcji `response`.

## Kontrola dostępu (wiadomości bezpośrednie)

- Domyślnie: `channels.nextcloud-talk.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania.
- Zatwierdź za pomocą:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Publiczne wiadomości bezpośrednie: `channels.nextcloud-talk.dmPolicy="open"` wraz z `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` dopasowuje wyłącznie identyfikatory użytkowników Nextcloud (małymi literami); nazwy wyświetlane są ignorowane.

## Pokoje (grupy)

- Domyślnie: `channels.nextcloud-talk.groupPolicy = "allowlist"` (wymagane jest wspomnienie).
- Dodaj pokoje do listy dozwolonych za pomocą `channels.nextcloud-talk.rooms`, używając tokenu pokoju jako klucza; `"*"` ustawia domyślną wartość wieloznaczną:

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

- Klucze dla poszczególnych pokojów: `requireMention` (domyślnie true), `enabled` (false wyłącza pokój), `allowFrom` (lista dozwolonych nadawców dla pokoju), `tools` (nadpisania dozwolonych/zabronionych narzędzi), `skills` (ograniczenie ładowanych Skills), `systemPrompt`.
- Aby nie zezwalać na żadne pokoje, pozostaw listę dozwolonych pustą lub ustaw `channels.nextcloud-talk.groupPolicy="disabled"`.

## Możliwości

| Funkcja                | Stan                 |
| ---------------------- | -------------------- |
| Wiadomości bezpośrednie | Obsługiwane          |
| Pokoje                 | Obsługiwane          |
| Wątki                  | Nieobsługiwane       |
| Multimedia             | Tylko adresy URL     |
| Reakcje                | Obsługiwane          |
| Polecenia natywne      | Nieobsługiwane       |

## Dokumentacja konfiguracji (Nextcloud Talk)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.nextcloud-talk.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.nextcloud-talk.baseUrl`: adres URL instancji Nextcloud.
- `channels.nextcloud-talk.botSecret`: współdzielony sekret bota (ciąg znaków lub odwołanie do sekretu).
- `channels.nextcloud-talk.botSecretFile`: ścieżka zwykłego pliku z sekretem. Dowiązania symboliczne są odrzucane.
- `channels.nextcloud-talk.apiUser`: użytkownik API do sprawdzania pokojów (wykrywania wiadomości bezpośrednich) i kontroli stanu.
- `channels.nextcloud-talk.apiPassword`: hasło API/aplikacji do sprawdzania pokojów.
- `channels.nextcloud-talk.apiPasswordFile`: ścieżka pliku z hasłem API.
- `channels.nextcloud-talk.webhookPort`: port procesu nasłuchującego webhooka (domyślnie: 8788).
- `channels.nextcloud-talk.webhookHost`: host webhooka (domyślnie: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ścieżka webhooka (domyślnie: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: zewnętrznie osiągalny adres URL webhooka.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing). `open` wymaga `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: lista dozwolonych nadawców wiadomości bezpośrednich (identyfikatory użytkowników).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (domyślnie: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: lista dozwolonych nadawców w pokojach (identyfikatory użytkowników); jeśli nie jest ustawiona, używana jest wartość `allowFrom`.
- `channels.nextcloud-talk.rooms`: ustawienia i lista dozwolonych dla poszczególnych pokojów (patrz wyżej).
- Do statycznych grup dostępu nadawców można odwoływać się z `allowFrom` i `groupAllowFrom` za pomocą `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: limit historii grupy (0 wyłącza).
- `channels.nextcloud-talk.dmHistoryLimit`: limit historii wiadomości bezpośrednich (0 wyłącza).
- `channels.nextcloud-talk.dms`: nadpisania dla poszczególnych wiadomości bezpośrednich z identyfikatorem użytkownika jako kluczem (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: rozmiar fragmentu tekstu wychodzącego w znakach (domyślnie: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić tekst w pustych wierszach (granicach akapitów) przed podziałem według długości.
- `channels.nextcloud-talk.blockStreaming`: wyłącza strumieniowanie blokowe dla tego kanału.
- `channels.nextcloud-talk.blockStreamingCoalesce`: dostrajanie scalania strumieniowania blokowego.
- `channels.nextcloud-talk.responsePrefix`: prefiks odpowiedzi wychodzących.
- `channels.nextcloud-talk.markdown.tables`: tryb renderowania tabel Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: limit multimediów przychodzących (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: zezwala hostom Nextcloud w sieci prywatnej/wewnętrznej na przejście przez zabezpieczenie SSRF.
- `channels.nextcloud-talk.accounts.<id>`: nadpisania dla poszczególnych kont (te same klucze); `defaultAccount` wybiera konto domyślne. Zmienne środowiskowe `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` mają zastosowanie wyłącznie do konta domyślnego.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przebieg parowania
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i wymaganie wspomnienia
- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
