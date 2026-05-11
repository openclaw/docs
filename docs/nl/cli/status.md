---
read_when:
    - Je wilt een snelle diagnose van de kanaalstatus + recente sessieontvangers
    - Je wilt een plakbare "alles"-status voor foutopsporing
summary: CLI-referentie voor `openclaw status` (diagnostiek, controles, momentopnamen van gebruik)
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:27:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
    source_path: cli/status.md
    workflow: 16
---

Diagnostiek voor kanalen + sessies.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Opmerkingen:

- `--deep` voert live probes uit (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Gewoon `openclaw status` blijft op het snelle alleen-lezen-pad en markeert geheugen als `not checked` in plaats van niet beschikbaar wanneer het geheugeninspectie overslaat. Zware beveiligingsaudit, Plugin-compatibiliteit en memory-vector-probes blijven voor `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` en `openclaw memory status --deep`.
- `status --json --all` rapporteert geheugendetails uit de actieve geheugen-Plugin-runtime die door `plugins.slots.memory` is geselecteerd. Aangepaste geheugen-Plugins kunnen ingebouwde `agents.defaults.memorySearch.enabled` uitgeschakeld laten en nog steeds hun eigen bestanden, chunks, vector- en FTS-status rapporteren.
- `--usage` drukt genormaliseerde gebruiksvensters van providers af als `X% left`.
- Sessie-statusuitvoer scheidt `Execution:` van `Runtime:`. `Execution` is het sandbox-pad (`direct`, `docker/*`), terwijl `Runtime` aangeeft of de sessie `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend gebruikt, zoals `codex (acp/acpx)`. Zie [Agent-runtimes](/nl/concepts/agent-runtimes) voor het onderscheid tussen provider/model/runtime.
- De ruwe velden `usage_percent` / `usagePercent` van MiniMax zijn resterend quotum, dus OpenClaw keert ze om vóór weergave; op telling gebaseerde velden krijgen voorrang wanneer ze aanwezig zijn. `model_remains`-reacties geven de voorkeur aan de chat-modelvermelding, leiden waar nodig het vensterlabel af uit tijdstempels en nemen de modelnaam op in het planlabel.
- Wanneer de huidige sessiesnapshot beperkt is, kan `/status` token- en cachetellers aanvullen vanuit de meest recente transcriptgebruik-log. Bestaande live-waarden die niet nul zijn, blijven voorrang houden boven fallback-waarden uit het transcript.
- `/status` bevat compacte uptime van het Gateway-proces en uptime van het hostsysteem.
- Transcript-fallback kan ook het actieve runtime-modellabel herstellen wanneer dit ontbreekt in de live-sessievermelding. Als dat transcriptmodel verschilt van het geselecteerde model, bepaalt status het contextvenster op basis van het herstelde runtime-model in plaats van het geselecteerde model.
- Voor promptgrootte-boekhouding geeft transcript-fallback de voorkeur aan het grotere promptgerichte totaal wanneer sessiemetadata ontbreken of kleiner zijn, zodat sessies van aangepaste providers niet terugvallen naar tokenweergaven van `0`.
- Uitvoer bevat sessiestores per agent wanneer meerdere agents zijn geconfigureerd.
- Overzicht bevat de installatie-/runtime-status van Gateway + node-hostservice wanneer beschikbaar.
- Overzicht bevat updatekanaal + git-SHA (voor source-checkouts).
- Update-informatie verschijnt in het Overzicht; als er een update beschikbaar is, drukt status een hint af om `openclaw update` uit te voeren (zie [Bijwerken](/nl/install/updating)).
- Fouten bij het vernieuwen van modelprijzen worden weergegeven als optionele prijswaarschuwingen. Ze betekenen
  niet dat de Gateway of kanalen ongezond zijn.
- Alleen-lezen-statusoppervlakken (`status`, `status --json`, `status --all`) lossen ondersteunde SecretRefs voor hun doelconfiguratiepaden op wanneer mogelijk.
- Als een ondersteunde kanaal-SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, blijft status alleen-lezen en rapporteert het verslechterde uitvoer in plaats van te crashen. Menselijke uitvoer toont waarschuwingen zoals "configured token unavailable in this command path", en JSON-uitvoer bevat `secretDiagnostics`.
- Wanneer opdrachtlokale SecretRef-resolutie slaagt, geeft status de voorkeur aan de opgeloste snapshot en wist tijdelijke kanaalmarkeringen voor "secret unavailable" uit de uiteindelijke uitvoer.
- `status --all` bevat een overzichtsrij voor Secrets en een diagnosesectie die geheime diagnostiek samenvat (ingekort voor leesbaarheid) zonder het genereren van het rapport te stoppen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/gateway/doctor)
