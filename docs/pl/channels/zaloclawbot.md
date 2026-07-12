---
read_when:
    - Potrzebujesz osobistego bota-asystenta Zalo z logowaniem za pomocą kodu QR
    - Instalujesz Plugin kanału openclaw-zaloclawbot lub rozwiązujesz związane z nim problemy
summary: Konfiguracja kanału Zalo ClawBot za pomocą zewnętrznego pluginu openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T14:50:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw łączy się z Zalo ClawBot za pośrednictwem zewnętrznego pluginu `@zalo-platforms/openclaw-zaloclawbot` wymienionego w katalogu. Logowanie odbywa się za pomocą kodu QR Zalo Mini App; identyfikator pluginu w konfiguracji to `openclaw-zaloclawbot`.

## Zgodność

| Wersja pluginu | Wersja OpenClaw | dist-tag npm | Stan          |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.4          | >=2026.4.10      | `latest`     | Aktywny / Beta |

## Wymagania wstępne

- Node.js >= 22
- Zainstalowany [OpenClaw](https://docs.openclaw.ai/install) (dostępny CLI `openclaw`)
- Konto Zalo na urządzeniu mobilnym do zeskanowania kodu QR logowania

## Instalacja za pomocą onboardingu (zalecana)

```bash
openclaw onboard
```

Wybierz **Zalo ClawBot** z menu kanałów. Kreator instaluje plugin z oficjalnego katalogu (po zweryfikowaniu integralności), wyświetla kod QR logowania w terminalu i kończy konfigurację kanału po zeskanowaniu go w aplikacji Zalo.

## Instalacja ręczna

Aby dodać kanał do już skonfigurowanego Gateway:

### 1. Zainstaluj plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Użyj dokładnie tej przypiętej wersji, aby podczas instalacji OpenClaw zweryfikował pakiet względem skrótu integralności z katalogu.

### 2. Włącz plugin w konfiguracji

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Wygeneruj kod QR i zaloguj się

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Zeskanuj kod QR wyświetlony w terminalu za pomocą mobilnej aplikacji Zalo, zaakceptuj warunki użytkowania w Zalo Mini App i autoryzuj sesję.

### 4. Uruchom ponownie Gateway

```bash
openclaw gateway restart
```

## Jak to działa

W przeciwieństwie do standardowego kanału Zalo, który wymaga zarejestrowania własnego oficjalnego konta Zalo (OA) i skonfigurowania statycznych danych uwierzytelniających dewelopera, Zalo ClawBot jest **osobistym asystentem powiązanym z właścicielem**, działającym we współdzielonej oficjalnej infrastrukturze:

1. **Onboarding:** kod QR prowadzi do Zalo Mini App, która wiąże nowo utworzonego prywatnego bota działającego w ramach współdzielonego oficjalnego OA bezpośrednio z identyfikatorem użytkownika Zalo.
2. **Prywatność dzięki powiązaniu z właścicielem:** bot komunikuje się wyłącznie ze swoim właścicielem. Wiadomości od innych użytkowników są odrzucane na poziomie platformy.
3. **Oficjalna ścieżka API:** plugin korzysta z interfejsów API Zalo Bot Platform, a nie z automatyzacji przeglądarki ani sesji internetowej.

## Szczegóły techniczne

Plugin komunikuje się z Zalo za pośrednictwem trwałej pętli długiego odpytywania (`getUpdates`). Webhooki są domyślnie wyłączone w przypadku lokalnych uruchomień Gateway na komputerze lub w terminalu. Wiadomości są przetwarzane po stronie klienta i odwzorowywane na lokalne środowisko wykonawcze agenta.

Plugin zarządza danymi uwierzytelniającymi bota w katalogu stanu OpenClaw. Traktuj ten katalog jako poufny i obejmij go taką samą polityką kontroli dostępu oraz tworzenia kopii zapasowych jak pozostałe dane stanu OpenClaw.

Kod wykonawczy tego pluginu znajduje się w całości w zewnętrznym pakiecie `@zalo-platforms/openclaw-zaloclawbot`; opisane poniżej szczegóły zachowania wykraczające poza instalację i konfigurację pochodzą od opiekunów pluginu i nie zostały zweryfikowane względem kodu źródłowego rdzenia OpenClaw.

## Rozwiązywanie problemów

- **Przekroczenie limitu czasu logowania kodem QR:** ze względów bezpieczeństwa token logowania (`zbsk`) wygasa po 5 minutach. Jeśli kod QR wygaśnie przed jego zeskanowaniem, ponownie uruchom polecenie logowania, aby wygenerować nowy.
- **Gateway nie może się załadować:** upewnij się, że wersja OpenClaw na hoście to `2026.4.10` lub nowsza. Starsze wersje nie obsługują rejestru instalacji zewnętrznych pluginów npm wymaganego przez ten identyfikator.

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Zalo](/pl/channels/zalo) — dołączony kanał Zalo Bot Creator / Marketplace
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie w wiadomościach prywatnych i przebieg parowania
- [Pluginy](/pl/tools/plugin) — instalowanie pluginów i zarządzanie nimi
