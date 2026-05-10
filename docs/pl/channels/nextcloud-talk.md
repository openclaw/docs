---
read_when:
    - Praca nad funkcjami kanału Nextcloud Talk
summary: Status obsługi, możliwości i konfiguracja Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:23:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: dołączony Plugin (bot Webhook). Obsługiwane są wiadomości bezpośrednie, pokoje, reakcje i wiadomości markdown.

## Dołączony Plugin

Nextcloud Talk jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc
standardowe kompilacje pakietowe nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza Nextcloud Talk,
zainstaluj pakiet npm bezpośrednio:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Użyj samej nazwy pakietu, aby podążać za bieżącym oficjalnym tagiem wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz odtwarzalnej instalacji.

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Nextcloud Talk jest dostępny.
   - Bieżące pakietowe wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Na swoim serwerze Nextcloud utwórz bota:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. Włącz bota w ustawieniach docelowego pokoju.
4. Skonfiguruj OpenClaw:
   - Konfiguracja: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Albo env: `NEXTCLOUD_TALK_BOT_SECRET` (tylko konto domyślne)

   Konfiguracja CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Równoważne pola jawne:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Sekret oparty na pliku:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Uruchom ponownie Gateway (albo dokończ konfigurację).

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

- Boty nie mogą inicjować DM. Użytkownik musi najpierw napisać do bota.
- Adres URL Webhook musi być osiągalny przez Gateway; ustaw `webhookPublicUrl`, jeśli jest za proxy.
- Przesyłanie multimediów nie jest obsługiwane przez API bota; multimedia są wysyłane jako adresy URL.
- Ładunek Webhook nie rozróżnia DM i pokoi; ustaw `apiUser` + `apiPassword`, aby włączyć wyszukiwanie typu pokoju (w przeciwnym razie DM są traktowane jak pokoje).

## Kontrola dostępu (DM)

- Domyślnie: `channels.nextcloud-talk.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania.
- Zatwierdź przez:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Publiczne DM: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` dopasowuje tylko identyfikatory użytkowników Nextcloud; nazwy wyświetlane są ignorowane.

## Pokoje (grupy)

- Domyślnie: `channels.nextcloud-talk.groupPolicy = "allowlist"` (bramka przez wzmiankę).
- Dodaj pokoje do listy dozwolonych za pomocą `channels.nextcloud-talk.rooms`:

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

- Aby nie zezwalać na żadne pokoje, pozostaw listę dozwolonych pustą albo ustaw `channels.nextcloud-talk.groupPolicy="disabled"`.

## Możliwości

| Funkcja             | Status          |
| ------------------- | --------------- |
| Wiadomości bezpośrednie | Obsługiwane     |
| Pokoje              | Obsługiwane     |
| Wątki               | Nieobsługiwane  |
| Multimedia          | Tylko URL       |
| Reakcje             | Obsługiwane     |
| Natywne polecenia   | Nieobsługiwane  |

## Dokumentacja konfiguracji (Nextcloud Talk)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.nextcloud-talk.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.nextcloud-talk.baseUrl`: adres URL instancji Nextcloud.
- `channels.nextcloud-talk.botSecret`: współdzielony sekret bota.
- `channels.nextcloud-talk.botSecretFile`: ścieżka do sekretu w zwykłym pliku. Dowiązania symboliczne są odrzucane.
- `channels.nextcloud-talk.apiUser`: użytkownik API do wyszukiwania pokoi (wykrywanie DM).
- `channels.nextcloud-talk.apiPassword`: hasło API/aplikacji do wyszukiwania pokoi.
- `channels.nextcloud-talk.apiPasswordFile`: ścieżka do pliku hasła API.
- `channels.nextcloud-talk.webhookPort`: port nasłuchiwania Webhook (domyślnie: 8788).
- `channels.nextcloud-talk.webhookHost`: host Webhook (domyślnie: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ścieżka Webhook (domyślnie: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: zewnętrznie osiągalny adres URL Webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista dozwolonych DM (identyfikatory użytkowników). `open` wymaga `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista dozwolonych grup (identyfikatory użytkowników).
- `channels.nextcloud-talk.rooms`: ustawienia dla poszczególnych pokoi i lista dozwolonych.
- Statyczne grupy dostępu nadawców mogą być przywoływane z `allowFrom` i `groupAllowFrom` za pomocą `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: limit historii grupy (0 wyłącza).
- `channels.nextcloud-talk.dmHistoryLimit`: limit historii DM (0 wyłącza).
- `channels.nextcloud-talk.dms`: nadpisania dla poszczególnych DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: rozmiar wychodzącego fragmentu tekstu (znaki).
- `channels.nextcloud-talk.chunkMode`: `length` (domyślnie) albo `newline`, aby dzielić według pustych wierszy (granic akapitów) przed dzieleniem według długości.
- `channels.nextcloud-talk.blockStreaming`: wyłącza strumieniowanie bloków dla tego kanału.
- `channels.nextcloud-talk.blockStreamingCoalesce`: dostrajanie scalania strumieniowania bloków.
- `channels.nextcloud-talk.mediaMaxMb`: limit przychodzących multimediów (MB).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
