---
read_when:
    - Używasz pluginu voice-call i potrzebujesz punktów wejścia CLI
    - Potrzebujesz szybkich przykładów dla `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Dokumentacja referencyjna CLI dla `openclaw voicecall` (interfejs poleceń Plugin połączeń głosowych)
title: Połączenie głosowe
x-i18n:
    generated_at: "2026-05-01T09:57:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` to polecenie dostarczane przez Plugin. Pojawia się tylko wtedy, gdy Plugin połączeń głosowych jest zainstalowany i włączony.

Gdy Gateway działa, polecenia operacyjne (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` i `status`) są wysyłane do środowiska
uruchomieniowego połączeń głosowych tego Gateway. Jeśli żaden Gateway nie jest
osiągalny, używane jest zapasowe autonomiczne środowisko uruchomieniowe
CLI.

Główna dokumentacja:

- Plugin połączeń głosowych: [Voice Call](/pl/plugins/voice-call)

## Typowe polecenia

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` domyślnie wypisuje kontrole gotowości czytelne dla człowieka. Użyj `--json` dla
skryptów:

```bash
openclaw voicecall setup --json
```

`status` domyślnie wypisuje aktywne połączenia jako JSON. Przekaż `--call-id <id>`, aby sprawdzić
jedno połączenie.

W przypadku zewnętrznych dostawców (`twilio`, `telnyx`, `plivo`) konfiguracja musi rozpoznać publiczny
adres URL Webhook z `publicUrl`, tunelu lub ekspozycji Tailscale. Zapasowy
serwer local loopback/prywatny jest odrzucany, ponieważ operatorzy nie mogą go osiągnąć.

`smoke` uruchamia te same kontrole gotowości. Nie wykona prawdziwego połączenia telefonicznego,
chyba że obecne są zarówno `--to`, jak i `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Udostępnianie Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Uwaga dotycząca bezpieczeństwa: udostępniaj punkt końcowy Webhook tylko sieciom, którym ufasz. Gdy to możliwe, preferuj Tailscale Serve zamiast Funnel.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Plugin połączeń głosowych](/pl/plugins/voice-call)
