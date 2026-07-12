---
read_when:
    - Korzystasz ze starego kanału BlueBubbles i musisz przejść na iMessage
    - Wybierasz obsługiwaną konfigurację iMessage w OpenClaw
    - Potrzebujesz krótkiego wyjaśnienia usunięcia BlueBubbles
summary: Obsługa BlueBubbles została usunięta z OpenClaw. W nowych i zmigrowanych konfiguracjach iMessage używaj dołączonego pluginu iMessage z imsg.
title: Usunięcie BlueBubbles i ścieżka iMessage w imsg
x-i18n:
    generated_at: "2026-07-12T14:47:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Usunięcie BlueBubbles i obsługa iMessage przez imsg

OpenClaw nie zawiera już kanału BlueBubbles. Obsługa iMessage odbywa się za pośrednictwem dołączonego pluginu `imessage`: Gateway uruchamia [`imsg`](https://github.com/steipete/imsg) jako proces potomny, lokalnie lub przez skrypt opakowujący SSH, i komunikuje się za pomocą JSON-RPC przez standardowe wejście i wyjście. Bez serwera, bez webhooka, bez portu.

Jeśli konfiguracja nadal zawiera `channels.bluebubbles`, przenieś ją do `channels.imessage`. Starszy adres dokumentacji `/channels/bluebubbles` przekierowuje do strony [Migracja z BlueBubbles](/pl/channels/imessage-from-bluebubbles), która zawiera pełną tabelę translacji konfiguracji i listę kontrolną przełączenia.

## Co się zmieniło

- Obsługiwana ścieżka iMessage nie korzysta z serwera HTTP BlueBubbles, trasy webhooka, hasła REST ani środowiska uruchomieniowego pluginu BlueBubbles.
- OpenClaw odczytuje i monitoruje Wiadomości za pośrednictwem `imsg` na Macu, na którym użytkownik jest zalogowany w aplikacji Messages.app.
- Podstawowe wysyłanie, odbieranie, historia i multimedia korzystają ze standardowych funkcji `imsg` oraz uprawnień systemu macOS.
- Zaawansowane działania (odpowiedzi w wątkach, reakcje tapback, edycja, cofanie wysłania, efekty, potwierdzenia odczytu, wskaźniki pisania i zarządzanie grupami) wymagają mostu prywatnego API: uruchom `imsg launch`, co wymaga wyłączenia SIP.
- Gatewaye działające w systemach Linux i Windows nadal mogą korzystać z iMessage, jeśli `channels.imessage.cliPath` wskazuje skrypt opakowujący SSH, który uruchamia `imsg` na zalogowanym Macu.

## Co zrobić

1. Zainstaluj i zweryfikuj `imsg` na Macu z aplikacją Wiadomości:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Przyznaj uprawnienia Full Disk Access i Automation kontekstowi procesu, w którym działają `imsg` i OpenClaw.

3. Przenieś starą konfigurację:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Uruchom ponownie Gateway i zweryfikuj działanie:

   ```bash
   openclaw channels status --probe
   ```

5. Przed usunięciem starego serwera BlueBubbles przetestuj wiadomości prywatne, grupy, załączniki oraz wszystkie używane działania prywatnego API.

## Uwagi dotyczące migracji

- `channels.bluebubbles.serverUrl` i `channels.bluebubbles.password` nie mają odpowiedników w iMessage; nie ma serwera, z którym trzeba się łączyć ani uwierzytelniać.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` i `actions.*` zachowują swoje znaczenie w `channels.imessage`.
- Opcja `channels.imessage.includeAttachments` jest nadal domyślnie wyłączona. Ustaw ją jawnie, jeśli przychodzące zdjęcia, notatki głosowe, filmy lub pliki mają trafiać do agenta.
- W przypadku `groupPolicy: "allowlist"` skopiuj stary blok `groups`, w tym ewentualny wpis wieloznaczny `"*"`. Listy dozwolonych nadawców grupowych i rejestr grup stanowią oddzielne mechanizmy kontroli dostępu; blok `groups` zawierający wpisy, ale bez pasującego `chat_id` (lub bez `"*"`) powoduje odrzucenie wiadomości podczas działania, a pusty blok `groups` generuje ostrzeżenie przy uruchamianiu, mimo że filtrowanie nadawców nadal przepuszcza wiadomości.
- Powiązania ACP z `match.channel: "bluebubbles"` należy zmienić na `"imessage"`.
- Stare klucze sesji BlueBubbles nie stają się kluczami sesji iMessage. Zatwierdzenia parowania są powiązane z identyfikatorami nadawców, więc skopiowane wpisy `allowFrom` nadal działają, ale historia rozmów zapisana pod kluczami sesji BlueBubbles nie jest przenoszona.

## Zobacz także

- [Migracja z BlueBubbles](/pl/channels/imessage-from-bluebubbles)
- [iMessage](/pl/channels/imessage)
- [Dokumentacja konfiguracji — iMessage](/pl/gateway/config-channels#imessage)
