---
read_when:
    - Praca nad funkcjami kanału Nextcloud Talk
summary: Stan obsługi, możliwości i konfiguracja Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T08:59:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Status: dołączony Plugin (bot webhook). Obsługiwane są wiadomości bezpośrednie, pokoje, reakcje i wiadomości w Markdown.

## Dołączony Plugin

Nextcloud Talk jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc
standardowe buildy pakietowe nie wymagają osobnej instalacji.

Jeśli używasz starszego builda albo niestandardowej instalacji bez Nextcloud Talk,
zainstaluj go ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Lokalny checkout (przy uruchamianiu z repozytorium git):

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
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Włącz bota w ustawieniach docelowego pokoju.
4. Skonfiguruj OpenClaw:
   - Konfiguracja: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Albo zmienna środowiskowa: `NEXTCLOUD_TALK_BOT_SECRET` (tylko konto domyślne)

   Konfiguracja przez CLI:

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

- Boty nie mogą inicjować wiadomości bezpośrednich. Użytkownik musi najpierw napisać do bota.
- URL webhooka musi być osiągalny dla Gateway; ustaw `webhookPublicUrl`, jeśli używasz proxy.
- Wysyłanie mediów nie jest obsługiwane przez API bota; media są wysyłane jako URL-e.
- Ładunek webhooka nie rozróżnia wiadomości bezpośrednich od pokoi; ustaw `apiUser` + `apiPassword`, aby włączyć wyszukiwanie typu pokoju (w przeciwnym razie wiadomości bezpośrednie są traktowane jak pokoje).

## Kontrola dostępu (DM)

- Domyślnie: `channels.nextcloud-talk.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania.
- Zatwierdzanie przez:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Publiczne wiadomości bezpośrednie: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` dopasowuje tylko identyfikatory użytkowników Nextcloud; nazwy wyświetlane są ignorowane.

## Pokoje (grupy)

- Domyślnie: `channels.nextcloud-talk.groupPolicy = "allowlist"` (z bramkowaniem na wzmianki).
- Dodaj pokoje do listy dozwolonych przez `channels.nextcloud-talk.rooms`:

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

| Funkcja               | Status            |
| --------------------- | ----------------- |
| Wiadomości bezpośrednie | Obsługiwane     |
| Pokoje                | Obsługiwane       |
| Wątki                 | Nieobsługiwane    |
| Media                 | Tylko URL-e       |
| Reakcje               | Obsługiwane       |
| Natywne polecenia     | Nieobsługiwane    |

## Dokumentacja konfiguracji (Nextcloud Talk)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.nextcloud-talk.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.nextcloud-talk.baseUrl`: URL instancji Nextcloud.
- `channels.nextcloud-talk.botSecret`: współdzielony sekret bota.
- `channels.nextcloud-talk.botSecretFile`: ścieżka do sekretu w zwykłym pliku. Dowiązania symboliczne są odrzucane.
- `channels.nextcloud-talk.apiUser`: użytkownik API do wyszukiwania pokoi (wykrywanie DM).
- `channels.nextcloud-talk.apiPassword`: hasło API/aplikacji do wyszukiwania pokoi.
- `channels.nextcloud-talk.apiPasswordFile`: ścieżka do pliku z hasłem API.
- `channels.nextcloud-talk.webhookPort`: port listenera webhooka (domyślnie: 8788).
- `channels.nextcloud-talk.webhookHost`: host webhooka (domyślnie: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ścieżka webhooka (domyślnie: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: zewnętrznie osiągalny URL webhooka.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista dozwolonych dla DM (identyfikatory użytkowników). `open` wymaga `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista dozwolonych dla grup (identyfikatory użytkowników).
- `channels.nextcloud-talk.rooms`: ustawienia per pokój i lista dozwolonych.
- `channels.nextcloud-talk.historyLimit`: limit historii grupy (0 wyłącza).
- `channels.nextcloud-talk.dmHistoryLimit`: limit historii DM (0 wyłącza).
- `channels.nextcloud-talk.dms`: nadpisania per DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: rozmiar fragmentu tekstu wychodzącego (znaki).
- `channels.nextcloud-talk.chunkMode`: `length` (domyślnie) albo `newline`, aby dzielić po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.nextcloud-talk.blockStreaming`: wyłącza streaming bloków dla tego kanału.
- `channels.nextcloud-talk.blockStreamingCoalesce`: strojenie scalania streamingu bloków.
- `channels.nextcloud-talk.mediaMaxMb`: limit mediów przychodzących (MB).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie na wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
