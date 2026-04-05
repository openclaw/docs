---
read_when:
    - Praca nad funkcjami kanału Nextcloud Talk
summary: Stan obsługi Nextcloud Talk, możliwości i konfiguracja
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T13:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

Status: dołączony plugin (bot webhooków). Obsługiwane są wiadomości prywatne, pokoje, reakcje i wiadomości w Markdown.

## Dołączony plugin

Nextcloud Talk jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc
zwykłe spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Nextcloud Talk,
zainstaluj go ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Lokalny checkout (przy uruchamianiu z repozytorium git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Szczegóły: [Plugins](/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że plugin Nextcloud Talk jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Na swoim serwerze Nextcloud utwórz bota:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Włącz bota w ustawieniach docelowego pokoju.
4. Skonfiguruj OpenClaw:
   - Konfiguracja: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Lub zmienna środowiskowa: `NEXTCLOUD_TALK_BOT_SECRET` (tylko konto domyślne)
5. Uruchom ponownie gateway (lub dokończ konfigurację).

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

- Boty nie mogą inicjować wiadomości prywatnych. Użytkownik musi najpierw napisać do bota.
- URL webhooka musi być osiągalny dla Gateway; ustaw `webhookPublicUrl`, jeśli używasz proxy.
- Przesyłanie multimediów nie jest obsługiwane przez API bota; multimedia są wysyłane jako URL-e.
- Ładunek webhooka nie rozróżnia wiadomości prywatnych i pokoi; ustaw `apiUser` + `apiPassword`, aby włączyć sprawdzanie typu pokoju (w przeciwnym razie wiadomości prywatne są traktowane jak pokoje).

## Kontrola dostępu (wiadomości prywatne)

- Domyślnie: `channels.nextcloud-talk.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania.
- Zatwierdzanie przez:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Publiczne wiadomości prywatne: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` dopasowuje tylko identyfikatory użytkowników Nextcloud; nazwy wyświetlane są ignorowane.

## Pokoje (grupy)

- Domyślnie: `channels.nextcloud-talk.groupPolicy = "allowlist"` (z ograniczaniem do wzmianek).
- Dodaj pokoje do allowlisty za pomocą `channels.nextcloud-talk.rooms`:

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

- Aby nie zezwalać na żadne pokoje, pozostaw allowlistę pustą albo ustaw `channels.nextcloud-talk.groupPolicy="disabled"`.

## Możliwości

| Funkcja          | Status            |
| ---------------- | ----------------- |
| Wiadomości prywatne | Obsługiwane    |
| Pokoje           | Obsługiwane       |
| Wątki            | Nieobsługiwane    |
| Multimedia       | Tylko URL-e       |
| Reakcje          | Obsługiwane       |
| Polecenia natywne | Nieobsługiwane   |

## Dokumentacja konfiguracji (Nextcloud Talk)

Pełna konfiguracja: [Konfiguracja](/gateway/configuration)

Opcje dostawcy:

- `channels.nextcloud-talk.enabled`: włączanie/wyłączanie uruchamiania kanału.
- `channels.nextcloud-talk.baseUrl`: URL instancji Nextcloud.
- `channels.nextcloud-talk.botSecret`: współdzielony sekret bota.
- `channels.nextcloud-talk.botSecretFile`: ścieżka do sekretu w zwykłym pliku. Dowiązania symboliczne są odrzucane.
- `channels.nextcloud-talk.apiUser`: użytkownik API do sprawdzania pokoi (wykrywanie wiadomości prywatnych).
- `channels.nextcloud-talk.apiPassword`: hasło API/aplikacji do sprawdzania pokoi.
- `channels.nextcloud-talk.apiPasswordFile`: ścieżka do pliku z hasłem API.
- `channels.nextcloud-talk.webhookPort`: port nasłuchiwania webhooków (domyślnie: 8788).
- `channels.nextcloud-talk.webhookHost`: host webhooka (domyślnie: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ścieżka webhooka (domyślnie: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: zewnętrznie osiągalny URL webhooka.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlista wiadomości prywatnych (identyfikatory użytkowników). `open` wymaga `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: grupowa allowlista (identyfikatory użytkowników).
- `channels.nextcloud-talk.rooms`: ustawienia i allowlista dla poszczególnych pokoi.
- `channels.nextcloud-talk.historyLimit`: limit historii grupowej (0 wyłącza).
- `channels.nextcloud-talk.dmHistoryLimit`: limit historii wiadomości prywatnych (0 wyłącza).
- `channels.nextcloud-talk.dms`: nadpisania dla poszczególnych wiadomości prywatnych (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: rozmiar fragmentu tekstu wychodzącego (znaki).
- `channels.nextcloud-talk.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych wierszach (granice akapitów) przed dzieleniem według długości.
- `channels.nextcloud-talk.blockStreaming`: wyłączanie blokowego streamingu dla tego kanału.
- `channels.nextcloud-talk.blockStreamingCoalesce`: strojenie scalania blokowego streamingu.
- `channels.nextcloud-talk.mediaMaxMb`: limit multimediów przychodzących (MB).

## Powiązane

- [Przegląd kanałów](/channels) — wszystkie obsługiwane kanały
- [Parowanie](/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/channels/groups) — zachowanie czatów grupowych i ograniczanie do wzmianek
- [Routing kanałów](/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i utwardzanie
